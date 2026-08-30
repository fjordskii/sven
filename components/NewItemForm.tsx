import { createItemAction } from "@/app/actions/journal";

export function NewItemForm() {
  return (
    <form
      action={createItemAction}
      className="border border-line bg-bg-raised p-4 sm:p-5"
    >
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        Log something
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-ink-dim sm:col-span-2">
          Title
          <input
            name="title"
            required
            maxLength={240}
            placeholder="What is in motion, or what Ford should do"
            className="mt-1 w-full border border-line bg-bg px-3 py-2 text-ink"
          />
        </label>
        <label className="block text-sm text-ink-dim sm:col-span-2">
          Notes
          <textarea
            name="notes"
            rows={3}
            placeholder="Enough context to act without the chat"
            className="mt-1 w-full border border-line bg-bg px-3 py-2 text-ink"
          />
        </label>
        <label className="block text-sm text-ink-dim">
          Status
          <select
            name="status"
            defaultValue="next"
            className="mt-1 w-full border border-line bg-bg px-3 py-2 text-ink"
          >
            <option value="next">Left to do</option>
            <option value="in_flight">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label className="block text-sm text-ink-dim">
          Due date
          <input
            type="date"
            name="forDate"
            className="mt-1 w-full border border-line bg-bg px-3 py-2 text-ink"
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-4 border border-line bg-bg px-4 py-2 text-sm text-ink hover:border-accent hover:text-accent"
      >
        Add to journal
      </button>
    </form>
  );
}
