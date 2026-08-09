import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailWorkspaceRecommendedAction } from "@/lib/run-detail-workspace-derive";

export type RunDetailRecommendedActionsPanelProps = {
  readonly actions: readonly RunDetailWorkspaceRecommendedAction[];
};

/** Compact recommended next actions derived from live review state. */
export function RunDetailRecommendedActionsPanel(
  props: RunDetailRecommendedActionsPanelProps,
): React.JSX.Element {
  return (
    <section
      id="recommended-actions"
      className="scroll-mt-24 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="run-detail-recommended-actions"
      aria-label="Recommended next actions"
    >
      <h2 className={cn("m-0 mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
        Recommended next actions
      </h2>
      {props.actions.length === 0 ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          No outstanding actions — review the summary and findings below.
        </p>
      ) : (
        <ul className={cn("m-0 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {props.actions.map((action) => (
            <li
              key={action.id}
              className="rounded-md border border-neutral-100 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
            >
              <div className="space-y-1">
                <p className="m-0 font-semibold text-neutral-900 dark:text-neutral-100">{action.title}</p>
                <p className="m-0 text-neutral-600 dark:text-neutral-400">{action.reason}</p>
                <p className="m-0 text-neutral-500 dark:text-neutral-500">
                  {action.relatedFindingCount !== null
                    ? `${action.relatedFindingCount} related finding${action.relatedFindingCount === 1 ? "" : "s"}`
                    : null}
                  {action.ownerOrRole !== null ? (
                    <span>
                      {action.relatedFindingCount !== null ? " · " : ""}
                      {action.ownerOrRole}
                    </span>
                  ) : null}
                </p>
                <p className="m-0 pt-1">
                  <Link className={OPERATOR_LINK.nav} href={action.href}>
                    {action.actionLabel}
                  </Link>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
