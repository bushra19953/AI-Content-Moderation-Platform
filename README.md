# AI Content Moderation Platform

This is a full-stack AI-powered Content Moderation Platform featuring a real-time integration with Google's Gemini AI.

To see exactly how the platform's premium glassmorphism Light Theme and Dashboard layouts look when running, please view the **`Project_Screenshots.pdf`** file located in the root of this repository!

## Prerequisites
- Docker
- Docker Compose

## Setup Instructions
1. Clone the repository.
2. In the root directory, run:
   ```bash
   docker-compose up -d --build
   ```
3. Access the Frontend at `http://localhost:5173`
4. Access the Backend API at `http://localhost:5000`

## Environment Variables
The application is pre-configured via `docker-compose.yml`, but here are the key variables used:
- **Backend**:
  - `MONGO_URI`: The connection string to MongoDB.
  - `JWT_SECRET`: Secret key for JWT signing.
  - `PORT`: Port the backend runs on (5000).
- **Frontend**:
  - `VITE_API_URL`: The URL of the backend API (`http://localhost:5000/api`).

## Key Architecture Decisions
- **Monorepo Structure**: Frontend and Backend in the same repository for ease of setup.
- **Smart API Key Rotation**: Includes a custom `geminiKeyRotation.js` service that pools multiple Google AI Studio API keys, automatically handling 429 Rate Limits by rotating keys and implementing exponential backoff.
- **Real AI Integration**: Uses the official `@google/generative-ai` SDK (`gemini-2.5-flash` model) to perform true zero-shot image classification across multiple policy categories.
- **Dockerized**: Containerized MongoDB, Node.js API, and React frontend for consistent environments.
- **Tech Stack**: 
  - Frontend: React + Vite + Vanilla CSS
  - Backend: Node.js + Express
  - Database: MongoDB + Mongoose
