import Link from "next/link";
import type { AuditEvent } from "@/lib/api";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";
import { pipelineEventTypeBuyerMilestoneSubtitle, pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
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

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950">
      <div className="flex flex-wrap items-center gap-2">
        <strong>{formatUtc(ev.occurredUtc)}</strong>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-900 dark:bg-indigo-900/50 dark:text-indigo-300">
          {pipelineEventTypeFriendlyLabel(ev.eventType)}
        </span>
      </div>
      {buyerPolishedShell ? (
        <p className="m-0 mt-2 text-[13px] leading-snug text-neutral-600 dark:text-neutral-400">
          {pipelineEventTypeBuyerMilestoneSubtitle(ev.eventType)}
        </p>
      ) : null}
      <div className="mt-1.5 text-sm">
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
        <div className="text-sm">
          Review:{" "}
          {ev.runId ? (
            <Link href={`/reviews/${ev.runId}`} title="Open review">
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
              <Link href={`/reviews/${ev.runId}`} title="Open review">
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
          <div className="mt-0.5 text-[13px]">
            <Link href={`/reviews/${ev.runId}#agent-traces`} className="text-xs">
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
    </div>
  );
}
