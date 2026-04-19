FROM node:22-alpine AS base
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json

RUN corepack enable && pnpm install --filter web... --frozen-lockfile

COPY apps/web apps/web

WORKDIR /workspace/apps/web
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
