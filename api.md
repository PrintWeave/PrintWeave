# API Documentation

## Rest API

### POST /login
Logs in a user and returns a JWT token.

**Request**
```http request
POST /login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin"
}
```

**Response**
```json
{
    "message": "Authentication successful",
    "token": "Bearer <token>",
    "raw": "<token>"
}
```

### POST /register
Registers a new user.

**Request**
```http request
POST /register
Content-Type: application/json

{
    "username": "user",
    "password": "password",
    "email": "user@example.com"
}
```

**Response**
```json
{
    "message": "User created successfully"
}
```

### GET /api/printer
Returns all the printers that are connected to the current user.

**Request**
```http request
GET /api/printer
Authorization: Bearer <token>
Content-Type: application/json
```

**Response**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "active": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "printers": [
    {
      "id": 1,
      "name": "Printer 1",
      "type": "bambu",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "user_printers": {
        "id": 1,
        "userId": 1,
        "printerId": 1,
        "permission": "admin",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

TODO: Add more API endpoints
