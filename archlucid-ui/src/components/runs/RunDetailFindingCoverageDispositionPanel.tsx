"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { components } from "@/lib/openapi-schemas";

type FindingCoverageSummary = components["schemas"]["RunFindingCoverageSummary"];

export function DegradedFindingCoverageBanner({
  failedEngineLabels,
}: {
  readonly failedEngineLabels: readonly string[];
}) {
  const labelText =
    failedEngineLabels.length > 0
      ? failedEngineLabels.join(", ")
      : "one or more finding engines";

  return (
    <div
      className={cn(
        "rounded-md border border-amber-600/40 bg-al-surface-raised p-3 text-al-text-primary dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="degraded-finding-coverage-banner"
      role="status"
    >
      <p className="m-0 font-semibold">Degraded finding coverage</p>
      <p className={cn("m-0 mt-1 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)}>
        This review completed with incomplete finding-engine coverage ({labelText}). Treat unresolved findings as
        advisory until coverage is restored.
      </p>
    </div>
  );
}

function finiteCoverageCount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function RunDetailFindingCoverageDispositionPanel({
  summary,
}: {
  readonly summary: NonNullable<FindingCoverageSummary>;
}) {
  const disposition = summary.dispositionCoverage;

  if (disposition === null || disposition === undefined) {
    return null;
  }

  const rows = [
    ["Open", disposition.openCount],
    ["Accepted", disposition.acceptedCount],
    ["Remediated", disposition.remediatedCount],
    ["Deferred", disposition.deferredCount],
    ["Needs evidence", disposition.needsEvidenceCount],
    ["Rejected / N/A", disposition.rejectedNotApplicableCount],
    ["Waived", disposition.waivedCount],
  ] as const;

  return (
    <section
      className={cn(
        "rounded-lg border px-3 py-3",
        OPERATOR_TYPOGRAPHY.body,
        summary.hasCommitBlockingFailures === true
          ? "border-rose-600/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50"
          : "border-neutral-200 bg-neutral-50/80 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-100",
      )}
      data-testid="finding-coverage-disposition-panel"
      role={summary.hasCommitBlockingFailures === true ? "alert" : "status"}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 font-semibold">
          {summary.hasCommitBlockingFailures === true
            ? "Commit-blocking finding coverage"
            : "Finding disposition coverage"}
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-current/80")}>
          Engines {finiteCoverageCount(summary.enginesSucceeded)}/{finiteCoverageCount(summary.enginesAttempted)} succeeded
          {finiteCoverageCount(summary.enginesFailed) > 0 ? ` · ${finiteCoverageCount(summary.enginesFailed)} failed` : ""}
        </p>
      </div>
      {summary.hasCommitBlockingFailures === true ? (
        <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)}>
          Finalization should remain blocked until the coverage gap is resolved or explicitly regenerated.
        </p>
      ) : null}
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md bg-white/65 px-2 py-1.5 dark:bg-black/15">
            <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "opacity-70")}>{label}</dt>
            <dd className={cn("m-0 font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{finiteCoverageCount(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
