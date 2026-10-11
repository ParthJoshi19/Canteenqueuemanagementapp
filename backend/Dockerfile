FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm i

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
