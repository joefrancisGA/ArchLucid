import { cn } from "@/lib/utils";

import { OperatorHomeNavigateLoadingButton } from "@/components/operator-home/OperatorHomeNavigateLoadingButton";
import {
  OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_CTA,
  OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_LEAD,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { OPERATOR_HOME_OPENING_WORKFLOW_LABEL } from "@/lib/review-start-progress-copy";

/** Buyer-facing review flow walkthrough row inside Explore ArchLucid. */
export function ExploreArchLucidWalkthroughRow(): React.JSX.Element {
  return (
    <div className="space-y-2" data-testid="explore-archlucid-walkthrough-row">
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_LEAD}
      </p>
      <OperatorHomeNavigateLoadingButton
        variant="outline"
        size="sm"
        className="h-8 w-fit border-0 px-0 font-medium text-teal-800 underline underline-offset-2 shadow-none dark:text-teal-300"
        href={inAppHelpHref("core-pilot")}
        idleLabel={OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_CTA}
        loadingLabel={OPERATOR_HOME_OPENING_WORKFLOW_LABEL}
        data-testid="explore-archlucid-view-workflow"
      />
    </div>
  );
}
