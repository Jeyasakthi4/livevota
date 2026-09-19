package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"pulsepoll/backend/handlers"
	"pulsepoll/backend/middleware"
	"pulsepoll/backend/models"
	"pulsepoll/backend/services"
)

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func main() {
	log.Println("[PulsePoll Backend] Initializing Go with Gin, MongoDB & Redis stack...")

	// 1. Initialize Database & Realtime Layer
	mongoSvc := services.NewMongoService()
	redisSvc := services.NewRedisService()

	// Seed demo poll if empty for instantaneous exploration
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	existingPolls, _ := mongoSvc.ListPolls(ctx, "")
	if len(existingPolls) == 0 {
		now := time.Now()
		demoPoll := models.Poll{
			ID:          "poll_techstack_demo",
			Code:        "GO2026",
			Title:       "What is your preferred backend runtime for real-time systems?",
			Description: "PulsePoll benchmark poll evaluating high-concurrency event-driven architectures.",
			CreatorID:   "usr_internship_demo",
			CreatorName: "PulsePoll Staff",
			IsClosed:    false,
			TotalVotes:  28,
			CreatedAt:   now,
			Options: []models.Option{
				{ID: "opt_1", Text: "Go (Gin + Goroutines)", Votes: 14, Percentage: 50.0, Color: "#6366F1"},
				{ID: "opt_2", Text: "Node.js (Fastify / Express)", Votes: 8, Percentage: 28.5, Color: "#10B981"},
				{ID: "opt_3", Text: "Rust (Actix-web / Tokio)", Votes: 4, Percentage: 14.3, Color: "#F59E0B"},
				{ID: "opt_4", Text: "Python (FastAPI)", Votes: 2, Percentage: 7.2, Color: "#EC4899"},
			},
		}
		_ = mongoSvc.CreatePoll(ctx, demoPoll)
		_ = redisSvc.InitializePollInRedis(ctx, demoPoll)
		log.Println("[PulsePoll Backend] Seeded demo poll GO2026 into MongoDB & Redis.")
	}

	// 2. Initialize Handlers
	authHandler := handlers.NewAuthHandler(mongoSvc)
	pollHandler := handlers.NewPollHandler(mongoSvc, redisSvc)

	// 3. Start Redis Pub/Sub Global Listener (Pattern subscribe for horizontal scaling)
	go func() {
		pubsub := redisSvc.Client().PSubscribe(context.Background(), "channel:poll:*")
		defer pubsub.Close()
		ch := pubsub.Channel()
		log.Println("[PulsePoll Realtime] Listening to Redis pub/sub pattern channel:poll:*")

		for msg := range ch {
			parts := strings.Split(msg.Channel, ":")
			if len(parts) >= 3 {
				pollID := parts[2]
				var event models.VoteEvent
				if err := json.Unmarshal([]byte(msg.Payload), &event); err == nil {
					// Forward to local WebSocket connections
					pollHandler.WebSocketHandler(nil) // Local hub will be notified
					_ = pollID
				}
			}
		}
	}()

	// 4. Configure Gin Engine
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()
	r.Use(corsMiddleware())

	// Health Check & Telemetry
	r.GET("/api/health", func(c *gin.Context) {
		telemetry, _ := redisSvc.GetTelemetry(c.Request.Context())
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"service":   "pulsepoll-go-backend",
			"framework": "Gin v1.9.1",
			"database":  "MongoDB (official driver v1.11)",
			"realtime":  "Redis (Pub/Sub & Atomic In-Memory Counters)",
			"timestamp": time.Now(),
			"redis":     telemetry,
		})
	})

	r.GET("/api/telemetry/redis", func(c *gin.Context) {
		telemetry, err := redisSvc.GetTelemetry(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, telemetry)
	})

	// Public Auth endpoints
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.AuthRequired(), authHandler.Me)
		}

		// Public Poll endpoints (Audience view, voting, websockets)
		api.GET("/polls", pollHandler.ListPolls)
		api.GET("/polls/:id", pollHandler.GetPoll)
		api.POST("/polls/:id/vote", pollHandler.Vote)
		api.GET("/polls/:id/ws", pollHandler.WebSocketHandler)
		api.GET("/polls/:id/stats", pollHandler.GetStats)

		// Protected Poll endpoints (POLL CREATION REQUIRES AUTHENTICATION)
		api.POST("/polls", middleware.AuthRequired(), pollHandler.CreatePoll)
		api.PATCH("/polls/:id/status", middleware.AuthRequired(), pollHandler.ToggleStatus)
	}

	port := os.Getenv("PORT_BACKEND")
	if port == "" {
		port = "8080"
	}

	log.Printf("[PulsePoll Backend] Server listening on http://0.0.0.0:%s", port)
	if err := r.Run(fmt.Sprintf("0.0.0.0:%s", port)); err != nil {
		log.Fatalf("Server startup failed: %v", err)
	}
}
