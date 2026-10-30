# The Clairity web app (canvas, layer tree, inspector, AI panel).
# NEXT_PUBLIC_BROKER_URL is read at build time, so pass the broker address the browser will use:
#   docker build -f deploy/web.Dockerfile --build-arg NEXT_PUBLIC_BROKER_URL=ws://<vm-ip>:8787 -t clairity-web .
FROM node:22-bookworm-slim
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/parser packages/parser
COPY packages/web packages/web
# next build type-checks the web tests, which drive the real broker, so the server package comes along for its types.
COPY packages/shared packages/shared
COPY packages/server packages/server
RUN pnpm install --frozen-lockfile --filter web... --filter server...

ARG NEXT_PUBLIC_BROKER_URL=ws://localhost:8787
ENV NEXT_PUBLIC_BROKER_URL=$NEXT_PUBLIC_BROKER_URL NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/packages/web
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3100
CMD ["pnpm", "start"]
