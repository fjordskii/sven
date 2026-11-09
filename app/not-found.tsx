import Link from "next/link";

export default function NotFound() {
  return (
    <main className="empty">
      <strong>Not found</strong>
      <Link href="/">Back to the list</Link>
    </main>
  );
}
