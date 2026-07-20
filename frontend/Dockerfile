FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source files
COPY . .

# Expose Next.js port
EXPOSE 3000

# Start in development mode for easy previewing
CMD ["npm", "run", "dev"]
