FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm i -g corepack@latest && corepack enable && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/.next/cache && \
    chown -R node:node /app/.next

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3005
EXPOSE 3005
USER node

CMD ["node", "server.js"]
