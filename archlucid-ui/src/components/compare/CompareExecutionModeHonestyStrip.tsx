import { StructuralExecutionModeBadge } from "@/components/StructuralExecutionModeBadge";
import { resolveCompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatStructuralExecutionModeLabel,
  type StructuralExecutionModeInput,
} from "@/lib/structural-execution-mode";
import type { RunSummary } from "@/types/authority";
import { cn } from "@/lib/utils";

type Props = {
  readonly baselineRunId: string;
  readonly updatedRunId: string;
  readonly baselinePickedSummary: RunSummary | null;
  readonly updatedPickedSummary: RunSummary | null;
};

function isModeUnavailable(mode: StructuralExecutionModeInput): boolean {
  return mode === undefined || mode === null || formatStructuralExecutionModeLabel(mode) === "Unknown";
}

function ExecutionModeSideBadge(props: {
  readonly label: string;
  readonly mode: StructuralExecutionModeInput;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</span>
      {isModeUnavailable(props.mode) ? (
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Unavailable</span>
      ) : (
        <StructuralExecutionModeBadge structuralExecutionMode={props.mode} />
      )}
    </div>
  );
}

/** Execution-mode badges and delta-narrative honesty for compare workspace (TB-2071). */
export function CompareExecutionModeHonestyStrip(props: Props) {
  const honesty = resolveCompareExecutionModeHonesty(
    props.baselinePickedSummary,
    props.updatedPickedSummary,
  );

  if (honesty === null) {
    return null;
  }

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
          <ExecutionModeSideBadge label="Baseline" mode={honesty.baselineMode} />
          <ExecutionModeSideBadge label="Updated" mode={honesty.updatedMode} />
        </div>
      </div>
      {honesty.advisoryParagraph !== null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{honesty.advisoryParagraph}</p>
      ) : null}
    </section>
  );
}
