# Dockerfile for FFmpeg Analysis Service
FROM node:18

# Install FFmpeg and dependencies
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp (for video downloading in analysis)
# Using --break-system-packages flag for Docker environment
RUN pip3 install --break-system-packages yt-dlp

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy scripts
COPY scripts/ ./scripts/

# Create temp directory
RUN mkdir -p temp

# Expose port
EXPOSE 3001

# Use PORT from environment or default to 3001
ENV PORT=3001

# Start service
CMD ["node", "scripts/ffmpeg-analysis-service.js"]

