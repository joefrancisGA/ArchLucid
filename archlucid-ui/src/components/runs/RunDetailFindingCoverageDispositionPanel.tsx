"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
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
      : "Failed finding-engine labels were not stored";

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

function formatEngineCoverageSummaryLine(summary: NonNullable<FindingCoverageSummary>): string {
  const succeeded = summary.enginesSucceeded;
  const attempted = summary.enginesAttempted;
  const failed = summary.enginesFailed;

  if (succeeded === null || succeeded === undefined) {
    return "Engine succeeded count was not stored.";
  }

  if (attempted === null || attempted === undefined) {
    return "Engine attempted count was not stored.";
  }

  const succeededLabel = finiteIntegerCountDisplay(succeeded);
  const attemptedLabel = finiteIntegerCountDisplay(attempted);
  let line = `Engines ${succeededLabel}/${attemptedLabel} succeeded`;

  if (failed === null || failed === undefined) {
    return `${line} · Engine failed count was not stored.`;
  }

  if (typeof failed === "number" && Number.isFinite(failed) && Math.trunc(failed) > 0) {
    line = `${line} · ${finiteIntegerCountDisplay(failed)} failed`;
  }

  return line;
}

export function RunDetailFindingCoverageDispositionPanel({
  summary,
}: {
  readonly summary: NonNullable<FindingCoverageSummary>;
}) {
  const disposition = summary.dispositionCoverage;

  if (disposition === null || disposition === undefined) {
    return (
      <section
        className={cn(
          "rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-3 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.body,
        )}
        data-testid="finding-coverage-disposition-panel"
        role="status"
      >
        <p className="m-0 font-semibold">Finding disposition coverage</p>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
          Finding disposition counts were not stored.
        </p>
      </section>
    );
  }

  const rows = [
    ["Open", disposition.openCount, "Open count was not stored."],
    ["Accepted", disposition.acceptedCount, "Accepted count was not stored."],
    ["Remediated", disposition.remediatedCount, "Remediated count was not stored."],
    ["Deferred", disposition.deferredCount, "Deferred count was not stored."],
    ["Needs evidence", disposition.needsEvidenceCount, "Needs-evidence count was not stored."],
    [
      "Rejected or not applicable",
      disposition.rejectedNotApplicableCount,
      "Rejected or not-applicable count was not stored.",
    ],
    ["Waived", disposition.waivedCount, "Waived count was not stored."],
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
          {formatEngineCoverageSummaryLine(summary)}
        </p>
      </div>
      {summary.hasCommitBlockingFailures === true ? (
        <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)}>
          Finalization should remain blocked until the coverage gap is resolved or explicitly regenerated.
        </p>
      ) : summary.hasCommitBlockingFailures == null ? (
        <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)}>
          Commit-blocking coverage flag was not stored on this summary; treat disposition counts as advisory until
          finalization rules are confirmed.
        </p>
      ) : null}
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map(([label, value, notStoredLabel]) => (
          <div key={label} className="rounded-md bg-white/65 px-2 py-1.5 dark:bg-black/15">
            <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "opacity-70")}>{label}</dt>
            <dd className={cn("m-0 font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {finiteIntegerCountDisplay(value, { notStoredLabel })}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
