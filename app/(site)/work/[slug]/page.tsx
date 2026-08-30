import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, work, workBySlug } from "@/lib/work";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return work.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = workBySlug(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: entry.title,
    description: entry.summary,
  };
}

export default async function WorkEntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = workBySlug(slug);
  if (!entry) notFound();

  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="font-mono text-xs tracking-wide text-ink-dim">
        <Link href="/work" className="hover:text-ink">
          Work
        </Link>
        <span aria-hidden="true"> / </span>
        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
        {entry.title}
      </h1>
      <div className="mt-8 max-w-xl space-y-5 text-base leading-relaxed text-ink-dim">
        {entry.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
