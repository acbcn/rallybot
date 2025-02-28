FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Deploy commands to Discord
RUN node scripts/deploy-commands.js
CMD ["node", "index.js"]