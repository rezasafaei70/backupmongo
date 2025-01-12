FROM node:20.9.0-alpine

# Create app directory
WORKDIR /usr/src/app

# Install system dependencies and MongoDB/PostgreSQL tools
RUN apk add --no-cache \
  curl \
  wget \
  gnupg \
  tar \
  bash \
  postgresql-client \
  && wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2004-x86_64-100.6.1.deb \
  && tar -xvf mongodb-database-tools-ubuntu2004-x86_64-100.6.1.deb -C /usr/local/bin \
  && rm -rf mongodb-database-tools-ubuntu2004-x86_64-100.6.1.deb

# Install app dependencies
COPY package*.json ./
RUN npm install --only=production
RUN npm install -g pm2

# Bundle app source
COPY . .

# Expose port
EXPOSE 8080

# Run the application with PM2
CMD ["pm2-runtime", "start", "app.js"]
