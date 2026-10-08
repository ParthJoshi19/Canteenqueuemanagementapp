FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/db ./db

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
