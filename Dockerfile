FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /home/user

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY src ./src
COPY actor.json INPUT_SCHEMA.json ./

# Set Node.js to production mode
ENV NODE_ENV=production

# Run the actor
CMD ["npm", "start"]
