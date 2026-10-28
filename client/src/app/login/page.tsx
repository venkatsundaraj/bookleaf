import Link from "next/link";
import { AuthorAuthTabs } from "./author-auth-tabs";

export default function AuthorLoginPage() {
  return (
    <main className="flex flex-col gap-4 p-8">
      <h1>BookLeaf Author Portal</h1>
      <AuthorAuthTabs />
      <Link href="/admin/login">BookLeaf team? Log in here</Link>
    </main>
  );
}
