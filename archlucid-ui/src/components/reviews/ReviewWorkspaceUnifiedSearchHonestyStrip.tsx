import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_WORKSPACE_UNIFIED_SEARCH_HELPER,
  REVIEW_WORKSPACE_UNIFIED_SEARCH_LEAD,
} from "@/lib/reviews/review-workspace-unified-search-honesty-copy";
import { cn } from "@/lib/utils";

export function ReviewWorkspaceUnifiedSearchHonestyStrip(): React.JSX.Element {
  return (
    <aside
      className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800"
      data-testid="review-workspace-unified-search-honesty"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>{REVIEW_WORKSPACE_UNIFIED_SEARCH_LEAD}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
        {REVIEW_WORKSPACE_UNIFIED_SEARCH_HELPER}
      </p>
    </aside>
  );
}
