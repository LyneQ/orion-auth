# Authentication API Documentation

## Introduction

This API provides a complete authentication system with registration, login, token refresh and
logout features.

## Requirements

### Environment Variables:

- `DATABASE_URL`: Database connection URL
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRES_IN`: JWT tokens validity duration (e.g.: "1h")

## Data Models

### User

- `id`: Unique identifier (UUID)
- `email`: Unique email address
- `username`: Unique username
- `password`: Hashed password
- `createdAt`: Creation date
- `updatedAt`: Last update date

### RefreshToken

- `id`: Unique identifier (UUID)
- `token`: Unique refresh token
- `userId`: Associated user ID
- `expiresAt`: Expiration date
- `createdAt`: Creation date

## Endpoints

### Register

- **POST** `/auth/register`
- **Request body**:
  ```json
  {
    "email": "user@example.com",
    "username": "user",
    "password": "password"
  }
  ```
- **Response**: Created user data

### Login

- **POST** `/auth/login`
- **Request body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```
- **Response**: Access token, refresh token and user data

### Token Refresh

- **POST** `/auth/refresh`
- **Request body**:
  ```json
  {
    "refreshToken": "your-refresh-token"
  }
  ```
- **Response**: New access token

### Logout

- **POST** `/auth/logout`
- **Request body**:
  ```json
  {
    "refreshToken": "your-refresh-token"
  }
  ```
- **Response**: Confirmation message

## Error Handling

- User already exists: 409 Conflict
- Invalid credentials: 401 Unauthorized
- Invalid/expired token: 401 Unauthorized
- User already logged in: 409 Conflict
- Invalid request: 400 Bad Request