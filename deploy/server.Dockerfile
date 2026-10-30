# The Clairity server: session broker (WebSocket) and Proposal endpoint, calling Nemotron on Nebius Token Factory.
# Build from the repo root: docker build -f deploy/server.Dockerfile -t clairity-server .
FROM node:22-bookworm-slim
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/parser packages/parser
COPY packages/server packages/server
RUN pnpm install --frozen-lockfile --filter server...

WORKDIR /app/packages/server
ENV HOST=0.0.0.0 PORT=8787 DB_PATH=/data/clairity.db NODE_ENV=production
VOLUME /data
EXPOSE 8787
# tsx runs the TypeScript sources as they are, the same way `pnpm dev` does.
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
