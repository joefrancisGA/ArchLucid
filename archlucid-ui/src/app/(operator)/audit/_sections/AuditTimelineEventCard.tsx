import Link from "next/link";
import type { AuditEvent } from "@/lib/api";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";
import { pipelineEventTypeBuyerMilestoneSubtitle, pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { auditBuyerEventIsSystemRecordedActor } from "@/app/(operator)/audit/audit-ui-helpers";
import { auditBuyerActorRoleLine, formatUtc, tryFormatDataJson } from "./audit-page-helpers";

type AuditTimelineEventCardProps = {
  ev: AuditEvent;
  buyerPolishedShell: boolean;
  uniformRunId: string | null;
};

export function AuditTimelineEventCard(props: AuditTimelineEventCardProps) {
  const { ev, buyerPolishedShell, uniformRunId } = props;
  const runKey = ev.runId?.trim() ?? "";
  const hideBuyerReviewLine =
    buyerPolishedShell &&
    uniformRunId !== null &&
    runKey.length > 0 &&
    uniformRunId === runKey;
  const systemRecorded = auditBuyerEventIsSystemRecordedActor(ev.actorUserName);

  return (
    <article
      className={
        buyerPolishedShell
          ? "rounded-lg border border-neutral-200 bg-white pl-3.5 pr-3 py-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
          : "rounded-lg border border-neutral-200 border-l-4 border-l-teal-600 bg-white p-3 shadow-sm dark:border-neutral-700 dark:border-l-teal-500 dark:bg-neutral-950"
      }
      data-testid="audit-timeline-event-card"
    >
      {buyerPolishedShell ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <p className="m-0 text-[13px] font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
              {pipelineEventTypeBuyerMilestoneSubtitle(ev.eventType)}
            </p>
            <span
              className={
                systemRecorded
                  ? "rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
                  : "inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-[11px] font-medium text-al-text-primary dark:border-neutral-600"
              }
            >
              {systemRecorded ? "Automatic" : "Human"}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <time
              dateTime={ev.occurredUtc}
              className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400"
            >
              {formatUtc(ev.occurredUtc)}
            </time>
            <span className="inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-[11px] font-medium text-al-text-primary dark:border-neutral-600">
              {pipelineEventTypeFriendlyLabel(ev.eventType)}
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <time
            dateTime={ev.occurredUtc}
            className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100"
          >
            {formatUtc(ev.occurredUtc)}
          </time>
          <span className="inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-xs font-medium text-al-text-primary dark:border-neutral-600">
            {pipelineEventTypeFriendlyLabel(ev.eventType)}
          </span>
        </div>
      )}
      <div className="mt-2 text-sm">
        {buyerPolishedShell ? (
          <div>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">{ev.actorUserName}</span>
            <span className="text-neutral-600 dark:text-neutral-400">
              {" "}
              · {auditBuyerActorRoleLine(ev.actorUserName, ev.eventType)}
            </span>
          </div>
        ) : (
          <>
            Actor: {ev.actorUserName} ({ev.actorUserId})
          </>
        )}
      </div>
      {buyerPolishedShell && !hideBuyerReviewLine ? (
        <div className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-300">
          Review:{" "}
          {ev.runId ? (
            <Link
              href={`/reviews/${ev.runId}`}
              title="Open review"
              className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            >
              {buyerFacingReviewLinkLabelFromRunId(ev.runId)}
            </Link>
          ) : (
            "—"
          )}
        </div>
      ) : null}
      {!buyerPolishedShell ? (
        <>
          <div className="text-sm">Correlation: {ev.correlationId ?? "—"}</div>
          {ev.otelTraceId ? (
            <div className="text-sm">
              Trace:{" "}
              <code title={ev.otelTraceId} className="text-xs">
                {ev.otelTraceId.slice(0, 16)}…
              </code>
            </div>
          ) : null}
          <div className="text-sm">
            Review:{" "}
            {ev.runId ? (
              <Link
                href={`/reviews/${ev.runId}`}
                title="Open review"
                className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
              >
                {buyerFacingReviewLinkLabelFromRunId(ev.runId)}
              </Link>
            ) : (
              "—"
            )}
          </div>
        </>
      ) : null}
      {ev.runId ? (
        buyerPolishedShell ? null : (
          <div className="mt-1.5 text-[13px]">
            <Link
              href={`/reviews/${ev.runId}#agent-traces`}
              className="text-xs font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            >
              View agent traces →
            </Link>
          </div>
        )
      ) : null}
      {!buyerPolishedShell ? (
        <details className="mt-2.5">
          <summary className="cursor-pointer">Data JSON</summary>
          <pre className="mt-2 overflow-auto rounded-md bg-neutral-50/90 p-2 text-xs dark:bg-neutral-900/50">
            {tryFormatDataJson(ev.dataJson)}
          </pre>
        </details>
      ) : null}
    </article>
  );
}
