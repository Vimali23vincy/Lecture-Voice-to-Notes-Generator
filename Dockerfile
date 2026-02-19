# --- Phase 1: Build Frontend ---
FROM node:18-alpine AS build-stage
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Phase 2: Setup Backend ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for audio/ffmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/api/ .

# Copy built frontend from Stage 1
# app.py expects frontend/build at ../../frontend/build relative to backend/api
# In this Docker container, let's put it there to match app.py logic
WORKDIR /
COPY --from=build-stage /frontend/build /frontend/build

# Set working directory back to backend code
WORKDIR /app

# Environment variables
ENV PORT=7860
EXPOSE 7860

# Run the app
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--threads", "8", "--timeout", "0", "app:app"]
