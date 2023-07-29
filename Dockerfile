FROM node:14-alpine 
# Specify Linux OS to package

EXPOSE 3000

COPY package.json /app/
COPY src /app/src/
COPY data /app/data/
# we can just copy the entire thing in

# copy both of these into the image's container directory

WORKDIR /app/
# cd into the /app/ directory immediatley
# this is where we want to execute all of our commands from

RUN npm install 
# install everything in package.json

CMD ["node", "src/index.js"]
