"use client";

import { useState } from "react";

type CredentialsFormProps = {
  submitLabel: string;
  onSubmit: (email: string, password: string) => Promise<void>;
};

// Email + password form shared by author login, author sign-up and admin login.
export function CredentialsForm({ submitLabel, onSubmit }: CredentialsFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    try {
      await onSubmit(String(form.get("email")), String(form.get("password")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className="flex flex-col gap-1">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={pending} className="self-start px-4 py-2">
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
