import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.ts";

const pool = new Pool({
  //   host: "localhost",
  //   user: process.env.POSTGRES_USER,
  //   database: process.env.POSTGRES_DB,
  //   password: process.env.POSTGRES_PASSWORD,
  //   port: 5433,
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool, { schema });
