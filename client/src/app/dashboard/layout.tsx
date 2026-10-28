import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default function AuthorLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <>
      <header className="flex gap-6 px-8 pt-6">
        <strong>BookLeaf</strong>
        <nav className="flex gap-4">
          <Link href="/dashboard">My Books</Link>
          <Link href="/dashboard/tickets">My Tickets</Link>
          <Link href="/dashboard/tickets/new">Raise a query</Link>
        </nav>
        <div className="ml-auto">
          <LogoutButton redirectTo="/login" />
        </div>
      </header>
      {children}
    </>
  );
}
