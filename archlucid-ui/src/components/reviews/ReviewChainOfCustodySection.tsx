import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RunDetail } from "@/types/authority";

import { runDetailSectionHeadingClass } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-section-heading";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ReviewChainOfCustodySectionProps = {
  readonly run: RunDetail["run"];
  readonly manifestId: string | null;
  readonly ruleSetId?: string | null;
  readonly ruleSetVersion?: string | null;
  readonly triggerSource?: "ui" | "api" | "ci" | null;
};

function formatUtc(utc: string | null | undefined): string {
  if (!utc) return " — ";

  return new Date(utc).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

function triggerSourceLabel(source: "ui" | "api" | "ci" | null | undefined): string {
  if (source === "api") return "API";
  if (source === "ci") return "CI pipeline";

  return "Web UI";
}

/**
 * Chain of custody for a review — who ran it, what ran, when it was sealed.
 * Answers the three questions every compliance officer asks before relying on a review.
 */
export function ReviewChainOfCustodySection({
  run,
  manifestId,
  ruleSetId,
  ruleSetVersion,
  triggerSource,
}: ReviewChainOfCustodySectionProps): ReactElement {
  const architectureRequestId =
    "architectureRequestId" in run && typeof run.architectureRequestId === "string"
      ? run.architectureRequestId
      : null;

  const createdLabel = formatUtc(run.createdUtc);
  const completedLabel =
    "completedUtc" in run && typeof run.completedUtc === "string"
      ? formatUtc(run.completedUtc)
      : null;

  const policyPackLabel =
    ruleSetId
      ? ruleSetVersion
        ? `${ruleSetId} v${ruleSetVersion}`
        : ruleSetId
      : "Default policy pack";

  return (
    <section id="chain-of-custody" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>Chain of custody</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <CollapsibleSection title="Who and when" defaultOpen>
            <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
              <div>
                <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Analysis triggered via</dt>
                <dd className="mt-0.5 text-neutral-900 dark:text-neutral-100">
                  {triggerSourceLabel(triggerSource)}
                </dd>
              </div>
              <div>
                <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Analysis started</dt>
                <dd className={cn("mt-0.5 font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.navHelper)}>{createdLabel}</dd>
              </div>
              {completedLabel !== null ? (
                <div>
                  <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Analysis completed</dt>
                  <dd className={cn("mt-0.5 font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.navHelper)}>{completedLabel}</dd>
                </div>
              ) : null}
              <div>
                <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Package sealed</dt>
                <dd className={cn("mt-0.5 font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.navHelper)}>
                  {manifestId !== null ? completedLabel ?? "Yes" : "Not yet sealed"}
                </dd>
              </div>
            </dl>
          </CollapsibleSection>

          <CollapsibleSection title="What ran" defaultOpen>
            <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
              <div>
                <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Policy pack applied</dt>
                <dd className={cn("mt-0.5 font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.navHelper)}>{policyPackLabel}</dd>
              </div>
              {architectureRequestId !== null ? (
                <div>
                  <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Architecture request</dt>
                  <dd className={cn("mt-0.5 flex items-center gap-1.5 font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.navHelper)}>
                    <span className="truncate">{architectureRequestId.slice(0, 16)}…</span>
                    <CopyIdButton value={architectureRequestId} aria-label="Copy architecture request ID" />
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Review ID</dt>
                <dd className={cn("mt-0.5 flex items-center gap-1.5 font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.navHelper)}>
                  <span className="truncate">{run.runId.slice(0, 16)}…</span>
                  <CopyIdButton value={run.runId} aria-label="Copy review ID" />
                </dd>
              </div>
              {run.contextSnapshotId ? (
                <div>
                  <dt className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Context snapshot</dt>
                  <dd className={cn("mt-0.5 flex items-center gap-1.5 font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.navHelper)}>
                    <span className="truncate">{run.contextSnapshotId.slice(0, 16)}…</span>
                    <CopyIdButton value={run.contextSnapshotId} aria-label="Copy context snapshot ID" />
                  </dd>
                </div>
              ) : null}
            </dl>
          </CollapsibleSection>
        </CardContent>
      </Card>
    </section>
  );
}
