FROM node:24-alpine
WORKDIR /app

RUN npm install -g pnpm@11.5.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8001
EXPOSE 8001

# Node 24 runs the .ts files directly.
CMD ["node", "index.ts"]
