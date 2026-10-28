// src/server/api.ts
import "server-only";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function serverFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();

  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { Cookie: cookieStore.toString() }, // raw string, no JSON.stringify
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}
