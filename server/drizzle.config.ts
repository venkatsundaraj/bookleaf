import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./app/lib/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    // database: process.env.POSTGRES_DB!,
    // host: "localhost",
    // user: process.env.POSTGRES_USER!,
    // password: process.env.POSTGRES_PASSWORD!,
    // port: 5433,
    url: process.env.DATABASE_URL!,
  },
});
