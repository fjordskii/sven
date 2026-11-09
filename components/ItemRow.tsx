import { PriorityIcon } from "@/components/PriorityIcon";
import { PRODUCT_COLOR, opened, stamp } from "@/lib/format";
import type { Item } from "@/lib/model";

/** Presentational row. Tapping it opens the detail sheet (handled by ItemList). */
export function ItemRow({ item, onOpen }: { item: Item; onOpen: (item: Item) => void }) {
  const done = item.status === "done";
  const open = () => onOpen(item);
  return (
    <div
      className="summary"
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <PriorityIcon priority={item.priority} done={done} />
      <span className="title">{item.title}</span>
      <span className="meta" title={stamp(item.opened_at)}>
        {done && item.resolved_at ? `done ${opened(item.resolved_at)}` : opened(item.opened_at)}
      </span>
      <span className="ask">
        <b>Need:</b> {item.ask}
      </span>
      <span className="tags">
        <span className="chip">
          <i style={{ background: PRODUCT_COLOR[item.product] ?? "#a0a4ab" }} />
          {item.product}
        </span>
        {item.priority === "urgent" && !done ? <span className="chip urgent">Urgent</span> : null}
        {item.key ? <span className="chip">{item.key}</span> : null}
        {item.steps.length > 0 ? (
          <span className="chip">{item.steps.length} steps</span>
        ) : null}
        {item.notes.length > 0 ? (
          <span className="chip">
            {item.notes.length} note{item.notes.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </span>
      <span className="chev" aria-hidden>›</span>
    </div>
  );
}
