import { JournalBoard } from "@/components/JournalBoard";
import { buildAgenda, listItems } from "@/lib/journal";
import { storageStatus } from "@/lib/journal-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const storage = storageStatus();
  let items = [] as Awaited<ReturnType<typeof listItems>>;
  let loadError: string | undefined;

  if (storage.ready) {
    try {
      items = await listItems();
    } catch (error) {
      loadError =
        error instanceof Error
          ? error.message
          : "The journal store could not be read.";
    }
  }

  const agenda = buildAgenda(items);
  const status = loadError
    ? { ...storage, ready: false, message: loadError }
    : storage;

  return <JournalBoard items={items} agenda={agenda} storage={status} />;
}
