"use client";

import { useApi } from "@/server/actions/auth-actions";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { FC } from "react";

interface ClientChildProps {
  cookie: RequestCookie | undefined;
}

const ClientChild: FC<ClientChildProps> = (cookie) => {
  return (
    <div className="flex gap-6">
      <button
        onClick={async () => {
          const result = await useApi("/api/signup", {
            body: JSON.stringify({
              email: "venkat@gmail.com",
              password: "12345678",
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
            credentials: "include",
          });
          console.log(result);
        }}
      >
        signup
      </button>
      <button>login</button>
      <button>me</button>
    </div>
  );
};

export default ClientChild;
