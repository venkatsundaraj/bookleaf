"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { CredentialsForm } from "@/components/credentials-form";

type Tab = "login" | "signup";

export function AuthorAuthTabs() {
  const [tab, setTab] = useState<Tab>("login");

  async function submit(email: string, password: string) {
    if (tab === "login") {
      await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password, role: "author" },
      });
    } else {
      await apiRequest("/auth/signup", {
        method: "POST",
        body: { email, password },
      });
    }
    // Full navigation so the dashboard's server render sees the new cookie.
    window.location.assign("/dashboard");
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex gap-2">
        <button
          role="tab"
          aria-selected={tab === "login"}
          disabled={tab === "login"}
          onClick={() => setTab("login")}
        >
          Log in
        </button>
        <button
          role="tab"
          aria-selected={tab === "signup"}
          disabled={tab === "signup"}
          onClick={() => setTab("signup")}
        >
          Sign up
        </button>
      </div>

      {/* key resets the form's error state when switching tabs */}
      <CredentialsForm
        key={tab}
        submitLabel={tab === "login" ? "Log in" : "Create account"}
        onSubmit={submit}
      />
    </div>
  );
}
