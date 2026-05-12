import type { WhyArchLucidSnapshot } from "@/lib/api";
import { formatWhyPageInstant } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-helpers";
import { WhyArchLucidCounter } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidCounter";

export type WhyArchLucidCounterGridProps = {
  readonly snapshot: WhyArchLucidSnapshot;
};

export function WhyArchLucidCounterGrid(props: WhyArchLucidCounterGridProps) {
  const { snapshot } = props;
  const severityRows = Object.entries(snapshot.findingsProducedBySeverity ?? {});

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <WhyArchLucidCounter label="Architecture reviews created" value={snapshot.runsCreatedTotal} hint="archlucid_runs_created_total" />
      <WhyArchLucidCounter
        label="Est. manual hours saved"
        value={snapshot.estimatedManualWorkHoursSaved ?? 0}
        hint="planning heuristic — see methodology footnote"
        valueFormat="hours"
      />
      <WhyArchLucidCounter
        label="Audit rows (demo scope)"
        value={snapshot.auditRowCount}
        hint={
          snapshot.auditRowCountTruncated
            ? `IAuditRepository.GetByScopeAsync (capped at ${snapshot.auditRowCount})`
            : "IAuditRepository.GetByScopeAsync"
        }
      />
      <WhyArchLucidCounter
        label="Findings (all severities)"
        value={severityRows.reduce(
          (sum, [, count]) => sum + (typeof count === "number" && Number.isFinite(count) ? count : 0),
          0,
        )}
        hint="sum of archlucid_findings_produced_total"
      />
      {severityRows.length > 0 ? (
        <div className="sm:col-span-3">
          <h3 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">By severity</h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {severityRows.map(([severity, count]) => (
              <li
                key={severity}
                className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{severity}</span>{" "}
                <span className="text-neutral-500">— {count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="sm:col-span-3 text-xs text-neutral-500">
        Snapshot generated {formatWhyPageInstant(snapshot.generatedUtc)} · demo review <code>{snapshot.demoRunId}</code>
        {typeof snapshot.estimatedManualWorkHoursSavedMethodology === "string" &&
        snapshot.estimatedManualWorkHoursSavedMethodology.trim().length > 0 ? (
          <span className="mt-1 block">{snapshot.estimatedManualWorkHoursSavedMethodology}</span>
        ) : null}
      </p>
    </div>
  );
}
