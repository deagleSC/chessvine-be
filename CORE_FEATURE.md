# BlueOlive Analysis Module - Implementation Plan

## Overview

Bulk PGN analysis pipeline using Google Cloud Tasks + Cloud Run for job queue processing, with Gemini AI for game synthesis.

## Architecture

```
┌─────────┐     ┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Client  │────▶│ Express API │────▶│ Cloud Tasks     │────▶│ Cloud Run       │
│         │     │ (blueolive) │     │ (Job Queue)     │     │ (Worker)        │
└─────────┘     └──────┬──────┘     └─────────────────┘     └────────┬────────┘
                       │                                             │
                       ▼                                             ▼
                 ┌──────────┐                                  ┌──────────┐
                 │ MongoDB  │◀─────────────────────────────────│ MongoDB  │
                 │ (write)  │                                  │ (update) │
                 └──────────┘                                  └──────────┘
```

## Data Models

### Analysis Document

```typescript
{
  _id: ObjectId,
  analysis_id: string,          // UUID for client reference
  user_id: ObjectId | string,   // Owner (ObjectId for users, string for guests)
  batch_id?: string,            // Batch identifier for bulk uploads
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  pgn: string,                  // Raw PGN data
  gcs_url?: string,             // Source GCS URL
  player_name: string,          // Name of player being analyzed
  player_color: 'white' | 'black', // Which side the player played
  metadata: {
    white: string,
    black: string,
    result: string,
    event?: string,
    date?: string,
    eco?: string,
    opening?: string,
  },
  result?: {                    // Gemini analysis output (player-specific)
    summary: string,
    phases: [...],
    key_moments: [...],
    recommendations: [...],     // Personalized for player_color
  },
  error?: string,               // Error message if FAILED
  created_at: Date,
  updated_at: Date,
  completed_at?: Date,
}
```

---

## Implementation Phases

### Phase 1: Foundation (Local/Mock)

**Goal**: Build the core module structure and test locally without cloud dependencies.

#### Step 1.1: Analysis Module Structure

Create the module skeleton:

```
src/modules/analysis/
├── controllers/
│   └── analysis.controller.ts
├── services/
│   ├── analysis.service.ts      # Core business logic
│   ├── pgn-parser.service.ts    # PGN parsing utilities
│   └── gemini.service.ts        # Gemini AI integration
├── models/
│   └── analysis.model.ts        # Mongoose schema
├── routes/
│   └── analysis.routes.ts       # Express routes
├── types/
│   └── index.ts                 # Module types
├── validators/
│   └── analysis.validator.ts    # Request validation
└── index.ts
```

#### Step 1.2: Mongoose Model

- Create `Analysis` schema with all fields
- Add indexes on `analysisId`, `userId`, `status`

#### Step 1.3: PGN Parser Service

- Parse PGN files/strings
- Extract metadata (players, result, event, date)
- Split multi-game PGN into individual games

#### Step 1.4: API Endpoints (Express)

| Method | Endpoint                  | Description                                             | Auth Required |
| ------ | ------------------------- | ------------------------------------------------------- | ------------- |
| POST   | `/api/v1/upload`          | Upload PGN files to GCS, returns list of GCS URLs       | Optional      |
| POST   | `/api/v1/analysis/bulk`   | Accept GCS file URLs, parse PGNs, enqueue analysis jobs | Optional      |
| GET    | `/api/v1/analysis/status` | Get status of multiple IDs                              | Optional      |
| GET    | `/api/v1/analysis/:id`    | Get single analysis result                              | Optional      |
| GET    | `/api/v1/analysis/user`   | List user's analyses                                    | Required      |

#### Step 1.5: Mock Queue Implementation

- Create `MockQueueService` that processes jobs synchronously
- Allows testing full flow without Cloud Tasks
- Easy toggle via environment variable

```typescript
// Toggle between mock and real queue
const queueService =
  process.env.USE_MOCK_QUEUE === "true"
    ? new MockQueueService()
    : new CloudTasksService();
```

---

### Phase 2: Gemini Integration

**Goal**: Integrate Vercel AI SDK with Gemini for game analysis.

#### Step 2.1: Gemini Service Setup

- Configure Vercel AI SDK with Google provider
- Create prompt templates for chess analysis
- Handle rate limiting and errors

#### Step 2.2: Analysis Prompt Engineering

Design structured prompts for:

- Game summary (opening, middlegame, endgame)
- Key moments identification
- Strategic themes
- Improvement recommendations

#### Step 2.3: Response Parsing

- Define JSON schema for Gemini output
- Validate and sanitize AI responses
- Handle partial/malformed responses

---

### Phase 3: Cloud Tasks Integration

**Goal**: Replace mock queue with Google Cloud Tasks.

#### Step 3.1: GCP Setup

- Create Cloud Tasks queue in GCP Console
- Configure service account with appropriate permissions
- Set up authentication

