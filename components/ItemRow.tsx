import { markDone, reopen, reply } from "@/app/actions";
import { PriorityIcon } from "@/components/PriorityIcon";
import { PRODUCT_COLOR, opened, stamp } from "@/lib/format";
import type { Item } from "@/lib/model";

/** Presentational row body. The <li> + swipe shell live in ItemList. */
export function ItemRow({ item }: { item: Item }) {
  const done = item.status === "done";
  return (
    <details>
      <summary>
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
          {item.notes.length > 0 ? (
            <span className="chip">
              {item.notes.length} note{item.notes.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </span>
      </summary>
      <div className="detail">
        {item.why ? (
          <>
            <h3>Why it matters</h3>
            <p>{item.why}</p>
          </>
        ) : null}
        {item.link ? (
          <>
            <h3>Link</h3>
            <p>
              <a className="out" href={item.link} target="_blank" rel="noreferrer">
                {item.link.replace(/^https?:\/\//, "")}
              </a>
            </p>
          </>
        ) : null}
        <h3>Opened</h3>
        <p>{stamp(item.opened_at)}</p>
        {item.notes.length > 0 ? (
          <>
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
          </>
        ) : null}
        <form className="form">
          <input type="hidden" name="id" value={item.id} />
          <textarea name="note" placeholder="Reply or leave a note…" aria-label="Note" maxLength={2000} />
          <div className="btns">
            {done ? (
              <button className="btn" formAction={reopen}>Reopen</button>
            ) : (
              <button className="btn done" formAction={markDone}>Mark done</button>
            )}
            <button className="btn" formAction={reply}>Reply</button>
          </div>
        </form>
      </div>
    </details>
  );
}
