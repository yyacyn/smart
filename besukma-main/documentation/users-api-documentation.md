# Users API Documentation

This document contains the API documentation for the Users module in the application.

## Base URL
All API endpoints are relative to your application's base URL.

## Authentication
The Users API endpoints may require authentication depending on your application configuration.

## Endpoints

### 1. Get All Users

**GET** `/api/users`

Fetches all users with basic information.

#### Response
```json
[
  {
    "id": "user_1234567890",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "image": "https://example.com/images/john.jpg"
  },
  {
    "id": "user_0987654321",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "image": "https://example.com/images/jane.jpg"
  }
]
```

#### Example Request
```bash
curl -X GET http://localhost:3000/api/users
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing the issue",
  "details": "Additional error details"
}
```

## Common Error Status Codes
- `500`: Internal Server Error - An unexpected error occurred while fetching users