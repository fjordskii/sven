import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-[13px] leading-6 text-ink-dim sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>owned by {site.owner}</p>
        <p>
          <a href={site.repoUrl} className="text-accent hover:text-ink">
            github.com/fjordskii/sven
          </a>
        </p>
      </div>
    </footer>
  );
}
