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
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-[13px] leading-6 text-ink-dim">
        <Link href="/work" className="text-accent hover:text-ink">
          ~/work
        </Link>
        <span aria-hidden="true"> / </span>
        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
      </p>
      <h1 className="mt-1 text-xl text-ink sm:text-2xl">{entry.title}</h1>
      <div className="mt-6 max-w-xl space-y-4 text-sm leading-6 text-ink-dim">
        {entry.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
