FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3002

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Use node directly in production, not nodemon
CMD ["node", "src/index.js"]