"use client";

import { apiRequest } from "@/lib/api";
import { CredentialsForm } from "@/components/credentials-form";

export function AdminLoginForm() {
  async function submit(email: string, password: string) {
    await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password, role: "admin" },
    });
    window.location.assign("/admin/dashboard");
  }

  return <CredentialsForm submitLabel="Log in" onSubmit={submit} />;
}
