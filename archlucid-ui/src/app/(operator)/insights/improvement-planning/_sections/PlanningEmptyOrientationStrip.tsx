import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  IMPROVEMENT_PLANNING_EMPTY_OUTCOME_EXPORT,
  IMPROVEMENT_PLANNING_EMPTY_OUTCOME_INTRO,
  IMPROVEMENT_PLANNING_EMPTY_OUTCOME_PLANS,
  IMPROVEMENT_PLANNING_EMPTY_OUTCOME_THEMES,
  IMPROVEMENT_PLANNING_EMPTY_OUTCOME_TITLE,
  IMPROVEMENT_PLANNING_MATURITY_CURRENT_HINT,
  IMPROVEMENT_PLANNING_MATURITY_STAGE_FEEDBACK,
  IMPROVEMENT_PLANNING_MATURITY_STAGE_PLANS,
  IMPROVEMENT_PLANNING_MATURITY_STAGE_THEMES,
  IMPROVEMENT_PLANNING_MATURITY_TITLE,
  IMPROVEMENT_PLANNING_PRIORITY_EXPLAIN,
} from "@/lib/planning-empty-orientation-copy";

type MaturityStageProps = {
  readonly label: string;
  readonly active: boolean;
  readonly stepNumber: number;
};

function MaturityStage(props: MaturityStageProps): React.JSX.Element {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5",
        props.active ? "font-medium text-al-text-primary" : "text-al-text-secondary",
      )}
      aria-current={props.active ? "step" : undefined}
    >
      <span aria-hidden="true" className="tabular-nums">
        {props.stepNumber}.
      </span>
      <span>{props.label}</span>
      {props.active ? (
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.badge)}>(current)</span>
      ) : null}
    </li>
  );
}

/**
 * Teaches the empty planning path: progress stage, eventual sections, and priority scoring —
 * without sample theme/plan cards that could be mistaken for tenant data.
 */
export function PlanningEmptyOrientationStrip(): React.JSX.Element {
  return (
    <div className="mt-4 space-y-3" data-testid="planning-empty-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="planning-maturity-heading"
        data-testid="planning-maturity"
      >
        <h2
          id="planning-maturity-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {IMPROVEMENT_PLANNING_MATURITY_TITLE}
        </h2>
        <ol
          className={cn(
            "m-0 mt-2 flex list-none flex-wrap items-center gap-x-3 gap-y-1 p-0",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          <MaturityStage label={IMPROVEMENT_PLANNING_MATURITY_STAGE_FEEDBACK} active stepNumber={1} />
          <li className="text-al-text-secondary" aria-hidden="true">
            →
          </li>
          <MaturityStage label={IMPROVEMENT_PLANNING_MATURITY_STAGE_THEMES} active={false} stepNumber={2} />
          <li className="text-al-text-secondary" aria-hidden="true">
            →
          </li>
          <MaturityStage label={IMPROVEMENT_PLANNING_MATURITY_STAGE_PLANS} active={false} stepNumber={3} />
        </ol>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {IMPROVEMENT_PLANNING_MATURITY_CURRENT_HINT}
        </p>
      </section>

      <section
        className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
        aria-labelledby="planning-empty-outcome-heading"
        data-testid="planning-empty-outcome"
      >
        <h2
          id="planning-empty-outcome-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {IMPROVEMENT_PLANNING_EMPTY_OUTCOME_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {IMPROVEMENT_PLANNING_EMPTY_OUTCOME_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 max-w-3xl list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <li>{IMPROVEMENT_PLANNING_EMPTY_OUTCOME_THEMES}</li>
          <li>{IMPROVEMENT_PLANNING_EMPTY_OUTCOME_PLANS}</li>
          <li>{IMPROVEMENT_PLANNING_EMPTY_OUTCOME_EXPORT}</li>
        </ul>
        <p className={cn("m-0 mt-3 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {IMPROVEMENT_PLANNING_PRIORITY_EXPLAIN}
        </p>
      </section>
    </div>
  );
}
