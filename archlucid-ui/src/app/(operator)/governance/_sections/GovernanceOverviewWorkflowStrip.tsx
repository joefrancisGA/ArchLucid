import { GOVERNANCE_OVERVIEW_APPROVAL_LIFECYCLE_STEPS } from "@/lib/governance/governance-overview-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Compact approval lifecycle on `/governance` overview — orients users before they load a review. */
export function GovernanceOverviewWorkflowStrip(): React.JSX.Element {
  return (
    <div
      className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="governance-overview-workflow-strip"
      role="note"
      aria-label="Resolve outcomes lifecycle"
    >
      <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
        Approval lifecycle
      </p>
      <ol className="m-0 mt-2 flex list-none flex-wrap items-center gap-1 p-0">
        {GOVERNANCE_OVERVIEW_APPROVAL_LIFECYCLE_STEPS.map((step, index) => (
          <li key={step} className="flex min-w-0 items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              <span
                aria-hidden
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-teal-700/30 bg-teal-50 text-[11px] font-semibold text-teal-900 dark:border-teal-600/40 dark:bg-teal-950/50 dark:text-teal-100"
              >
                {index + 1}
              </span>
              {step}
            </span>
            {index < GOVERNANCE_OVERVIEW_APPROVAL_LIFECYCLE_STEPS.length - 1 ? (
              <span aria-hidden className="text-neutral-400 dark:text-neutral-500">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
