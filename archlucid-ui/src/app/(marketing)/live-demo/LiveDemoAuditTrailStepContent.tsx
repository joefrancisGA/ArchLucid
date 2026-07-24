import { Button } from "@/components/ui/button";
import { buildDemoPreviewTimelineRows } from "@/lib/demo-preview-timeline-present";
import {
  LIVE_DEMO_AUDIT_MILESTONE_LABEL,
  LIVE_DEMO_AUDIT_MILESTONE_SUPPORTING,
  LIVE_DEMO_INSPECT_ACTION_AUDIT,
  LIVE_DEMO_KEY_TAKEAWAY_HEADING,
} from "@/lib/live-demo-page-copy";
import { resolveLiveDemoInspectHref } from "@/lib/live-demo-public-links";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import type { PipelineTimelineItem } from "@/types/authority";
import { cn } from "@/lib/utils";

import { LiveDemoDeliverablesCompact } from "./LiveDemoDeliverablesCompact";
import { LiveDemoReviewIntegritySection } from "./LiveDemoReviewIntegritySection";
import { LiveDemoTrackedLink } from "./LiveDemoTrackedLink";

type LiveDemoAuditTrailStepContentProps = {
  readonly payload: DemoCommitPagePreviewResponse;
  readonly pipelineItems: PipelineTimelineItem[];
  readonly runId: string;
  readonly manifestId: string | null;
  readonly primaryFindingId?: string;
  readonly isRunDetailAvailable: boolean;
  readonly operatorDeepLinksAvailable: boolean;
  readonly keyTakeaway: string;
};

function safeLocaleTime(iso: string): string {
  if (iso.trim().length === 0) {
    return "—";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

export function LiveDemoAuditTrailStepContent(props: LiveDemoAuditTrailStepContentProps) {
  const rows = buildDemoPreviewTimelineRows(props.pipelineItems, {
    runId: props.runId,
    manifestId: props.manifestId,
    primaryFindingId: props.primaryFindingId,
    isRunDetailAvailable: props.isRunDetailAvailable,
  });
  const inspectHref = resolveLiveDemoInspectHref(
    "audit-trail",
    props.runId,
    props.manifestId,
    props.operatorDeepLinksAvailable,
  );

  return (
    <article data-testid="live-demo-step-audit-trail">
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        Audit trail
      </h2>
      <p className={cn("m-0 mt-2 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        {LIVE_DEMO_AUDIT_MILESTONE_SUPPORTING}
      </p>

      <div className="mt-4">
        <h3 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
          {LIVE_DEMO_AUDIT_MILESTONE_LABEL}
        </h3>
        <ol className="m-0 mt-3 list-none space-y-0 p-0" aria-label="Review lifecycle milestones" data-testid="live-demo-compact-timeline">
          {rows.map((row, index) => (
            <li key={row.eventId} className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-700 dark:bg-teal-400" aria-hidden />
                {index < rows.length - 1 ? (
                  <span className="mt-1 w-px flex-1 bg-neutral-300 dark:bg-neutral-700" aria-hidden />
                ) : null}
              </div>
              <div className={cn("min-w-0 flex-1 pb-3", index < rows.length - 1 ? "border-b border-neutral-200 dark:border-neutral-800" : "")}>
                <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", MARKETING_TYPOGRAPHY.cardTitle)}>
                  {row.title}
                </p>
                <time className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)} dateTime={row.occurredUtc}>
                  {safeLocaleTime(row.occurredUtc)}
                </time>
                {row.actorUserName.trim().length > 0 ? (
                  <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
                    {row.actorUserName}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 space-y-4">
        <LiveDemoReviewIntegritySection />
        <LiveDemoDeliverablesCompact payload={props.payload} />
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}>
          {LIVE_DEMO_KEY_TAKEAWAY_HEADING}
        </p>
        <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>{props.keyTakeaway}</p>
      </div>

      <div className="mt-4">
        <Button asChild variant="outline" data-testid="live-demo-inspect-audit">
          <LiveDemoTrackedLink href={inspectHref} trackKind="artifact" trackValue="audit-trail">
            {LIVE_DEMO_INSPECT_ACTION_AUDIT}
          </LiveDemoTrackedLink>
        </Button>
      </div>
    </article>
  );
}
