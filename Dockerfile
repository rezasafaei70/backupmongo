FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
RUN npm i -g pm2
RUN wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2004-x86_64-100.6.1.deb
RUN dpkg -i ./mongodb-database-tools-ubuntu2004-x86_64-100.6.1.deb
# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "pm2-runtime","start", "app.js" ]