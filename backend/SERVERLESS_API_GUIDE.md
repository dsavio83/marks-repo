# Serverless API Structure - Vercel Deployment Guide

## Overview

The Smart School Pro backend has been restructured for Vercel serverless deployment with **7 API functions** (within the 12-function limit) that consolidate 30+ traditional Express routes.

## MongoDB Connection

### Connection Caching
The MongoDB connection now uses connection caching optimized for serverless environments:
- Reuses existing connections across function invocations
- Implements connection pooling (max 10, min 2 connections)
- Fast timeout settings (5s server selection, 45s socket timeout)
- Automatic cache clearing on disconnect

### Configuration
Located in `backend/config/db.js` with the following optimizations:
- IPv4 only (faster connection)
- Retry writes enabled
- Write concern: majority
- Strict query mode disabled for flexibility

## API Endpoints Structure

All endpoints use **query parameters** for filtering instead of URL path parameters.

### 1. Authentication API (`/api/auth`)
**File:** `backend/api/auth.js`

- **POST /api/auth/login** - User login
- **POST /api/auth/register** - Register new user (Admin only)
- **GET /api/auth/profile** - Get current user profile (Authenticated)

### 2. Users API (`/api/users`)
**File:** `backend/api/users.js`

- **GET /api/users** - Get all users
- **GET /api/users?id={userId}** - Get user by ID
- **GET /api/users?classId={classId}** - Get students by class
- **PUT /api/users?id={userId}** - Update user (Admin only)
- **DELETE /api/users?id={userId}** - Delete user (Admin only)

### 3. Classes API (`/api/classes`)
**File:** `backend/api/classes.js`

- **GET /api/classes** - Get all classes
- **GET /api/classes?id={classId}** - Get class by ID
- **GET /api/classes?id={classId}&subjects=true** - Get class subjects
- **POST /api/classes** - Create class (Admin only)
- **PUT /api/classes?id={classId}** - Update class (Admin only)
- **DELETE /api/classes?id={classId}** - Delete class (Admin only)

### 4. Subjects API (`/api/subjects`)
**File:** `backend/api/subjects.js`

- **GET /api/subjects** - Get all subjects
- **GET /api/subjects?id={subjectId}** - Get subject by ID
- **POST /api/subjects** - Create subject (Admin only)
- **PUT /api/subjects?id={subjectId}** - Update subject (Admin only)
- **DELETE /api/subjects?id={subjectId}** - Delete subject (Admin only)

### 5. Exams API (`/api/exams`)
**File:** `backend/api/exams.js`

- **GET /api/exams** - Get all exams
- **GET /api/exams?id={examId}** - Get exam by ID
- **GET /api/exams?classId={classId}** - Get exams by class
- **POST /api/exams** - Create exam (Teacher/Admin)
- **PUT /api/exams?id={examId}** - Update exam (Teacher/Admin)
- **DELETE /api/exams?id={examId}** - Delete exam (Teacher/Admin)

### 6. Marks API (`/api/marks`)
**File:** `backend/api/marks.js`

- **GET /api/marks** - Get all marks
- **GET /api/marks?examId={examId}** - Get marks by exam
- **GET /api/marks?studentId={studentId}** - Get marks by student
- **GET /api/marks?studentId={studentId}&examId={examId}** - Get marks by student and exam
- **POST /api/marks** - Create mark (Teacher/Admin)
- **PUT /api/marks?id={markId}** - Update mark (Teacher/Admin)
- **DELETE /api/marks?id={markId}** - Delete mark (Teacher/Admin)

### 7. Health Check API (`/api/health`)
**File:** `backend/api/health.js`

- **GET /api/health** - Health check with database status

## Frontend Integration

The frontend API service (`services/api.js`) has been updated to use query parameters:

```javascript
// Example: Get user by ID
userAPI.getById(id) // Calls: GET /api/users?id={id}

// Example: Get exams by class
examAPI.getByClass(classId) // Calls: GET /api/exams?classId={classId}

// Example: Update subject
subjectAPI.update(id, data) // Calls: PUT /api/subjects?id={id}
```

## Vercel Configuration

### Backend (`backend/vercel.json`)
```json
{
  "version": 2,
  "builds": [{ "src": "api/**/*.js", "use": "@vercel/node" }],
  "routes": [
    { "src": "/api/auth/login", "dest": "/api/auth.js" },
    { "src": "/api/auth/register", "dest": "/api/auth.js" },
    { "src": "/api/auth/profile", "dest": "/api/auth.js" },
    { "src": "/api/auth", "dest": "/api/auth.js" },
    { "src": "/api/users(.*)", "dest": "/api/users.js" },
    { "src": "/api/classes(.*)", "dest": "/api/classes.js" },
    { "src": "/api/subjects(.*)", "dest": "/api/subjects.js" },
    { "src": "/api/exams(.*)", "dest": "/api/exams.js" },
    { "src": "/api/marks(.*)", "dest": "/api/marks.js" },
    { "src": "/api/health", "dest": "/api/health.js" }
  ],
  "functions": {
    "api/**/*.js": { "maxDuration": 30 }
  }
}
```

### Environment Variables (Set in Vercel Dashboard)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key for token signing
- `JWT_EXPIRES_IN` - Token expiration (e.g., "7d")
- `CORS_ORIGIN` - Frontend URL for CORS
- `NODE_ENV` - Set to "production"

## Deployment Steps

### 1. Backend Deployment
```bash
cd backend
vercel --prod
```

### 2. Set Environment Variables
In Vercel dashboard, add all required environment variables.

### 3. Frontend Deployment
Update `.env` with backend URL:
```
VITE_API_URL=https://your-backend.vercel.app/api
```

Then deploy:
```bash
vercel --prod
```

## Testing

### Local Testing
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Test all CRUD operations through the UI

### Production Testing
1. Test health endpoint: `GET https://your-backend.vercel.app/api/health`
2. Test authentication: Login through frontend
3. Verify all CRUD operations work
4. Check Vercel logs for any errors

## Key Differences from Traditional Setup

| Aspect | Traditional Express | Serverless |
|--------|-------------------|------------|
| Routes | 30+ individual routes | 7 consolidated functions |
| URL Structure | `/api/users/:id` | `/api/users?id={id}` |
| Connection | Single persistent connection | Cached connection per invocation |
| Deployment | Single server.js | Multiple serverless functions |
| Scaling | Manual | Automatic by Vercel |

## Troubleshooting

### MongoDB Connection Issues
- Check if IP is whitelisted in MongoDB Atlas (0.0.0.0/0 for Vercel)
- Verify MONGODB_URI environment variable
- Check connection logs in Vercel dashboard

### CORS Errors
- Ensure CORS_ORIGIN matches frontend URL
- Check that credentials are enabled in requests

### Function Timeout
- Default timeout is 30s (Vercel free tier limit)
- Optimize database queries if hitting timeout
- Consider upgrading Vercel plan for longer timeouts

## Benefits of Serverless Structure

1. **Cost Efficient** - Pay only for actual usage
2. **Auto-scaling** - Handles traffic spikes automatically
3. **Global Distribution** - Vercel's edge network
4. **Zero Maintenance** - No server management needed
5. **Within Limits** - 7 functions well under 12-function limit
