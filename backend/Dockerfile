FROM node:20-alpine
WORKDIR /app
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node . .
EXPOSE 5000
CMD ["npm", "run", "dev"]