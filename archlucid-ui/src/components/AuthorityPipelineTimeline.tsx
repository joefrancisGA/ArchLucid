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
      <p className="mt-0 text-sm text-amber-700 dark:text-amber-400">
        Pipeline timeline could not be loaded: {loadErrorMessage}
      </p>
    );
  }

  if (items === null) {
    return (
      <p className="mt-0 text-sm text-neutral-500 dark:text-neutral-400">
        Pipeline timeline not loaded.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="mt-0 text-sm text-neutral-500 dark:text-neutral-400">
        No audit events are recorded for this run yet (normal for brand-new runs or environments without durable audit).
      </p>
    );
  }

  return (
    <ol className="m-0 max-w-3xl pl-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      {items.map((row) => (
        <li key={row.eventId} className="mb-2">
          <strong>{new Date(row.occurredUtc).toLocaleString()}</strong>
          {" — "}
          <code className="text-[13px]">{row.eventType}</code>
          {" · "}
          {row.actorUserName}
          {row.correlationId ? (
            <>
              {" · "}
              <span className="text-neutral-500 dark:text-neutral-400">correlation {row.correlationId}</span>
            </>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
