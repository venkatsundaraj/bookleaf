import { cookies } from "next/headers";
import type { User } from "@/lib/types";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function serverFetch(path: string) {
  const cookieStore = await cookies();
  return fetch(`${BACKEND_URL}/api${path}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
}

export async function getJSON<T>(path: string): Promise<T> {
  const res = await serverFetch(path);
  if (!res.ok) {
    throw new Error(`GET ${path} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function getCurrentUser(): Promise<User | null> {
  const res = await serverFetch("/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) {
    throw new Error(`GET /auth/me failed (${res.status})`);
  }
  return res.json() as Promise<User>;
}
