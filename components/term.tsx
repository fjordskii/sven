import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ItemStatus } from "@/lib/journal-model";

export type Tone = "muted" | "accent" | "ok" | "warn" | "danger" | "purple";

export const toneClass: Record<Tone, string> = {
  muted: "text-ink-dim",
  accent: "text-accent",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  purple: "text-purple",
};

export const statusTone: Record<ItemStatus, Tone> = {
  in_flight: "ok",
  next: "warn",
  done: "muted",
};

function Rule() {
  return (
    <span
      aria-hidden="true"
      className="min-w-2 flex-1 overflow-hidden whitespace-nowrap text-line"
    >
      {"─".repeat(200)}
    </span>
  );
}

export function TermFrame({
  title,
  tone = "muted",
  children,
  className = "",
}: {
  title?: ReactNode;
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-bg-raised ${className}`}>
      {title != null ? (
        <header className="flex items-center gap-2 overflow-hidden px-1 text-[13px] leading-6">
          <span className="shrink-0 text-ink-dim" aria-hidden="true">
            ┌─
          </span>
          <span className={`shrink-0 ${toneClass[tone]}`}>{title}</span>
          <Rule />
          <span className="shrink-0 text-ink-dim" aria-hidden="true">
            ┐
          </span>
        </header>
      ) : null}
      <div className="border-x border-line px-3 py-3">{children}</div>
      <footer
        className="flex overflow-hidden px-1 text-[13px] leading-6 text-ink-dim"
        aria-hidden="true"
      >
        <span>└</span>
        <Rule />
        <span>┘</span>
      </footer>
    </section>
  );
}

export function TermButton({
  children,
  tone = "accent",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center bg-transparent p-0 leading-6 hover:underline disabled:opacity-50 ${toneClass[tone]} ${className}`}
    >
      <span aria-hidden="true">[ </span>
      {children}
      <span aria-hidden="true"> ]</span>
    </button>
  );
}

export function PageShell({
  cwd,
  title,
  lead,
  wide = false,
  children,
}: {
  cwd: string;
  title: string;
  lead?: ReactNode;
  wide?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`mx-auto px-4 py-8 sm:px-6 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
    >
      <p className="text-[13px] leading-6 text-ink-dim">
        <span className="text-ok">sven</span>
        <span>@</span>
        <span className="text-accent">ops</span>
        <span>:</span>
        <span className="text-purple">{cwd}</span>
      </p>
      <h1 className="mt-1 text-xl text-ink sm:text-2xl">{title}</h1>
      {lead ? (
        <div className="mt-3 max-w-2xl space-y-3 text-sm leading-6 text-ink-dim">
          {lead}
        </div>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
