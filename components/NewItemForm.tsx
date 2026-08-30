import { createItemAction } from "@/app/actions/journal";
import { TermButton, TermFrame } from "@/components/term";

export function NewItemForm() {
  return (
    <TermFrame title="log something" tone="accent">
      <form action={createItemAction}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[13px] text-ink-dim sm:col-span-2">
            title
            <input
              name="title"
              required
              maxLength={240}
              placeholder="what is in motion, or what Ford should do"
              className="field mt-1"
            />
          </label>
          <label className="block text-[13px] text-ink-dim sm:col-span-2">
            notes
            <textarea
              name="notes"
              rows={3}
              placeholder="enough context to act without the chat"
              className="field mt-1"
            />
          </label>
          <label className="block text-[13px] text-ink-dim">
            status
            <select name="status" defaultValue="next" className="field mt-1">
              <option value="next">Left to do</option>
              <option value="in_flight">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label className="block text-[13px] text-ink-dim">
            due date
            <input type="date" name="forDate" className="field mt-1" />
          </label>
        </div>
        <div className="mt-3">
          <TermButton type="submit" tone="ok">
            add to journal
          </TermButton>
        </div>
      </form>
    </TermFrame>
  );
}
