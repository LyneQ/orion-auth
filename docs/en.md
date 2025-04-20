# Authentication API Documentation

## Introduction

This API provides a complete authentication system with registration, login, token refresh and
logout features.

## Requirements

### Environment Variables:

- `PORT`: configure witch port nest will use (optional: 3000 by default)
- `DATABASE_URL`: Database connection URL
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRES_IN`: JWT tokens validity duration (e.g.: "1h")
- `CSRF_SECRET`: used as auth (x-csrf-token in the header) for the route /csrf-token

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

### Initialisation

- **GET** `/csrf-token`
- **Headers**:
  - `authorization`: Bearer token
- **Request body**:
  ```json
  { 
    "x-csrf-token": "csrf-token secret available in .env file"
  }
   ```

### Register

- **POST** `/auth/register`
- **Headers**:
  - `authorization`: Bearer token
  - `x-csrf-token`: CSRF token
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
- **Headers**:
  - `authorization`: Bearer token
  - `x-csrf-token`: CSRF token
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
- **Headers**:
  - `authorization`: Bearer token
  - `x-csrf-token`: CSRF token
- **Request body**:
  ```json
  {
    "refreshToken": "your-refresh-token"
  }
  ```
- **Response**: New access token

### Logout

- **POST** `/auth/logout`
- **Headers**:
  - `authorization`: Bearer token
  - `x-csrf-token`: CSRF token
- **Request body**:
  ```json
  {
    "refreshToken": "your-refresh-token"
  }
  ```
- **Response**: Confirmation message

### Get User

- **GET** `/user/:id`
- **Parameters**:
  - `id`: User ID (UUID)
- **Headers**:
  - `authorization`: Bearer token
- **Response**: User data

### Update User

- **PATCH** `/user/:id`
- **Parameters**:
  - `id`: User ID (UUID)
- **Headers**:
  - `authorization`: Bearer token
  - `x-csrf-token`: CSRF token
- **Request body**:
  ```json
  {
    "username": "new username",
    "email": "new.email@example.com",
    "bio": "user bio",
    "firstName": "first name",
    "lastName": "last name"
  }
  ```
- **Response**: Updated user data

### Replace User

- **PUT** `/user/`
- **Response**: Replaced user data

## Error Handling

- User already exists: 409 Conflict
- Invalid credentials: 401 Unauthorized
- Invalid/expired token: 401 Unauthorized
- User already logged in: 409 Conflict
- Invalid request: 400 Bad Request
- Unauthorized access: 403 Forbidden