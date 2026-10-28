"use client";

import { apiRequest } from "@/lib/api";

export function LogoutButton({ redirectTo }: { redirectTo: string }) {
  async function logout() {
    await apiRequest("/auth/logout", { method: "POST" });
    window.location.assign(redirectTo);
  }

  return <button onClick={logout}>Log out</button>;
}
