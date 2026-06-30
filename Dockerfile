# Use a lightweight official Node image
FROM node:20-bullseye-slim AS builder

WORKDIR /workspace

# Copy package metadata and install all dependencies for build
COPY package.json package-lock.json* ./
RUN npm install

# Copy the full project and build the app
COPY . .
RUN npm run build

# Runtime image
FROM node:20-bullseye-slim AS runtime
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY --from=builder /workspace/dist ./dist

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/index.cjs"]
