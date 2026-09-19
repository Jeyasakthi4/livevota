package models

import "time"

// Option represents a single answer choice in a poll
type Option struct {
	ID         string  `json:"id" bson:"id"`
	Text       string  `json:"text" bson:"text"`
	Votes      int64   `json:"votes" bson:"votes"`
	Percentage float64 `json:"percentage" bson:"percentage"`
	Color      string  `json:"color,omitempty" bson:"color,omitempty"`
}

// Poll represents a polling session in MongoDB and Redis
type Poll struct {
	ID            string    `json:"id" bson:"_id,omitempty"`
	Code          string    `json:"code" bson:"code"`
	Title         string    `json:"title" bson:"title"`
	Description   string    `json:"description" bson:"description"`
	Options       []Option  `json:"options" bson:"options"`
	CreatorID     string    `json:"creator_id" bson:"creator_id"`
	CreatorName   string    `json:"creator_name" bson:"creator_name"`
	IsClosed      bool      `json:"is_closed" bson:"is_closed"`
	AllowMultiple bool      `json:"allow_multiple" bson:"allow_multiple"`
	IsAnonymous   bool      `json:"is_anonymous" bson:"is_anonymous"`
	TotalVotes    int64     `json:"total_votes" bson:"total_votes"`
	CreatedAt     time.Time `json:"created_at" bson:"created_at"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty" bson:"expires_at,omitempty"`
}

// CreatePollRequest validated incoming payload for creating a poll
type CreatePollRequest struct {
	Title            string   `json:"title" binding:"required,min=5,max=200"`
	Description      string   `json:"description" binding:"max=1000"`
	Options          []string `json:"options" binding:"required,min=2,max=10,dive,required,min=1,max=100"`
	AllowMultiple    bool     `json:"allow_multiple"`
	IsAnonymous      bool     `json:"is_anonymous"`
	ExpiresInMinutes int      `json:"expires_in_minutes" binding:"min=0,max=43200"`
}

// VoteRequest validated incoming audience vote payload
type VoteRequest struct {
	OptionID  string `json:"option_id" binding:"required"`
	VoterID   string `json:"voter_id" binding:"required,min=3,max=100"`
	VoterName string `json:"voter_name" binding:"max=50"`
}

// VoteEvent emitted via Redis Pub/Sub for real-time live synchronization
type VoteEvent struct {
	Type        string           `json:"type"` // "vote", "status", "presence"
	PollID      string           `json:"poll_id"`
	OptionID    string           `json:"option_id,omitempty"`
	TotalVotes  int64            `json:"total_votes"`
	OptionVotes map[string]int64 `json:"option_votes"`
	VoterID     string           `json:"voter_id,omitempty"`
	VoterName   string           `json:"voter_name,omitempty"`
	Timestamp   time.Time        `json:"timestamp"`
	IsClosed    bool             `json:"is_closed"`
}

// User credentials and account details
type User struct {
	ID           string    `json:"id" bson:"_id,omitempty"`
	Username     string    `json:"username" bson:"username"`
	Email        string    `json:"email" bson:"email"`
	PasswordHash string    `json:"-" bson:"password_hash"`
	CreatedAt    time.Time `json:"created_at" bson:"created_at"`
}

// RegisterRequest payload for creating organizer accounts
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=30"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=100"`
}

// LoginRequest payload for authenticating
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse returns JWT token and sanitized user profile
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
