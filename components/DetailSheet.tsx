"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { replyById } from "@/app/actions";
import { Inline } from "@/components/Inline";
import { PriorityIcon } from "@/components/PriorityIcon";
import { PRODUCT_COLOR, stamp } from "@/lib/format";
import type { Item, Note } from "@/lib/model";

type Props = {
  item: Item;
  onClose: () => void;
  /** Mark done (or reopen, in the Done tab). The parent closes the sheet and shows Undo. */
  onToggle: (item: Item) => void;
  onNote: (itemId: number, note: Note) => void;
};

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function DetailSheet({ item, onClose, onToggle, onNote }: Props) {
  const done = item.status === "done";
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  const actions = [...item.actions];
  if (item.link && !actions.some((a) => a.url === item.link)) {
    actions.push({ label: `Open ${host(item.link)}`, url: item.link });
  }

  const sendReply = () => {
    const body = draft.trim();
    if (!body) return;
    const note: Note = {
      id: -Date.now(),
      author: "ford",
      body,
      created_at: new Date().toISOString(),
    };
    setDraft("");
    onNote(item.id, note);
    startTransition(async () => {
      try {
        await replyById(item.id, body);
      } catch {
        /* the note stays visible locally; a reload shows the truth */
      }
    });
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grab" aria-hidden />
        <div className="sheet-head">
          <span className="sheet-kicker">
            <PriorityIcon priority={item.priority} done={done} />
            <span className="chip">
              <i style={{ background: PRODUCT_COLOR[item.product] ?? "#a0a4ab" }} />
              {item.product}
            </span>
            {item.priority === "urgent" && !done ? <span className="chip urgent">Urgent</span> : null}
            {item.key ? <span className="chip">{item.key}</span> : null}
          </span>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="sheet-body">
          <h2>{item.title}</h2>

          <section>
            <h3>What you need to do</h3>
            <p className="lead">{item.ask}</p>
          </section>

          {actions.length > 0 ? (
            <section>
              <h3>Go straight there</h3>
              <div className="actions">
                {actions.map((a, i) => (
                  <a
                    key={`${a.url}-${i}`}
                    className={`action${i === 0 ? " primary" : ""}`}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="action-label">{a.label}</span>
                    <span className="action-host">{host(a.url)}</span>
                    <span className="action-go" aria-hidden>↗</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {item.steps.length > 0 ? (
            <section>
              <h3>Steps</h3>
              <ol className="steps">
                {item.steps.map((s, i) => (
                  <li key={i}>
                    <Inline text={s} />
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {item.why ? (
            <section>
              <h3>Why it matters</h3>
              <p>{item.why}</p>
            </section>
          ) : null}

          <section>
            <h3>Opened</h3>
            <p>{stamp(item.opened_at)}</p>
          </section>

          {item.notes.length > 0 ? (
            <section>
              <h3>Notes</h3>
              <ul className="notes">
                {item.notes.map((n) => (
                  <li key={n.id}>
                    <div className="who">
                      {n.author === "ford" ? "You" : "Agent"} · {stamp(n.created_at)}
                    </div>
                    {n.body}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <div className="form">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Reply or leave a note…"
                aria-label="Note"
                maxLength={2000}
              />
              <div className="btns">
                <button type="button" className="btn" onClick={sendReply} disabled={pending || !draft.trim()}>
                  Reply
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="sheet-foot">
          <button type="button" className="btn big done" onClick={() => onToggle(item)}>
            {done ? "Reopen" : "Mark done"}
          </button>
        </div>
      </div>
    </div>
  );
}
