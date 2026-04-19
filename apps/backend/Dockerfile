FROM node:22-alpine AS base
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json

RUN corepack enable && pnpm install --filter backend... --frozen-lockfile

COPY apps/backend apps/backend

WORKDIR /workspace/apps/backend
RUN pnpm prisma:generate && pnpm build

EXPOSE 3000
CMD ["pnpm", "start:prod"]
