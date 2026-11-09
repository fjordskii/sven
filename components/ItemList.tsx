"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { markDoneById, reopenById } from "@/app/actions";
import { ItemRow } from "@/components/ItemRow";
import { SwipeableRow } from "@/components/SwipeableRow";
import type { Item } from "@/lib/model";

type View = "needs_you" | "done";

type Props = {
  view: View;
  initialItems: Item[];
  openCount: number;
  doneCount: number;
};

type PendingUndo = {
  item: Item;
  from: View;
  timeout: ReturnType<typeof setTimeout>;
};

const UNDO_MS = 5000;

export function ItemList({ view, initialItems, openCount, doneCount }: Props) {
  // Remounted by the parent with key={view}, so props are the initial snapshot.
  const [items, setItems] = useState(initialItems);
  const [openN, setOpenN] = useState(openCount);
  const [doneN, setDoneN] = useState(doneCount);
  const [undo, setUndo] = useState<PendingUndo | null>(null);
  const [, startTransition] = useTransition();
  const undoRef = useRef<PendingUndo | null>(null);

  useEffect(() => {
    undoRef.current = undo;
  }, [undo]);

  useEffect(() => {
    return () => {
      if (undoRef.current) clearTimeout(undoRef.current.timeout);
    };
  }, []);

  const clearUndo = useCallback(() => {
    setUndo((prev) => {
      if (prev) clearTimeout(prev.timeout);
      return null;
    });
  }, []);

  const scheduleUndo = useCallback((item: Item, from: View) => {
    setUndo((prev) => {
      if (prev) clearTimeout(prev.timeout);
      const timeout = setTimeout(() => setUndo(null), UNDO_MS);
      return { item, from, timeout };
    });
  }, []);

  const applySwipe = useCallback(
    (item: Item) => {
      const closing = view === "needs_you";
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (closing) {
        setOpenN((n) => Math.max(0, n - 1));
        setDoneN((n) => n + 1);
      } else {
        setDoneN((n) => Math.max(0, n - 1));
        setOpenN((n) => n + 1);
      }
      scheduleUndo(item, view);
      startTransition(async () => {
        try {
          if (closing) await markDoneById(item.id);
          else await reopenById(item.id);
        } catch {
          setItems((prev) =>
            prev.some((i) => i.id === item.id) ? prev : [...prev, item],
          );
          if (closing) {
            setOpenN((n) => n + 1);
            setDoneN((n) => Math.max(0, n - 1));
          } else {
            setDoneN((n) => n + 1);
            setOpenN((n) => Math.max(0, n - 1));
          }
          clearUndo();
        }
      });
    },
    [view, scheduleUndo, clearUndo],
  );

  const onUndo = useCallback(() => {
    const pending = undoRef.current;
    if (!pending) return;
    clearTimeout(pending.timeout);
    setUndo(null);
    const { item, from } = pending;
    if (from === view) {
      setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [item, ...prev]));
    }
    if (from === "needs_you") {
      setOpenN((n) => n + 1);
      setDoneN((n) => Math.max(0, n - 1));
    } else {
      setDoneN((n) => n + 1);
      setOpenN((n) => Math.max(0, n - 1));
    }
    startTransition(async () => {
      try {
        if (from === "needs_you") await reopenById(item.id);
        else await markDoneById(item.id);
      } catch {
        /* next refresh corrects */
      }
    });
  }, [view]);

  return (
    <>
      <HeaderCounts openN={openN} doneN={doneN} />
      {items.length === 0 ? (
        <div className="empty">
          <strong>{view === "done" ? "Nothing done yet" : "Nothing needs you"}</strong>
          {view === "done"
            ? "Closed items show up here."
            : "You're clear. Agents add items here when they're blocked on you."}
        </div>
      ) : (
        <ul className="list">
          {items.map((item) => (
            <li className="row" id={`item-${item.id}`} key={item.id}>
              <SwipeableRow
                actionLabel={view === "needs_you" ? "Done" : "Reopen"}
                onSwipe={() => applySwipe(item)}
              >
                <ItemRow item={item} />
              </SwipeableRow>
            </li>
          ))}
        </ul>
      )}
      {undo ? (
        <div className="toast" role="status" aria-live="polite">
          <span>{undo.from === "needs_you" ? "Marked done" : "Reopened"}</span>
          <button type="button" className="toast-undo" onClick={onUndo}>
            Undo
          </button>
        </div>
      ) : null}
    </>
  );
}

function HeaderCounts({ openN, doneN }: { openN: number; doneN: number }) {
  useEffect(() => {
    const count = document.querySelector<HTMLElement>(".top .count");
    if (count) {
      count.textContent = String(openN);
      count.setAttribute("aria-label", `${openN} open`);
      count.classList.toggle("zero", openN === 0);
    }
    const tabs = document.querySelectorAll<HTMLElement>(".tabs .tab .n");
    if (tabs[0]) tabs[0].textContent = String(openN);
    if (tabs[1]) tabs[1].textContent = String(doneN);
  }, [openN, doneN]);
  return null;
}
