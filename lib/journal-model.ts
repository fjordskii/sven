export const ITEM_STATUSES = ["in_flight", "done", "next"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export type WorkItem = {
  id: string;
  title: string;
  notes: string;
  status: ItemStatus;
  forDate: string | null;
  sourceAgent: string | null;
  sourcePlatform: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

export function isItemStatus(value: string): value is ItemStatus {
  return (ITEM_STATUSES as readonly string[]).includes(value);
}

export function normalizeStatus(value: string | undefined): ItemStatus | undefined {
  if (value == null || value === "") return undefined;
  const key = value.trim().toLowerCase().replace(/[-\s]+/g, "_");
  if (key === "in_flight" || key === "in_progress" || key === "progress") {
    return "in_flight";
  }
  if (key === "next" || key === "todo" || key === "left_to_do" || key === "left") {
    return "next";
  }
  if (key === "done" || key === "complete" || key === "completed") {
    return "done";
  }
  throw new Error("Invalid status.");
}

export const STATUS_LABEL: Record<ItemStatus, string> = {
  in_flight: "In progress",
  next: "Left to do",
  done: "Done",
};

export function sortItems(items: WorkItem[]): WorkItem[] {
  return [...items].sort((a, b) => {
    if (a.forDate && b.forDate && a.forDate !== b.forDate) {
      return a.forDate < b.forDate ? -1 : 1;
    }
    if (a.forDate && !b.forDate) return -1;
    if (!a.forDate && b.forDate) return 1;
    return a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0;
  });
}

export function groupByStatus(items: WorkItem[]): Record<ItemStatus, WorkItem[]> {
  return {
    in_flight: sortItems(items.filter((item) => item.status === "in_flight")),
    next: sortItems(items.filter((item) => item.status === "next")),
    done: sortItems(items.filter((item) => item.status === "done")),
  };
}
