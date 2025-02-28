FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
# Run audit fix to address security vulnerabilities
RUN npm audit fix --production
COPY . .
# Deploy commands to Discord
RUN node scripts/deploy-commands.js
CMD ["node", "index.js"]