#### Step 3.2: Cloud Tasks Service

```typescript
// src/shared/services/cloud_tasks.service.ts
class CloudTasksService {
  async enqueue_analysis(analysis_id: string): Promise<void>;
  async enqueue_batch(analysis_ids: string[]): Promise<void>;
}
```

#### Step 3.3: Task Payload Design

```typescript
{
  analysis_id: string,
  callback_url: string,  // Cloud Run worker URL
  created_at: string,
}
```

---

### Phase 4: Cloud Run Worker

**Goal**: Create separate worker service for processing.

#### Step 4.1: Worker Endpoint

Create a secure endpoint that:

- Validates Cloud Tasks headers (OIDC token)
- Receives task payload
- Processes single analysis
- Updates MongoDB with results

#### Step 4.2: Worker Implementation

```typescript
// Worker receives task from Cloud Tasks
POST / worker / process_analysis;
{
  analysis_id: string;
}

// Worker flow:
// 1. Fetch analysis from MongoDB
// 2. Update status to PROCESSING
// 3. Call Gemini service
// 4. Update MongoDB with result
// 5. Return 200 OK
```

#### Step 4.3: Error Handling & Retries

- Cloud Tasks automatic retry on failure
- Dead letter queue for failed jobs
- Error logging and alerting

---

### Phase 5: Authentication & Authorization ✅ COMPLETED

**Goal**: Implement JWT-based authentication with email/password and Google OAuth.

#### Step 5.1: User Model & Auth Service ✅

- ✅ User Mongoose model with email/password (bcrypt) and Google OAuth
- ✅ JWT service for access/refresh token generation
- ✅ Auth service with signup, login, Google OAuth, and token refresh
- ✅ Password hashing with bcryptjs

#### Step 5.2: Auth Endpoints ✅

- ✅ `POST /api/v1/auth/signup` - Register with email/password
- ✅ `POST /api/v1/auth/login` - Login with email/password
- ✅ `POST /api/v1/auth/google` - Authenticate with Google ID token
- ✅ `POST /api/v1/auth/refresh` - Refresh access token
- ✅ `GET /api/v1/auth/me` - Get current user profile (protected)

#### Step 5.3: Auth Middleware ✅

- ✅ `requireAuth` middleware for protected routes
- ✅ `optionalAuth` middleware for guest user support
- ✅ Analysis endpoints use `optionalAuth` (except `/analysis/user`)

#### Step 5.4: Analysis Route Updates ✅

- ✅ Updated analysis routes to support optional authentication
- ✅ Guest users can use analysis endpoints without signing in
- ✅ `/analysis/user` requires authentication
- ✅ All endpoints filter results by user_id (authenticated or "guest")

---

### Phase 6: Production Hardening

**Goal**: Make the system production-ready.

#### Step 6.1: Rate Limiting & Security

- Rate limiting on upload and analysis endpoints (especially for guests)
- Validate user owns analysis before returning
- Cloud Run IAM roles to only be triggered by Cloud Tasks

#### Step 5.2: Monitoring & Observability

- Structured logging with correlation IDs
- Cloud Tasks queue metrics
- Analysis completion time tracking

#### Step 5.3: Batch Status Polling

- Efficient batch status endpoint
- WebSocket support for real-time updates (optional)

---

## API Specifications

### Authentication Endpoints

#### POST /api/v1/auth/signup

**Request:**

```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### POST /api/v1/auth/login

**Request:**

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### POST /api/v1/auth/google

**Request:**

```json
{
  "credential": "google_id_token"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "picture": "https://..."
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### POST /api/v1/auth/refresh

**Request:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "new_jwt_access_token",
      "refreshToken": "new_jwt_refresh_token"
    }
  }
}
```

#### GET /api/v1/auth/me

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://...",
    "provider": "email"
  }
}
```

---

### Analysis Endpoints

### POST /api/v1/upload

**Note:** Authentication is optional. Guest users are supported.

**Request:**

```typescript
// Content-Type: multipart/form-data
{
  files: File[]  // PGN files to upload
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "urls": [
      "gs://bucket-name/uploads/user123/file1.pgn",
      "gs://bucket-name/uploads/user123/file2.pgn"
    ]
  }
}
```

---

### POST /api/v1/analysis/bulk

**Note:** Authentication is optional. Guest users are supported.

**Request:**

```typescript
// Content-Type: application/json
{
  urls: string[],      // Array of GCS URLs from /upload endpoint
  playerName: string   // Your name as it appears in the PGN files
}
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "batch_id": "batch_abc123",
    "analysis_ids": ["ana_1", "ana_2", "ana_3"],
    "total_games": 3,
    "skipped_games": [
      {
        "white": "Player A",
        "black": "Player B",
        "reason": "Player \"Magnus\" not found in this game"
      }
    ]
  }
}
```

> **Note:** Games where `playerName` doesn't match White or Black are skipped and reported in `skipped_games`.

