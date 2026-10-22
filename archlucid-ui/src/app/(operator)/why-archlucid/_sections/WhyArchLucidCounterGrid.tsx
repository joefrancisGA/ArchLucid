import { cn } from "@/lib/utils";
import type { WhyArchLucidSnapshot } from "@/lib/api";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import { formatWhyPageInstant } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-helpers";
import { WhyArchLucidCounter } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidCounter";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WHY_ARCHLUCID_COUNTER_HINT_AUDIT_ROWS,
  WHY_ARCHLUCID_COUNTER_HINT_FINDINGS,
  WHY_ARCHLUCID_COUNTER_HINT_HOURS_SAVED,
  WHY_ARCHLUCID_COUNTER_HINT_HOURS_SAVED_ZERO,
  WHY_ARCHLUCID_COUNTER_HINT_RUNS_CREATED,
  WHY_ARCHLUCID_COUNTER_LABEL_AUDIT_ROWS,
  WHY_ARCHLUCID_COUNTER_LABEL_FINDINGS,
  WHY_ARCHLUCID_COUNTER_LABEL_HOURS_SAVED,
  WHY_ARCHLUCID_COUNTER_LABEL_RUNS_CREATED,
  WHY_ARCHLUCID_SNAPSHOT_REVIEW_ID_LABEL,
  whyArchlucidCounterHintAuditRowsTruncated,
} from "@/lib/why-archlucid-page-copy";

export type WhyArchLucidCounterGridProps = {
  readonly snapshot: WhyArchLucidSnapshot;
};

function hoursSavedHint(snapshot: WhyArchLucidSnapshot): string {
  const hours = snapshot.estimatedManualWorkHoursSaved ?? 0;
  const methodology = snapshot.estimatedManualWorkHoursSavedMethodology?.trim() ?? "";

  if (hours === 0 && methodology.length === 0) {
    return WHY_ARCHLUCID_COUNTER_HINT_HOURS_SAVED_ZERO;
  }

  if (methodology.length > 0) {
    return methodology;
  }

  return WHY_ARCHLUCID_COUNTER_HINT_HOURS_SAVED;
}

export function WhyArchLucidCounterGrid(props: WhyArchLucidCounterGridProps) {
  const { snapshot } = props;
  const severityRows = Object.entries(snapshot.findingsProducedBySeverity ?? {});

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <WhyArchLucidCounter
        label={WHY_ARCHLUCID_COUNTER_LABEL_RUNS_CREATED}
        value={snapshot.runsCreatedTotal}
        hint={WHY_ARCHLUCID_COUNTER_HINT_RUNS_CREATED}
      />
      <WhyArchLucidCounter
        label={WHY_ARCHLUCID_COUNTER_LABEL_HOURS_SAVED}
        value={snapshot.estimatedManualWorkHoursSaved ?? 0}
        hint={hoursSavedHint(snapshot)}
        valueFormat="hours"
      />
      <WhyArchLucidCounter
        label={WHY_ARCHLUCID_COUNTER_LABEL_AUDIT_ROWS}
        value={snapshot.auditRowCount}
        hint={
          snapshot.auditRowCountTruncated
            ? whyArchlucidCounterHintAuditRowsTruncated(snapshot.auditRowCount)
            : WHY_ARCHLUCID_COUNTER_HINT_AUDIT_ROWS
        }
      />
      <WhyArchLucidCounter
        label={WHY_ARCHLUCID_COUNTER_LABEL_FINDINGS}
        value={severityRows.reduce(
          (sum, [, count]) => sum + (typeof count === "number" && Number.isFinite(count) ? count : 0),
          0,
        )}
        hint={WHY_ARCHLUCID_COUNTER_HINT_FINDINGS}
      />
      {severityRows.length > 0 ? (
        <div className="lg:col-span-4">
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
      <p className={cn("lg:col-span-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Snapshot generated {formatWhyPageInstant(snapshot.generatedUtc)} ·{" "}
        <TechnicalIdDisclosure label={WHY_ARCHLUCID_SNAPSHOT_REVIEW_ID_LABEL} value={snapshot.demoRunId} />
      </p>
    </div>
  );
}
