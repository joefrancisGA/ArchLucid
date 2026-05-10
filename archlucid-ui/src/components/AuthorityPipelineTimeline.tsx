import { CheckCircle2, Circle } from "lucide-react";
import type { ReactNode } from "react";

import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { isTimelineMilestoneEvent } from "@/lib/timeline-milestone-events";
import type { PipelineTimelineItem } from "@/types/authority";

type AuthorityPipelineTimelineProps = {
  items: PipelineTimelineItem[] | null;
  /** When set, show a short operator-facing message instead of the table. */
  loadErrorMessage?: string | null;
  /** When true, omit per-event technical `<details>` (event id / raw type) — public marketing surfaces. */
  omitEventTechnicalDetails?: boolean;
};

function timelineStatusIcon(eventType: string): ReactNode {
  if (isTimelineMilestoneEvent(eventType)) {
    return (
      <CheckCircle2
        className="size-4 shrink-0 text-teal-600 dark:text-teal-400"
        aria-hidden
      />
    );
  }

  return (
    <Circle className="size-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden />
  );
}

function actorLabel(name: string): string {
  const n = name.trim();

  if (n.length === 0) {
    return "Actor unknown";
  }

  if (n.toLowerCase() === "system") {
    return "System";
  }

  return n;
}

function formatElapsedSincePrevious(prevIso: string | undefined, curIso: string): string | null {
  if (!prevIso) {
    return null;
  }

  const prevMs = Date.parse(prevIso);
  const curMs = Date.parse(curIso);

  if (!Number.isFinite(prevMs) || !Number.isFinite(curMs) || curMs < prevMs) {
    return null;
  }

  const sec = Math.round((curMs - prevMs) / 1000);

  if (sec < 60) {
    return `${sec}s after prior event`;
  }

  const m = Math.floor(sec / 60);
  const s = sec % 60;

  return `${m}m ${s}s after prior event`;
}

/** Read-only vertical timeline of audit events for one architecture review (oldest first). */
export function AuthorityPipelineTimeline({
  items,
  loadErrorMessage,
  omitEventTechnicalDetails = false,
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
        No events recorded yet for this review.
      </p>
    );
  }

  return (
    <ol
      className="m-0 max-w-3xl list-none space-y-0 pl-0 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
      aria-label="Review trail timeline"
    >
      {items.map((row, index) => {
        const prevUtc = index > 0 ? items[index - 1]!.occurredUtc : undefined;
        const elapsed = formatElapsedSincePrevious(prevUtc, row.occurredUtc);

        return (
        <li
          key={row.eventId}
          className="relative border-s-2 border-neutral-200 pb-6 ps-4 last:border-s-transparent last:pb-0 dark:border-neutral-700"
        >
          <div className="flex gap-3 pt-0.5">
            <div className="mt-0.5">{timelineStatusIcon(row.eventType)}</div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <time
                className="text-xs font-medium text-neutral-500 dark:text-neutral-400"
                dateTime={row.occurredUtc}
              >
                {new Date(row.occurredUtc).toLocaleString()}
              </time>
              {elapsed ? (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{elapsed}</span>
              ) : null}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {pipelineEventTypeFriendlyLabel(row.eventType)}
              </span>
              <span className="text-neutral-700 dark:text-neutral-300">
                <span className="sr-only">Actor: </span>
                {actorLabel(row.actorUserName)}
              </span>
              {omitEventTechnicalDetails ? null : (
              <details className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                <summary className="cursor-pointer select-none text-teal-800 underline dark:text-teal-300">
                  Technical details
                </summary>
                <div className="mt-2 space-y-1 border-s border-neutral-200 ps-3 dark:border-neutral-700">
                  <p className="m-0">
                    <span className="font-medium text-neutral-600 dark:text-neutral-400">Event id:</span>{" "}
                    <code className="text-[12px]">{row.eventId}</code>
                  </p>
                  <p className="m-0">
                    <span className="font-medium text-neutral-600 dark:text-neutral-400">Event type:</span>{" "}
                    <code className="text-[12px]">{row.eventType}</code>
                  </p>
                  {row.correlationId ? (
                    <p className="m-0">
                      <span className="font-medium text-neutral-600 dark:text-neutral-400">Correlation:</span>{" "}
                      {row.correlationId}
                    </p>
                  ) : null}
                </div>
              </details>
              )}
            </div>
          </div>
        </li>
        );
      })}
    </ol>
  );
}

