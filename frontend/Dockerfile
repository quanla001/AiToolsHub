# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port Vite runs on
EXPOSE 5173

# Set environment variables for Vite (optional)
ENV HOST=0.0.0.0

# Command to run the app
CMD ["npm", "run", "dev"]
