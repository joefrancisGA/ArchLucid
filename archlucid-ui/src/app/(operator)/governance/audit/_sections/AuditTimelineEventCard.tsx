import { cn } from "@/lib/utils";
import Link from "next/link";
import type { AuditEvent } from "@/lib/api";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer/buyer-facing-review-title";
import { pipelineEventTypeBuyerMilestoneSubtitle, pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { auditBuyerEventIsSystemRecordedActor } from "@/app/(operator)/governance/audit/audit-ui-helpers";
import { auditTrailGovernanceEventLabel } from "@/lib/audit-trail-page-helpers";
import { buyerSafeActorDisplayName } from "@/lib/buyer/buyer-demo-persona-labels";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
            <p className={cn("m-0 font-semibold leading-snug text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {pipelineEventTypeBuyerMilestoneSubtitle(ev.eventType)}
            </p>
            <span
              className={cn(
                systemRecorded
                  ? "rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
                  : "inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-al-text-primary dark:border-neutral-600",
                OPERATOR_TYPOGRAPHY.badge,
              )}
            >
              {systemRecorded ? "Automatic" : "Human"}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <time
              dateTime={ev.occurredUtc}
              className={cn("tabular-nums text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
            >
              {formatUtc(ev.occurredUtc)}
            </time>
            <span
              className={cn(
                "inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-al-text-primary dark:border-neutral-600",
                OPERATOR_TYPOGRAPHY.badge,
              )}
            >
              {auditTrailGovernanceEventLabel(ev.eventType)}
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <time
            dateTime={ev.occurredUtc}
            className={cn("font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            {formatUtc(ev.occurredUtc)}
          </time>
          <span
            className={cn(
              "inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-al-text-primary dark:border-neutral-600",
              OPERATOR_TYPOGRAPHY.badge,
            )}
          >
            {pipelineEventTypeFriendlyLabel(ev.eventType)}
          </span>
        </div>
      )}
      <div className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
        {buyerPolishedShell ? (
          <div>
            <span className="font-medium text-al-text-primary">
              {buyerSafeActorDisplayName(ev.actorUserName, ev.eventType)}
            </span>
            <span className="text-al-text-secondary">
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
        <div className={cn("mt-1.5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Review:{" "}
          {ev.runId ? (
            <Link
              href={`/architecture/reviews/${ev.runId}`}
              className={OPERATOR_LINK.nav}
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
          <div className={OPERATOR_TYPOGRAPHY.body}>Correlation: {ev.correlationId ?? "—"}</div>
          {ev.otelTraceId ? (
            <div className={OPERATOR_TYPOGRAPHY.body}>
              Trace:{" "}
              <code className={cn("break-all font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                {ev.otelTraceId}
              </code>
            </div>
          ) : null}
          <div className={OPERATOR_TYPOGRAPHY.body}>
            Review:{" "}
            {ev.runId ? (
              <Link
                href={`/architecture/reviews/${ev.runId}`}
                className={OPERATOR_LINK.nav}
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
          <div className={cn("mt-1.5", OPERATOR_TYPOGRAPHY.body)}>
            <Link
              href={`/architecture/reviews/${ev.runId}#agent-traces`}
              className={OPERATOR_LINK.nav}
            >
              View agent traces →
            </Link>
          </div>
        )
      ) : null}
      {!buyerPolishedShell ? (
        <details className="mt-2.5">
          <summary className={cn("cursor-pointer", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>Data JSON</summary>
          <pre
            className={cn(
              "mt-2 overflow-auto rounded-md bg-neutral-50/90 p-2 dark:bg-neutral-900/50",
              OPERATOR_TYPOGRAPHY.micro,
            )}
          >
            {tryFormatDataJson(ev.dataJson)}
          </pre>
        </details>
      ) : null}
      {buyerPolishedShell ? (
        <details className="mt-2.5" data-testid="audit-timeline-technical-details">
          <summary className={cn("cursor-pointer", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>Technical details</summary>
          <div className={cn("mt-2 space-y-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
            <p className="m-0">
              Event id: <code>{ev.eventId}</code>
            </p>
            {ev.runId ? (
              <p className="m-0">
                Review id: <code>{ev.runId}</code>
              </p>
            ) : null}
            {ev.correlationId ? (
              <p className="m-0">
                Correlation id: <code>{ev.correlationId}</code>
              </p>
            ) : null}
            {ev.otelTraceId ? (
              <p className="m-0">
                Trace id: <code>{ev.otelTraceId}</code>
              </p>
            ) : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}
