FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3003

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3003

# Start the service
CMD ["node", "src/index.js"]