FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx tsc --noEmit || true

CMD ["node", "dist/worker/index.js"]
