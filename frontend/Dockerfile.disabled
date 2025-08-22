FROM node:18-alpine

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use full install for build, prune later)
RUN npm ci

# Copy project files
COPY . .

# Build the application
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build && npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
