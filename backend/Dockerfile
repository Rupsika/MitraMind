FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npx prisma generate --schema src/prisma/schema.prisma && npx tsc -p tsconfig.build.json

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl wget
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/prisma ./src/prisma
RUN npx prisma generate --schema src/prisma/schema.prisma
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=5 \
  CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["npm", "run", "start:prod"]
