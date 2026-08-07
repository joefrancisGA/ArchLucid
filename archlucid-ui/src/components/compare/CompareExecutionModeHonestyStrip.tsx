import { StructuralExecutionModeBadge } from "@/components/StructuralExecutionModeBadge";
import { OperatorWarningCallout } from "@/components/OperatorShellMessage";
import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import { resolveCompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunSummary } from "@/types/authority";
import { cn } from "@/lib/utils";

type Props = {
  readonly baselineRunId: string;
  readonly updatedRunId: string;
  readonly baselinePickedSummary: RunSummary | null;
  readonly updatedPickedSummary: RunSummary | null;
};

/** Execution-mode badges and delta-narrative honesty for compare workspace (TB-2071). */
export function CompareExecutionModeHonestyStrip(props: Props) {
  const honesty = resolveCompareExecutionModeHonesty(
    props.baselinePickedSummary,
    props.updatedPickedSummary,
  );

  if (honesty === null) {
    return null;
  }

  const baselineLabel = compareRunHeadingLabel(props.baselineRunId, props.baselinePickedSummary);
  const updatedLabel = compareRunHeadingLabel(props.updatedRunId, props.updatedPickedSummary);

  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-950"
      aria-label="Execution mode comparison"
      data-testid="compare-execution-mode-honesty-strip"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Execution mode (per review)
          </p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Compare narratives and tables are directional — confirm trust labels on inspect or export before sign-off.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Baseline</span>
            <StructuralExecutionModeBadge structuralExecutionMode={honesty.baselineMode} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Updated</span>
            <StructuralExecutionModeBadge structuralExecutionMode={honesty.updatedMode} />
          </div>
        </div>
      </div>

      {honesty.advisoryParagraph !== null ? (
        <OperatorWarningCallout>
          <strong>
            {honesty.modesDiffer
              ? `Execution modes differ (${baselineLabel} vs ${updatedLabel}).`
              : "Non-real execution on one or both reviews."}
          </strong>
          <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{honesty.advisoryParagraph}</p>
        </OperatorWarningCallout>
      ) : null}
    </section>
  );
}
