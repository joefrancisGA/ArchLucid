import type { PipelineTimelineItem } from "@/types/authority";

type AuthorityPipelineTimelineProps = {
  items: PipelineTimelineItem[] | null;
  /** When set, show a short operator-facing message instead of the table. */
  loadErrorMessage?: string | null;
};

/** Read-only vertical timeline of audit events for one run (oldest first). */
export function AuthorityPipelineTimeline({
  items,
  loadErrorMessage,
}: AuthorityPipelineTimelineProps) {
  if (loadErrorMessage) {
    return (
      <p style={{ fontSize: 14, color: "#b45309", marginTop: 0 }}>
        Pipeline timeline could not be loaded: {loadErrorMessage}
      </p>
    );
  }

  if (items === null) {
    return (
      <p style={{ fontSize: 14, color: "#64748b", marginTop: 0 }}>
        Pipeline timeline not loaded.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p style={{ fontSize: 14, color: "#64748b", marginTop: 0 }}>
        No audit events are recorded for this run yet (normal for brand-new runs or environments without durable audit).
      </p>
    );
  }

  return (
    <ol
      style={{
        margin: 0,
        paddingLeft: 20,
        fontSize: 14,
        color: "#334155",
        lineHeight: 1.6,
        maxWidth: 720,
      }}
    >
      {items.map((row) => (
        <li key={row.eventId} style={{ marginBottom: 8 }}>
          <strong>{new Date(row.occurredUtc).toLocaleString()}</strong>
          {" — "}
          <code style={{ fontSize: 13 }}>{row.eventType}</code>
          {" · "}
          {row.actorUserName}
          {row.correlationId ? (
            <>
              {" · "}
              <span style={{ color: "#64748b" }}>correlation {row.correlationId}</span>
            </>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
