package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"pulsepoll/backend/models"
	"pulsepoll/backend/services"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow cross-origin WebSocket connections in dev & container environments
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type PollHandler struct {
	mongo *services.MongoService
	redis *services.RedisService
	// Local hub to broadcast Redis pub/sub events to connected WebSockets on this instance
	hubMu      sync.RWMutex
	pollHubs   map[string]map[*websocket.Conn]bool
}

func NewPollHandler(mongo *services.MongoService, redis *services.RedisService) *PollHandler {
	return &PollHandler{
		mongo:    mongo,
		redis:    redis,
		pollHubs: make(map[string]map[*websocket.Conn]bool),
	}
}

func generateShortCode() string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 6)
	for i := range b {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		b[i] = charset[num.Int64()]
	}
	return string(b)
}

func generateID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

var defaultColors = []string{
	"#6366F1", // Indigo
	"#EC4899", // Pink
	"#10B981", // Emerald
	"#F59E0B", // Amber
	"#3B82F6", // Blue
	"#8B5CF6", // Purple
	"#14B8A6", // Teal
	"#EF4444", // Red
}

// CreatePoll handles validated poll creation (enforces authentication)
func (h *PollHandler) CreatePoll(c *gin.Context) {
	var req models.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed for poll creation",
			"details": err.Error(),
		})
		return
	}

	// Validate options uniqueness
	cleanedOptions := make([]string, 0, len(req.Options))
	seen := make(map[string]bool)
	for _, opt := range req.Options {
		trimmed := strings.TrimSpace(opt)
		if trimmed == "" {
			continue
		}
		lower := strings.ToLower(trimmed)
		if seen[lower] {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Duplicate option found: '%s'. Options must be unique.", trimmed),
			})
			return
		}
		seen[lower] = true
		cleanedOptions = append(cleanedOptions, trimmed)
	}

	if len(cleanedOptions) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "At least 2 distinct options are required to create a poll",
		})
		return
	}

	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")
	creatorID := ""
	if userID != nil {
		creatorID = userID.(string)
	}
	creatorName := "Anonymous Organizer"
	if username != nil && username.(string) != "" {
		creatorName = username.(string)
	}

	pollID := "poll_" + generateID()
	code := generateShortCode()

	options := make([]models.Option, len(cleanedOptions))
	for i, text := range cleanedOptions {
		color := defaultColors[i%len(defaultColors)]
		options[i] = models.Option{
			ID:         fmt.Sprintf("opt_%d", i+1),
			Text:       text,
			Votes:      0,
			Percentage: 0,
			Color:      color,
		}
	}

	now := time.Now()
	var expiresAt *time.Time
	if req.ExpiresInMinutes > 0 {
		exp := now.Add(time.Duration(req.ExpiresInMinutes) * time.Minute)
		expiresAt = &exp
	}

	poll := models.Poll{
		ID:            pollID,
		Code:          code,
		Title:         strings.TrimSpace(req.Title),
		Description:   strings.TrimSpace(req.Description),
		Options:       options,
		CreatorID:     creatorID,
		CreatorName:   creatorName,
		IsClosed:      false,
		AllowMultiple: req.AllowMultiple,
		IsAnonymous:   req.IsAnonymous,
		TotalVotes:    0,
		CreatedAt:     now,
		ExpiresAt:     expiresAt,
	}

	// 1. Persist to MongoDB
	if err := h.mongo.CreatePoll(c.Request.Context(), poll); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist poll to database"})
		return
	}

	// 2. Initialize fast live counters in Redis
	if err := h.redis.InitializePollInRedis(c.Request.Context(), poll); err != nil {
		log.Printf("[Redis Warning] Failed to initialize poll keys in Redis: %v", err)
	}

	c.JSON(http.StatusCreated, poll)
}

