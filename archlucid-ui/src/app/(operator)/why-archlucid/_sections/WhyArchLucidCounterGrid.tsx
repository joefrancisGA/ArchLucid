import { cn } from "@/lib/utils";
import type { WhyArchLucidSnapshot } from "@/lib/api";
import { formatWhyPageInstant } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-helpers";
import { WhyArchLucidCounter } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidCounter";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WHY_ARCHLUCID_COUNTER_HINT_AUDIT_ROWS,
  WHY_ARCHLUCID_COUNTER_HINT_FINDINGS,
  WHY_ARCHLUCID_COUNTER_HINT_HOURS_SAVED,
  WHY_ARCHLUCID_COUNTER_HINT_RUNS_CREATED,
  whyArchlucidCounterHintAuditRowsTruncated,
} from "@/lib/why-archlucid-page-copy";

export type WhyArchLucidCounterGridProps = {
  readonly snapshot: WhyArchLucidSnapshot;
};

export function WhyArchLucidCounterGrid(props: WhyArchLucidCounterGridProps) {
  const { snapshot } = props;
  const severityRows = Object.entries(snapshot.findingsProducedBySeverity ?? {});

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <WhyArchLucidCounter
        label="Architecture reviews created"
        value={snapshot.runsCreatedTotal}
        hint={WHY_ARCHLUCID_COUNTER_HINT_RUNS_CREATED}
      />
      <WhyArchLucidCounter
        label="Est. manual hours saved"
        value={snapshot.estimatedManualWorkHoursSaved ?? 0}
        hint={WHY_ARCHLUCID_COUNTER_HINT_HOURS_SAVED}
        valueFormat="hours"
      />
      <WhyArchLucidCounter
        label="Audit rows (demo scope)"
        value={snapshot.auditRowCount}
        hint={
          snapshot.auditRowCountTruncated
            ? whyArchlucidCounterHintAuditRowsTruncated(snapshot.auditRowCount)
            : WHY_ARCHLUCID_COUNTER_HINT_AUDIT_ROWS
        }
      />
      <WhyArchLucidCounter
        label="Findings (all severities)"
        value={severityRows.reduce(
          (sum, [, count]) => sum + (typeof count === "number" && Number.isFinite(count) ? count : 0),
          0,
        )}
        hint={WHY_ARCHLUCID_COUNTER_HINT_FINDINGS}
      />
      {severityRows.length > 0 ? (
        <div className="sm:col-span-3">
          <h3 className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>By severity</h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {severityRows.map(([severity, count]) => (
              <li
                key={severity}
                className={cn(
                  "rounded border border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-900",
                  OPERATOR_TYPOGRAPHY.helper,
                )}
              >
                <span className="font-medium text-al-text-primary">{severity}</span>{" "}
                <span className="text-al-text-secondary">— {count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className={cn("sm:col-span-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Snapshot generated {formatWhyPageInstant(snapshot.generatedUtc)} · demo review {snapshot.demoRunId}
        {typeof snapshot.estimatedManualWorkHoursSavedMethodology === "string" &&
        snapshot.estimatedManualWorkHoursSavedMethodology.trim().length > 0 ? (
          <span className="mt-1 block">{snapshot.estimatedManualWorkHoursSavedMethodology}</span>
        ) : null}
      </p>
    </div>
  );
}
