FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci --verbose --no-audit --no-fund

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/db ./db

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]