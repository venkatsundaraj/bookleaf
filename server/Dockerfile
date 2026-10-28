FROM node:24-alpine
WORKDIR /app

RUN npm install -g pnpm@11.5.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY . .

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

# Apply pending migrations, then start. Node 24 runs the .ts files directly.
CMD ["sh", "-c", "node node_modules/drizzle-kit/bin.cjs migrate && node index.ts"]
