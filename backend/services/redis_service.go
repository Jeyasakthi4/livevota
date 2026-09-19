package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/go-redis/redis/v8"
	"pulsepoll/backend/models"
)

type RedisService struct {
	client *redis.Client
}

var ErrAlreadyVoted = errors.New("voter has already participated in this poll")

func NewRedisService() *RedisService {
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "127.0.0.1:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:         redisAddr,
		Password:     os.Getenv("REDIS_PASSWORD"),
		DB:           0,
		DialTimeout:  3 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("[Redis Warning] Failed to connect to Redis at %s: %v. Using fallback mode.", redisAddr, err)
	} else {
		log.Printf("[Redis] Successfully connected to Redis at %s", redisAddr)
	}

	return &RedisService{client: rdb}
}

// Client returns the underlying Redis client
func (r *RedisService) Client() *redis.Client {
	return r.client
}

// HasVoted checks whether voter fingerprint is present in Redis set
func (r *RedisService) HasVoted(ctx context.Context, pollID, voterID string) (bool, error) {
	key := fmt.Sprintf("poll:%s:voters", pollID)
	return r.client.SIsMember(ctx, key, voterID).Result()
}

// RecordVoteAtomic executes an atomic deduplication + vote count increment in Redis
// 1. SADD poll:{id}:voters voterID -> If 0, voter has already voted (rejects duplicates atomically)
// 2. HINCRBY poll:{id}:votes optionID 1 -> Increments option counter in Redis Hash
// 3. INCR poll:{id}:total_votes -> Increments overall counter
func (r *RedisService) RecordVoteAtomic(ctx context.Context, pollID, optionID, voterID string) (map[string]int64, int64, error) {
	voterSetKey := fmt.Sprintf("poll:%s:voters", pollID)
	votesHashKey := fmt.Sprintf("poll:%s:votes", pollID)
	totalKey := fmt.Sprintf("poll:%s:total_votes", pollID)

	// Step 1: Atomic duplicate prevention via Redis Set
	added, err := r.client.SAdd(ctx, voterSetKey, voterID).Result()
	if err != nil {
		return nil, 0, err
	}
	if added == 0 {
		return nil, 0, ErrAlreadyVoted
	}

	// Step 2: Atomic Pipeline for counters
	pipe := r.client.TxPipeline()
	pipe.HIncrBy(ctx, votesHashKey, optionID, 1)
	pipe.Incr(ctx, totalKey)
	pipe.HGetAll(ctx, votesHashKey)

	cmds, err := pipe.Exec(ctx)
	if err != nil {
		// Rollback voter set entry if pipeline fails
		r.client.SRem(ctx, voterSetKey, voterID)
		return nil, 0, err
	}

	totalVotes := cmds[1].(*redis.IntCmd).Val()
	rawMap := cmds[2].(*redis.StringStringMapCmd).Val()

	optionVotes := make(map[string]int64)
	for k, v := range rawMap {
		count, _ := strconv.ParseInt(v, 10, 64)
		optionVotes[k] = count
	}

	return optionVotes, totalVotes, nil
}

// GetLiveResults reads current tallies directly from high-speed Redis Hash cache
func (r *RedisService) GetLiveResults(ctx context.Context, pollID string) (map[string]int64, int64, error) {
	votesHashKey := fmt.Sprintf("poll:%s:votes", pollID)
	totalKey := fmt.Sprintf("poll:%s:total_votes", pollID)

	pipe := r.client.Pipeline()
	votesCmd := pipe.HGetAll(ctx, votesHashKey)
	totalCmd := pipe.Get(ctx, totalKey)

	_, err := pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		return nil, 0, err
	}

	rawMap := votesCmd.Val()
	optionVotes := make(map[string]int64)
	for k, v := range rawMap {
		count, _ := strconv.ParseInt(v, 10, 64)
		optionVotes[k] = count
	}

	var totalVotes int64
	if totalStr := totalCmd.Val(); totalStr != "" {
		totalVotes, _ = strconv.ParseInt(totalStr, 10, 64)
	}

	return optionVotes, totalVotes, nil
}

// PublishVoteEvent broadcasts live voting updates via Redis Pub/Sub to all connected audience nodes
func (r *RedisService) PublishVoteEvent(ctx context.Context, pollID string, event models.VoteEvent) error {
	channel := fmt.Sprintf("channel:poll:%s", pollID)
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return r.client.Publish(ctx, channel, data).Err()
}

// SubscribePollEvents returns a PubSub subscription to a poll's live event channel
func (r *RedisService) SubscribePollEvents(ctx context.Context, pollID string) *redis.PubSub {
	channel := fmt.Sprintf("channel:poll:%s", pollID)
	return r.client.Subscribe(ctx, channel)
}

// InitializePollInRedis seeds the Redis Hash with initial zero counts for fast read availability
func (r *RedisService) InitializePollInRedis(ctx context.Context, poll models.Poll) error {
	votesHashKey := fmt.Sprintf("poll:%s:votes", poll.ID)
	pipe := r.client.Pipeline()

	for _, opt := range poll.Options {
		pipe.HSetNX(ctx, votesHashKey, opt.ID, opt.Votes)
	}
	pipe.Set(ctx, fmt.Sprintf("poll:%s:total_votes", poll.ID), poll.TotalVotes, 0)
	pipe.Set(ctx, fmt.Sprintf("code:%s", poll.Code), poll.ID, 0)

	_, err := pipe.Exec(ctx)
	return err
}

// GetPollIDByCode resolves 6-digit shortcode from Redis cache
func (r *RedisService) GetPollIDByCode(ctx context.Context, code string) (string, error) {
	key := fmt.Sprintf("code:%s", code)
	return r.client.Get(ctx, key).Result()
}

// TrackPresence increments viewer count in Redis and returns active count
func (r *RedisService) TrackPresence(ctx context.Context, pollID, clientID string) (int64, error) {
	key := fmt.Sprintf("poll:%s:presence", pollID)
	r.client.SAdd(ctx, key, clientID)
	r.client.Expire(ctx, key, 30*time.Second)
	return r.client.SCard(ctx, key).Result()
}

// RemovePresence removes disconnected viewer
func (r *RedisService) RemovePresence(ctx context.Context, pollID, clientID string) {
	key := fmt.Sprintf("poll:%s:presence", pollID)
	r.client.SRem(ctx, key, clientID)
}

// GetTelemetry returns live Redis performance metrics for architecture transparency
func (r *RedisService) GetTelemetry(ctx context.Context) (map[string]interface{}, error) {
	info, err := r.client.Info(ctx, "server", "clients", "memory", "stats").Result()
	if err != nil {
		return nil, err
	}
	dbsize, _ := r.client.DBSize(ctx).Result()

	return map[string]interface{}{
		"status":      "connected",
		"dbsize_keys": dbsize,
		"info_raw":    info,
	}, nil
}
