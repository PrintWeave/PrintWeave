# API Documentation

## Rest API

### Typescript Types
Here is a quick example of how to use the types in Typescript.
```typescript
import { GetPrintersResponse, GetPrintersError } from '@printweave/api-types'

const token = '<token>';
fetch('http://localhost:3000/api/printer', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token  // token is the JWT token
    }
}).then(response => response.json())
    .then((data: GetPrintersResponse | GetPrintersError) => {
        if ((data as GetPrintersError).code) {
            // Check if the error is an UnauthorizedError, this is optional since the error is already typed
            if (isUnauthorizedError(data)) {
                console.log('Unauthorized');
                return;
            }

            console.log('Error:', (data as GetPrintersError).message);
        } else {
            console.log('Data:', (data as GetPrintersResponse));
        }
    });
```

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
Type: `GetPrintersResponse` or `GetPrintersError`
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

### POST /api/printer/:id/bambu/mqtt
Sends a message to the bambu printer. See the [Bambu Printer MQTT API](https://github.com/Doridian/OpenBambuAPI/blob/main/mqtt.md) for more information.

**Request**
```http request
POST /api/printer/1/bambu/mqtt
Authorization Bearer <token>
Content-Type: application/json

{
    "print": {
        "sequence_id": "0",
        "command": "print_speed",
        "param": "1" // Print speed level as a string
                     // 1 = silent
                     // 2 = standard
                     // 3 = sport
                     // 4 = ludicrous
    }
}
```
**Response**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "password": "<hashed_password>",
    "email": "admin@example.com",
    "role": "admin",
    "active": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "printer": {
    "id": 1,
    "name": "Printer 1",
    "type": "bambu",
    "active": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "result": "requested"
}
```

### GET /api/printer/:id/status
Returns the status of the printer with the specified id.

**Request**
```http request
GET /api/printer/1/status
Authorization Bearer <token>
Content-Type: application/json
```

**Response**
Type: `GetPrinterStatusResponse` or `GetPrinterStatusError`
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "password": "<hashed_password>",
    "email": "admin@example.com",
    "role": "admin",
    "active": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "printer": {
    "id": 1,
    "name": "Printer 1",
    "type": "bambu",
    "active": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "status": {
    "bedTargetTemp": 0,
    "bedTemp": 18.0625,
    "fanSpeeds": [
      {
        "fan": "chamber",
        "speed": 0
      },
      {
        "fan": "part",
        "speed": 0
      },
      {
        "fan": "aux",
        "speed": 0
      }
    ],
    "gcode_file": "",
    "nozzles": [
      {
        "id": 0,
        "nozzleTemp": 67.03125,
        "nozzleTargetTemp": 38,
        "multiMaterials": [
          {
            "id": 0,
            "type": "single",
            "trays": [
              {
                "id": 0,
                "material": null
              }
            ]
          },
          {
            "id": 1,
            "type": "multi",
            "humidity": 3,
            "trays": [
              {
                "id": 0,
                "material": {
                  "type": "PLA",
                  "color": "FFFFFFFF",
                  "nozzleTemp": {
                    "minTemp": 190,
                    "maxTemp": 230
                  },
                  "bedTemp": {
                    "minTemp": 35,
                    "maxTemp": 35
                  },
                  "dryTemp": null,
                  "dryTime": null,
                  "weight": 1000,
                  "diameter": "1.75"
                }
              },
              {
                "id": 1,
                "material": {
                  "type": "ABS",
                  "color": "0A2CA5FF",
                  "nozzleTemp": {
                    "minTemp": 240,
                    "maxTemp": 270
                  },
                  "bedTemp": {
                    "minTemp": 0,
                    "maxTemp": 0
                  },
                  "dryTemp": null,
                  "dryTime": null,
                  "weight": 1000,
                  "diameter": "1.75"
                }
              },
              {
                "id": 2,
                "material": null
              },
              {
                "id": 3,
                "material": {
                  "type": "PLA",
                  "color": "A3D8E1FF",
                  "nozzleTemp": {
                    "minTemp": 190,
                    "maxTemp": 230
                  },
                  "bedTemp": {
                    "minTemp": 35,
                    "maxTemp": 35
                  },
                  "dryTemp": null,
                  "dryTime": null,
                  "weight": 1000,
                  "diameter": "1.75"
                }
              }
            ]
          }
        ],
        "currentFilament": {
          "type": "ABS",
          "color": "0A2CA5FF",
          "nozzleTemp": {
            "minTemp": 240,
            "maxTemp": 270
          },
          "bedTemp": {
            "minTemp": 0,
            "maxTemp": 0
          },
          "dryTemp": null,
          "dryTime": null,
          "weight": 1000,
          "diameter": "1.75"
        },
        "diameter": 0,
        "type": "Brass"
      }
    ],
    "progress": {
      "percentage": 0,
      "timeLeft": 0,
      "layer": 0,
      "totalLayers": 0
    },
    "status": "IDLE",
    "wifiSignal": "-80dBm",
    "lights": [
      {
        "name": "chamber_light",
        "status": "off"
      }
    ]
  }
}
```

TODO: Add more API endpoints


## Websocket API

### Authenticate
Add the Authorization header with the JWT token to authenticate the user.

```http request
Authorization: Bearer <token>
```


### Subscribe to bambu printer's mqtt
Subscribe to the printer's mqtt topic to receive messages from the printer.
**Request**
```json
{
    "message" : "subscribe",
    "subscription_type": "bambu",
    "printer_id": 1
}
```
**Response**
```json
{
    "message": "subscribed",
    "printer_id": 1,
    "subscription_type": "bambu"
}

```