// GetPoll retrieves poll with live Redis counters
func (h *PollHandler) GetPoll(c *gin.Context) {
	idOrCode := c.Param("id")

	var poll models.Poll
	var err error

	// Try lookup by ID first, then by code
	poll, err = h.mongo.GetPollByID(c.Request.Context(), idOrCode)
	if err != nil {
		poll, err = h.mongo.GetPollByCode(c.Request.Context(), strings.ToUpper(idOrCode))
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
			return
		}
	}

	// Fetch high-speed live tallies from Redis Hash
	liveVotes, liveTotal, redisErr := h.redis.GetLiveResults(c.Request.Context(), poll.ID)
	if redisErr == nil && (liveTotal > 0 || len(liveVotes) > 0) {
		poll.TotalVotes = liveTotal
		for i, opt := range poll.Options {
			if count, ok := liveVotes[opt.ID]; ok {
				poll.Options[i].Votes = count
				if liveTotal > 0 {
					poll.Options[i].Percentage = float64(count) / float64(liveTotal) * 100
				}
			}
		}
	}

	// Check if voter has already participated
	voterID := c.Query("voter_id")
	hasVoted := false
	if voterID != "" {
		hasVoted, _ = h.redis.HasVoted(c.Request.Context(), poll.ID, voterID)
	}

	c.JSON(http.StatusOK, gin.H{
		"poll":      poll,
		"has_voted": hasVoted,
	})
}

// Vote handles real-time audience voting with Redis atomic deduplication and pub/sub broadcast
func (h *PollHandler) Vote(c *gin.Context) {
	pollID := c.Param("id")

	var req models.VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed for vote submission",
			"details": err.Error(),
		})
		return
	}

	// Verify poll exists
	poll, err := h.mongo.GetPollByID(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	if poll.IsClosed {
		c.JSON(http.StatusForbidden, gin.H{"error": "Voting on this poll has been closed by the organizer"})
		return
	}

	if poll.ExpiresAt != nil && time.Now().After(*poll.ExpiresAt) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Voting has expired for this poll"})
		return
	}

	// Validate option exists
	validOption := false
	for _, opt := range poll.Options {
		if opt.ID == req.OptionID {
			validOption = true
			break
		}
	}
	if !validOption {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid option selected"})
		return
	}

	// REALTIME REDIS WORK:
	// 1. Redis Set SADD prevents duplicate voting atomically
	// 2. Redis Hash HINCRBY increments votes atomically
	// 3. Redis Pub/Sub broadcasts event to all live WebSocket subscribers
	optionVotes, totalVotes, err := h.redis.RecordVoteAtomic(c.Request.Context(), pollID, req.OptionID, req.VoterID)
	if err != nil {
		if err == services.ErrAlreadyVoted {
			c.JSON(http.StatusConflict, gin.H{
				"error": "You have already voted in this poll. Duplicate voting is prevented.",
				"code":  "ALREADY_VOTED",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record vote in realtime engine"})
		return
	}

	// Construct Realtime Vote Event
	voteEvent := models.VoteEvent{
		Type:        "vote",
		PollID:      pollID,
		OptionID:    req.OptionID,
		TotalVotes:  totalVotes,
		OptionVotes: optionVotes,
		VoterID:     req.VoterID,
		VoterName:   req.VoterName,
		Timestamp:   time.Now(),
		IsClosed:    poll.IsClosed,
	}

	// Broadcast via Redis Pub/Sub (meaningful realtime coordination)
	_ = h.redis.PublishVoteEvent(c.Request.Context(), pollID, voteEvent)

	// Broadcast to local WebSockets immediately
	h.broadcastToLocalHub(pollID, voteEvent)

	// Asynchronously sync persistent tallies to MongoDB
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = h.mongo.UpdatePollVotes(ctx, pollID, optionVotes, totalVotes)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":      "Vote successfully recorded",
		"total_votes":  totalVotes,
		"option_votes": optionVotes,
	})
}

