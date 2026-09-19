package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"pulsepoll/backend/middleware"
	"pulsepoll/backend/models"
	"pulsepoll/backend/services"
)

type AuthHandler struct {
	mongo *services.MongoService
}

func NewAuthHandler(mongo *services.MongoService) *AuthHandler {
	return &AuthHandler{mongo: mongo}
}

func hashPassword(password string) string {
	hasher := sha256.New()
	hasher.Write([]byte("salt_pulsepoll_2026_" + password))
	return hex.EncodeToString(hasher.Sum(nil))
}

// Register creates a new poll organizer account
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed for registration input",
			"details": err.Error(),
		})
		return
	}

	// Check if already registered
	if _, err := h.mongo.GetUserByEmail(c.Request.Context(), req.Email); err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "An account with this email address already exists",
		})
		return
	}

	userID := "usr_" + hex.EncodeToString(sha256.New().Sum([]byte(req.Email)))[:12]
	user := models.User{
		ID:           userID,
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashPassword(req.Password),
		CreatedAt:    time.Now(),
	}

	if err := h.mongo.CreateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist user account"})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Username, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate authentication token"})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

// Login authenticates an existing organizer
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed for login credentials",
			"details": err.Error(),
		})
		return
	}

	user, err := h.mongo.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if user.PasswordHash != hashPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Username, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate authentication token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

// Me retrieves the current authenticated user's profile
func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")
	email, _ := c.Get("email")

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":       userID,
			"username": username,
			"email":    email,
		},
	})
}
