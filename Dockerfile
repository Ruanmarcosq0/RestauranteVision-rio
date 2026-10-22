FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY apps/web/prisma apps/web/prisma
RUN pnpm install --frozen-lockfile
COPY apps/web apps/web
RUN pnpm --filter @vision/web build
EXPOSE 3000
CMD ["pnpm","--filter","@vision/web","start"]
