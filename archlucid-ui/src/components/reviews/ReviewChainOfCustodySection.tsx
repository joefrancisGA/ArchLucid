import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RunDetail } from "@/types/authority";

import { runDetailSectionHeadingClass } from "@/app/(operator)/reviews/[runId]/_sections/run-detail-section-heading";

export type ReviewChainOfCustodySectionProps = {
  readonly run: RunDetail["run"];
  readonly manifestId: string | null;
  readonly ruleSetId?: string | null;
  readonly ruleSetVersion?: string | null;
  readonly triggerSource?: "ui" | "api" | "ci" | null;
};

function formatUtc(utc: string | null | undefined): string {
  if (!utc) return "—";

  return new Date(utc).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

function triggerSourceLabel(source: "ui" | "api" | "ci" | null | undefined): string {
  if (source === "api") return "API";
  if (source === "ci") return "CI pipeline";

  return "Web UI";
}

/**
 * Chain of custody for a review package — who ran it, what ran, when it was sealed.
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
            <dl className="m-0 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Analysis triggered via</dt>
                <dd className="mt-0.5 text-neutral-900 dark:text-neutral-100">
                  {triggerSourceLabel(triggerSource)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Analysis started</dt>
                <dd className="mt-0.5 font-mono text-xs text-neutral-800 dark:text-neutral-200">{createdLabel}</dd>
              </div>
              {completedLabel !== null ? (
                <div>
                  <dt className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Analysis completed</dt>
                  <dd className="mt-0.5 font-mono text-xs text-neutral-800 dark:text-neutral-200">{completedLabel}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Package sealed</dt>
                <dd className="mt-0.5 font-mono text-xs text-neutral-800 dark:text-neutral-200">
                  {manifestId !== null ? completedLabel ?? "Yes" : "Not yet sealed"}
                </dd>
              </div>
            </dl>
          </CollapsibleSection>

          <CollapsibleSection title="What ran" defaultOpen>
            <dl className="m-0 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Policy pack applied</dt>
                <dd className="mt-0.5 font-mono text-xs text-neutral-800 dark:text-neutral-200">{policyPackLabel}</dd>
              </div>
              {architectureRequestId !== null ? (
                <div>
                  <dt className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Architecture request</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-neutral-800 dark:text-neutral-200">
                    <span className="truncate">{architectureRequestId.slice(0, 16)}…</span>
                    <CopyIdButton value={architectureRequestId} aria-label="Copy architecture request ID" />
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Review ID</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-neutral-800 dark:text-neutral-200">
                  <span className="truncate">{run.runId.slice(0, 16)}…</span>
                  <CopyIdButton value={run.runId} aria-label="Copy review ID" />
                </dd>
              </div>
              {run.contextSnapshotId ? (
                <div>
                  <dt className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Context snapshot</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-neutral-800 dark:text-neutral-200">
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
