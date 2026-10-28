import express from "express";
import type { NextFunction, Request, Response } from "express";
import { db } from "./app/lib/db.ts";
import authRouter from "./app/routes/authRoutes.ts";
import bookRouter from "./app/routes/bookRoutes.ts";
import ticketRouter from "./app/routes/ticketRoutes.ts";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
// app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/books", bookRouter);
app.use("/api/tickets", ticketRouter);

app.get("/", (req, res) => {
  return res.json("hello world");
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// Express 5 forwards errors thrown in async handlers here.
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side" });
});

const PORT = Number(process.env.PORT ?? 8000);
// 0.0.0.0 so the API is reachable from outside its container.
const HOST = process.env.HOST ?? "0.0.0.0";

app.listen(PORT, HOST, async () => {
  try {
    await db.execute("SELECT 1;");
    console.log(`server started on http://${HOST}:${PORT}`);
  } catch (err) {
    console.log(err);
  }
});