### GET /api/v1/analysis/status?ids=ana_1,ana_2,ana_3

**Note:** Authentication is optional. Guest users can check status of their own analyses.

**Response:**

```json
{
  "success": true,
  "data": {
    "ana_1": { "status": "COMPLETED" },
    "ana_2": { "status": "PROCESSING" },
    "ana_3": { "status": "PENDING" }
  }
}
```

### GET /api/v1/analysis/:id

**Note:** Authentication is optional. Guest users can access their own analyses.

**Response:**

```json
{
  "success": true,
  "data": {
    "analysis_id": "ana_1",
    "status": "COMPLETED",
    "player_name": "Magnus Carlsen",
    "player_color": "white",
    "metadata": {
      "white": "Magnus Carlsen",
      "black": "Hikaru Nakamura",
      "result": "1-0"
    },
    "result": {
      "summary": "...",
      "phases": [...],
      "key_moments": [...],
      "recommendations": [...]
    }
  }
}
```

> **Note:** `player_color` indicates which side the user played. Recommendations are personalized for this player.

### GET /api/v1/analysis/user

**Note:** Authentication is required. Returns only analyses for the authenticated user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "analysis_id": "ana_1",
      "status": "COMPLETED",
      "player_name": "Magnus Carlsen",
      "player_color": "white",
      "metadata": { ... },
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=8000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your-jwt-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# Google Cloud Platform
GCP_PROJECT_ID=your-project-id
GCP_STORAGE_BUCKET=your-bucket-name

# Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# Queue Configuration
USE_MOCK_QUEUE=true  # Set to false for production (Cloud Tasks)

# Cloud Tasks (required when USE_MOCK_QUEUE=false)
GCP_TASKS_QUEUE=analysis-queue
GCP_TASKS_LOCATION=asia-south1
GCP_CLOUD_RUN_URL=https://your-service.run.app
```

---

## Task Checklist

### Phase 1: Foundation ✅

- [x] Create analysis module folder structure
- [x] Define Analysis Mongoose model
- [x] Implement PGN parser service
- [x] Create GCS upload service
- [x] Create `/upload` endpoint (upload files to GCS, return URLs)
- [x] Create `/analysis/bulk` endpoint (accept GCS URLs + playerName, enqueue jobs)
- [x] Create status endpoint
- [x] Create single analysis endpoint
- [x] Implement mock queue service
- [ ] Write unit tests

### Phase 2: Gemini Integration ✅

- [x] Set up Vercel AI SDK with Google provider
- [x] Design analysis prompts (player-specific recommendations)
- [x] Implement Gemini service with gemini-2.0-flash
- [x] Player color detection from PGN metadata
- [x] Handle AI errors gracefully

### Phase 3: Cloud Tasks ✅

- [x] Create GCP Cloud Tasks queue
- [x] Implement CloudTasksService
- [x] Test task enqueueing
- [x] Configure retry policies

### Phase 4: Cloud Run Worker ✅

- [x] Create worker endpoint (`/worker/process`)
- [x] Create Dockerfile
- [x] Deploy to Cloud Run
- [x] Test end-to-end flow

### Phase 5: Authentication & Authorization ✅

- [x] Create User Mongoose model
- [x] Implement JWT service (access + refresh tokens)
- [x] Create auth service (signup, login, Google OAuth)
- [x] Implement auth endpoints
- [x] Create auth middleware (requireAuth, optionalAuth)
- [x] Update analysis routes to support optional auth
- [x] Add Swagger documentation for auth endpoints

### Phase 6: Production Hardening

- [ ] Implement rate limiting
- [ ] Add monitoring/logging
- [ ] Load testing
- [ ] Security audit

---

## Deployment

### Production URL

```
https://blueolive-api-881017844394.asia-south1.run.app
```

### Local Development

```bash
# Start dev server (mock queue - processes immediately)
USE_MOCK_QUEUE=true npm run dev
```

### Deploy to Cloud Run

```bash
gcloud run deploy blueolive-api \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --env-vars-file env.yaml
```

---

## Next Steps

Continue with **Phase 6: Production Hardening** - Add rate limiting, monitoring, and security improvements.

---

## Authentication Details

### Token Structure

- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens
- **Token Format**: JWT with `userId` and `email` in payload

### Guest User Support

Analysis endpoints (`/upload`, `/analysis/bulk`, `/analysis/status`, `/analysis/:id`) support optional authentication:

- If authenticated: User's analyses are stored with their user ID
- If not authenticated: User's analyses are stored with `user_id: "guest"`

The `/analysis/user` endpoint requires authentication and only returns analyses for the authenticated user.

### Google OAuth Setup

1. Create OAuth 2.0 credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-frontend-domain.com/auth/callback` (production)
3. Set `GOOGLE_CLIENT_ID` in environment variables
4. Frontend sends Google ID token to `/api/v1/auth/google` endpoint
