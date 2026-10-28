import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col gap-4 p-8">
      <h1>BookLeaf Support Portal</h1>
      <Link href="/login">Author login / sign up</Link>
      <Link href="/admin/login">Admin login</Link>
    </main>
  );
}
