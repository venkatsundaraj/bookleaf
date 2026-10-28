"use server";

// export class ApiError extends Error {
//   constructor(
//     public status: number,
//     message: string,
//     public retryAfter: number | null = null,
//   ) {
//     super(message);
//   }
// }

import { cookies } from "next/headers";

// export async function errorFrom(res: Response): Promise<ApiError> {
//   const body = await res.json().catch(() => null);
//   const detail = Array.isArray(body?.detail)
//     ? body.detail
//         .map((d: { msg: string }) => d.msg.replace(/^Value error, /, ""))
//         .join(", ")
//     : body?.detail;
//   const retry = Number(res.headers.get("Retry-After"));
//   const message =
//     res.status === 429
//       ? "Too many requests."
//       : detail ||
//         (res.status >= 500
//           ? "Something went wrong on our side. Try again."
//           : `Request failed (${res.status})`);
//   return new ApiError(
//     res.status,
//     message,
//     Number.isFinite(retry) && retry > 0
//       ? retry
//       : res.status === 429
//         ? 30
//         : null,
//   );
// }

export const useApi = async function (api: string, options: RequestInit) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const res = await fetch(`http://localhost:3000${api}`, {
      ...options,
      body: options.body,

      headers: { ...options.headers },
    });

    const body = await res.json();
    console.log("Status:", res.status);
    console.log("Response body:", body);
    if (!res.ok) {
      return "something went wrong";
    }

    for (const raw of res.headers.getSetCookie()) {
      const [pair] = raw.split(";");
      const index = pair.indexOf("=");
      cookieStore.set(pair.slice(0, index), pair.slice(index + 1), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3 * 24 * 60 * 60,
      });
    }

    return body;
  } catch (err) {
    console.log(err);
  }
};

// export async function apiFetch<T>(
//   path: string,
//   init: RequestInit & { json?: unknown; allow401?: boolean } = {},
// ): Promise<T> {
//   const { json, allow401, ...rest } = init;
//   const res = await fetch(path, {
//     ...rest,
//     credentials: "same-origin",
//     headers: {
//       ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
//       ...rest.headers,
//     },
//     body: json !== undefined ? JSON.stringify(json) : rest.body,
//   });
//   if (res.status === 401 && !allow401) {
//     // redirectToLogin();
//     throw new ApiError(401, "Session expired");
//   }
//   if (!res.ok) throw await errorFrom(res);
//   return (res.status === 204 ? undefined : await res.json()) as T;
// }
