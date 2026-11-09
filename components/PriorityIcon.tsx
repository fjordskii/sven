import type { Priority } from "@/lib/model";

export function PriorityIcon({ priority, done }: { priority: Priority; done?: boolean }) {
  if (done) {
    return (
      <svg className="pri" viewBox="0 0 14 14" aria-label="Done">
        <circle cx="7" cy="7" r="6.5" fill="var(--done)" />
        <path d="M4 7.2l2 2 4-4.4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (priority === "urgent") {
    return (
      <svg className="pri" viewBox="0 0 14 14" aria-label="Urgent">
        <rect width="14" height="14" rx="3" fill="var(--urgent)" />
        <rect x="6.1" y="3" width="1.8" height="5.2" rx=".9" fill="#fff" />
        <circle cx="7" cy="10.4" r="1" fill="#fff" />
      </svg>
    );
  }
  const bars = priority === "normal" ? 2 : 1;
  return (
    <svg className="pri" viewBox="0 0 14 14" aria-label={priority === "normal" ? "Normal" : "Low"}>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1 + i * 4.5}
          y={10 - i * 3.5}
          width="3"
          height={3 + i * 3.5}
          rx="1"
          fill={i < bars ? "var(--ink-2)" : "var(--line)"}
        />
      ))}
    </svg>
  );
}
