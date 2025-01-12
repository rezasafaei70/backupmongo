FROM node:20.9.0

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
RUN npm i -g pm2

# Install MongoDB tools
RUN wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2004-x86_64-100.6.1.deb \
    && dpkg -i ./mongodb-database-tools-ubuntu2004-x86_64-100.6.1.deb

RUN wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add - \
    && apt-get install -y gnupg \
    && wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add - \
    && echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list \
    && apt-get update \
    && apt-get install -y mongodb-mongosh

# Install PostgreSQL client tools (pg_dump, pg_restore, psql)
RUN apt-get update \
    && apt-get install -y postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Bundle app source
COPY . .

# Expose port
EXPOSE 8080

# Start the app with PM2
CMD [ "pm2-runtime", "start", "app.js" ]
