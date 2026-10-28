import Link from "next/link";
import { AdminLoginForm } from "./admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex flex-col gap-4 p-8">
      <h1>BookLeaf Admin</h1>
      <AdminLoginForm />
      <Link href="/login">Author? Log in here</Link>
    </main>
  );
}
