FROM node:24-alpine AS build
WORKDIR /app

RUN npm install -g pnpm@11.5.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# The /api rewrite target is baked in at build time, so it is a build arg.
ARG BACKEND_URL=http://server:8000
ENV BACKEND_URL=$BACKEND_URL
RUN pnpm build

FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
