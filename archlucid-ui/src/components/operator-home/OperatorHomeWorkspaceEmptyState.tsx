import {
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** First-run workspace with no review packages — single empty copy, CTAs live in the hero above. */
export function OperatorHomeWorkspaceEmptyState() {
  return (
    <div
      className={cn(OPERATOR_LAYOUT.sectionStack, OPERATOR_CARD.nested, OPERATOR_SURFACE_CARD_CLASS)}
      data-testid="operator-home-workspace-empty-state"
    >
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-100")}>
        {OPERATOR_HOME_WORKSPACE_EMPTY_TITLE}
      </p>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
        {OPERATOR_HOME_WORKSPACE_EMPTY_BODY}
      </p>
    </div>
  );
}
