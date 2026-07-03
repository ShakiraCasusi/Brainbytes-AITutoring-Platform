# =========================
# Build Stage
# =========================
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./

# Prevent npm network timeout during Docker builds
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

RUN npm install

COPY . .


# =========================
# Production Stage
# =========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules

# Application files
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/alert-receiver.js ./alert-receiver.js
COPY --from=build /app/app.js ./app.js
COPY --from=build /app/db.js ./db.js
COPY --from=build /app/aiService.js ./aiService.js
COPY --from=build /app/healthcheck.js ./healthcheck.js
COPY --from=build /app/Message.js ./Message.js

# Directories
COPY --from=build /app/controllers ./controllers
COPY --from=build /app/middleware ./middleware
COPY --from=build /app/models ./models
COPY --from=build /app/routes ./routes
COPY --from=build /app/services ./services
COPY --from=build /app/scripts ./scripts


# Optional: remove dev dependencies
# RUN npm prune --production


# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1


# API + metrics
EXPOSE 4000
EXPOSE 9080

CMD ["npm", "start"]