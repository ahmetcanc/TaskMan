# Node.js development image
FROM node:20-alpine

WORKDIR /app

# Copy and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the all frontend files
COPY . .

# Open port 5173
EXPOSE 5173

# Start the Dev Server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
