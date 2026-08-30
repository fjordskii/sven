import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-ink-dim sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          Owned by {site.owner}.
        </p>
        <p>
          <a href={site.repoUrl} className="hover:text-ink">
            github.com/fjordskii/sven
          </a>
        </p>
      </div>
    </footer>
  );
}
