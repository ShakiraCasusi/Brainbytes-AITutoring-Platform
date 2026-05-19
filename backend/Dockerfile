# Build stage
FROM node:16 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Production stage
FROM node:16-alpine
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV MONGO_URI=mongodb://mongo:27017/brainbytes

# Copy files from build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
# Legacy broad copy was very slow during Docker image unpacking:
# COPY --from=build /app . ./
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/aiService.js ./aiService.js
COPY --from=build /app/healthcheck.js ./healthcheck.js
COPY --from=build /app/Message.js ./Message.js
COPY --from=build /app/controllers ./controllers
COPY --from=build /app/middleware ./middleware
COPY --from=build /app/models ./models
COPY --from=build /app/routes ./routes
COPY --from=build /app/services ./services
COPY --from=build /app/scripts ./scripts

# Prune development dependencies
RUN npm prune --production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

EXPOSE 3000
CMD ["npm", "start"]
