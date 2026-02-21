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

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/api/requirements.txt .
# Install CPU version of torch to save RAM and disk space
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/api/ .

# Copy built frontend from Stage 1 to a consistent location
COPY --from=build-stage /frontend/build /app/frontend_build

# Environment variables
ENV PORT=7860
ENV FLASK_ENV=production
EXPOSE 7860

# Run the app. Note: We use 1 worker and 2 threads to keep memory usage low.
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--threads", "2", "--timeout", "600", "app:app"]