// ListPolls returns list of polls created by user or all active public polls
func (h *PollHandler) ListPolls(c *gin.Context) {
	creatorID := c.Query("creator_id")
	polls, err := h.mongo.ListPolls(c.Request.Context(), creatorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch polls"})
		return
	}

	// Enhance with live Redis counts
	for i := range polls {
		liveVotes, liveTotal, rErr := h.redis.GetLiveResults(c.Request.Context(), polls[i].ID)
		if rErr == nil && liveTotal > 0 {
			polls[i].TotalVotes = liveTotal
			for j, opt := range polls[i].Options {
				if count, ok := liveVotes[opt.ID]; ok {
					polls[i].Options[j].Votes = count
					polls[i].Options[j].Percentage = float64(count) / float64(liveTotal) * 100
				}
			}
		}
	}

	c.JSON(http.StatusOK, polls)
}

// ToggleStatus closes or reopens a poll (requires creator auth)
func (h *PollHandler) ToggleStatus(c *gin.Context) {
	pollID := c.Param("id")
	var req struct {
		IsClosed bool `json:"is_closed"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	poll, err := h.mongo.GetPollByID(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if poll.CreatorID != "" && (userID == nil || poll.CreatorID != userID.(string)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the poll creator can change poll status"})
		return
	}

	_ = h.mongo.UpdatePollStatus(c.Request.Context(), pollID, req.IsClosed)

	// Broadcast status event via Redis Pub/Sub
	statusEvent := models.VoteEvent{
		Type:       "status",
		PollID:     pollID,
		TotalVotes: poll.TotalVotes,
		Timestamp:  time.Now(),
		IsClosed:   req.IsClosed,
	}
	_ = h.redis.PublishVoteEvent(c.Request.Context(), pollID, statusEvent)
	h.broadcastToLocalHub(pollID, statusEvent)

	c.JSON(http.StatusOK, gin.H{"message": "Poll status updated", "is_closed": req.IsClosed})
}

// GetStats returns Redis telemetry and realtime breakdown
func (h *PollHandler) GetStats(c *gin.Context) {
	pollID := c.Param("id")
	liveVotes, liveTotal, _ := h.redis.GetLiveResults(c.Request.Context(), pollID)
	telemetry, _ := h.redis.GetTelemetry(c.Request.Context())

	c.JSON(http.StatusOK, gin.H{
		"poll_id":      pollID,
		"live_total":   liveTotal,
		"option_votes": liveVotes,
		"redis":        telemetry,
	})
}

// WebSocketHandler manages real-time socket connections for live polling updates without refresh
func (h *PollHandler) WebSocketHandler(c *gin.Context) {
	pollID := c.Param("id")
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[WebSocket] Upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// Register connection to local hub
	h.hubMu.Lock()
	if h.pollHubs[pollID] == nil {
		h.pollHubs[pollID] = make(map[*websocket.Conn]bool)
	}
	h.pollHubs[pollID][conn] = true
	h.hubMu.Unlock()

	defer func() {
		h.hubMu.Lock()
		if h.pollHubs[pollID] != nil {
			delete(h.pollHubs[pollID], conn)
			if len(h.pollHubs[pollID]) == 0 {
				delete(h.pollHubs, pollID)
			}
		}
		h.hubMu.Unlock()
	}()

	// Send initial live state immediately
	liveVotes, liveTotal, _ := h.redis.GetLiveResults(context.Background(), pollID)
	initMsg, _ := json.Marshal(gin.H{
		"type":         "init",
		"poll_id":      pollID,
		"total_votes":  liveTotal,
		"option_votes": liveVotes,
		"timestamp":    time.Now(),
	})
	_ = conn.WriteMessage(websocket.TextMessage, initMsg)

	// Keep-alive read loop
	for {
		_, _, readErr := conn.ReadMessage()
		if readErr != nil {
			break
		}
	}
}

func (h *PollHandler) broadcastToLocalHub(pollID string, event models.VoteEvent) {
	h.hubMu.RLock()
	conns := h.pollHubs[pollID]
	if len(conns) == 0 {
		h.hubMu.RUnlock()
		return
	}

	payload, err := json.Marshal(event)
	if err != nil {
		h.hubMu.RUnlock()
		return
	}

	for conn := range conns {
		_ = conn.WriteMessage(websocket.TextMessage, payload)
	}
	h.hubMu.RUnlock()
}
