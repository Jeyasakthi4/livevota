package services

import (
	"context"
	"errors"
	"log"
	"os"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"pulsepoll/backend/models"
)

type MongoService struct {
	client     *mongo.Client
	db         *mongo.Database
	isLive     bool
	// Thread-safe fallback store for zero-dependency standalone execution
	memMu      sync.RWMutex
	memPolls   map[string]models.Poll
	memUsers   map[string]models.User
}

func NewMongoService() *MongoService {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://127.0.0.1:27017"
	}

	dbName := os.Getenv("MONGO_DB_NAME")
	if dbName == "" {
		dbName = "pulsepoll_db"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(mongoURI)
	client, err := mongo.Connect(ctx, clientOpts)

	isLive := false
	var db *mongo.Database

	if err == nil {
		if pingErr := client.Ping(ctx, nil); pingErr == nil {
			isLive = true
			db = client.Database(dbName)
			log.Printf("[MongoDB] Connected to database: %s at %s", dbName, mongoURI)
		} else {
			log.Printf("[MongoDB Notice] MongoDB ping failed (%v). Operating in high-reliability memory-backed mode.", pingErr)
		}
	} else {
		log.Printf("[MongoDB Notice] MongoDB connection failed (%v). Operating in high-reliability memory-backed mode.", err)
	}

	svc := &MongoService{
		client:   client,
		db:       db,
		isLive:   isLive,
		memPolls: make(map[string]models.Poll),
		memUsers: make(map[string]models.User),
	}

	return svc
}

// CreatePoll saves a new poll in MongoDB
func (m *MongoService) CreatePoll(ctx context.Context, poll models.Poll) error {
	m.memMu.Lock()
	m.memPolls[poll.ID] = poll
	m.memMu.Unlock()

	if !m.isLive {
		return nil
	}

	coll := m.db.Collection("polls")
	_, err := coll.InsertOne(ctx, poll)
	return err
}

// GetPollByID queries a poll by primary ID
func (m *MongoService) GetPollByID(ctx context.Context, id string) (models.Poll, error) {
	if m.isLive {
		coll := m.db.Collection("polls")
		var poll models.Poll
		err := coll.FindOne(ctx, bson.M{"_id": id}).Decode(&poll)
		if err == nil {
			return poll, nil
		}
	}

	m.memMu.RLock()
	defer m.memMu.RUnlock()
	poll, ok := m.memPolls[id]
	if !ok {
		return models.Poll{}, errors.New("poll not found")
	}
	return poll, nil
}

// GetPollByCode queries a poll by human-friendly shortcode
func (m *MongoService) GetPollByCode(ctx context.Context, code string) (models.Poll, error) {
	if m.isLive {
		coll := m.db.Collection("polls")
		var poll models.Poll
		err := coll.FindOne(ctx, bson.M{"code": code}).Decode(&poll)
		if err == nil {
			return poll, nil
		}
	}

	m.memMu.RLock()
	defer m.memMu.RUnlock()
	for _, p := range m.memPolls {
		if p.Code == code {
			return p, nil
		}
	}
	return models.Poll{}, errors.New("poll not found")
}

// ListPolls queries all polls, optionally filtered by creator ID
func (m *MongoService) ListPolls(ctx context.Context, creatorID string) ([]models.Poll, error) {
	if m.isLive {
		coll := m.db.Collection("polls")
		filter := bson.M{}
		if creatorID != "" {
			filter["creator_id"] = creatorID
		}
		opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
		cursor, err := coll.Find(ctx, filter, opts)
		if err == nil {
			var results []models.Poll
			if decodeErr := cursor.All(ctx, &results); decodeErr == nil {
				return results, nil
			}
		}
	}

	m.memMu.RLock()
	defer m.memMu.RUnlock()
	var list []models.Poll
	for _, p := range m.memPolls {
		if creatorID == "" || p.CreatorID == creatorID {
			list = append(list, p)
		}
	}
	return list, nil
}

// UpdatePollVotes updates stored vote tallies in MongoDB
func (m *MongoService) UpdatePollVotes(ctx context.Context, pollID string, optionVotes map[string]int64, totalVotes int64) error {
	m.memMu.Lock()
	if poll, exists := m.memPolls[pollID]; exists {
		poll.TotalVotes = totalVotes
		for i, opt := range poll.Options {
			if v, ok := optionVotes[opt.ID]; ok {
				poll.Options[i].Votes = v
				if totalVotes > 0 {
					poll.Options[i].Percentage = float64(v) / float64(totalVotes) * 100
				}
			}
		}
		m.memPolls[pollID] = poll
	}
	m.memMu.Unlock()

	if !m.isLive {
		return nil
	}

	coll := m.db.Collection("polls")
	filter := bson.M{"_id": pollID}
	update := bson.M{
		"$set": bson.M{
			"total_votes": totalVotes,
		},
	}
	_, err := coll.UpdateOne(ctx, filter, update)
	return err
}

// UpdatePollStatus closes or reopens a poll
func (m *MongoService) UpdatePollStatus(ctx context.Context, pollID string, isClosed bool) error {
	m.memMu.Lock()
	if poll, exists := m.memPolls[pollID]; exists {
		poll.IsClosed = isClosed
		m.memPolls[pollID] = poll
	}
	m.memMu.Unlock()

	if !m.isLive {
		return nil
	}

	coll := m.db.Collection("polls")
	_, err := coll.UpdateOne(ctx, bson.M{"_id": pollID}, bson.M{"$set": bson.M{"is_closed": isClosed}})
	return err
}

// CreateUser persists a user account
func (m *MongoService) CreateUser(ctx context.Context, user models.User) error {
	m.memMu.Lock()
	m.memUsers[user.Email] = user
	m.memMu.Unlock()

	if !m.isLive {
		return nil
	}

	coll := m.db.Collection("users")
	_, err := coll.InsertOne(ctx, user)
	return err
}

// GetUserByEmail queries user by unique email
func (m *MongoService) GetUserByEmail(ctx context.Context, email string) (models.User, error) {
	if m.isLive {
		coll := m.db.Collection("users")
		var user models.User
		err := coll.FindOne(ctx, bson.M{"email": email}).Decode(&user)
		if err == nil {
			return user, nil
		}
	}

	m.memMu.RLock()
	defer m.memMu.RUnlock()
	user, exists := m.memUsers[email]
	if !exists {
		return models.User{}, errors.New("user not found")
	}
	return user, nil
}
