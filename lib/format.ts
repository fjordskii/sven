const TZ = "America/New_York";

export function opened(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days < 1) {
    const hrs = Math.floor((now.getTime() - d.getTime()) / 3_600_000);
    return hrs < 1 ? "just now" : `${hrs}h ago`;
  }
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: TZ });
}

export function stamp(iso: string): string {
  return (
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ,
    }) + " ET"
  );
}

export const PRODUCT_COLOR: Record<string, string> = {
  TrackOutline: "#26b5ce",
  "Deal Score": "#4cb782",
  ARCF: "#bb87fc",
  YouTube: "#eb5757",
  dollar: "#f2c94c",
  Other: "#a0a4ab",
};
