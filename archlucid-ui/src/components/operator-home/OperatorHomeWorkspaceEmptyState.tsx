import { OPERATOR_HOME_WORKSPACE_EMPTY_BODY, OPERATOR_HOME_WORKSPACE_EMPTY_TITLE } from "@/lib/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** First-run workspace with no review packages — compact empty copy; CTAs live in the hero above. */
export function OperatorHomeWorkspaceEmptyState() {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-neutral-200 px-3 py-3 dark:border-neutral-700",
        OPERATOR_LAYOUT.sectionStack,
      )}
      data-testid="operator-home-workspace-empty-state"
    >
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.section, "text-neutral-900 dark:text-neutral-100")}>
        {OPERATOR_HOME_WORKSPACE_EMPTY_TITLE}
      </p>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.meta, "text-neutral-600 dark:text-neutral-400")}>
        {OPERATOR_HOME_WORKSPACE_EMPTY_BODY}
      </p>
    </div>
  );
}
