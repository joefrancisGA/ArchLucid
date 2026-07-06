import { cn } from "@/lib/utils";

import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { EXPLORE_ARCHLUCID_ROW_CLASS } from "@/components/operator-home/explore-archlucid-row-class";
import {
  OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_CTA,
  OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_HEADING,
  OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_LEAD,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Buyer-facing review flow walkthrough row inside Explore ArchLucid. */
export function ExploreArchLucidWalkthroughRow(): React.JSX.Element {
  return (
    <section
      aria-label={OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_HEADING}
      data-testid="explore-archlucid-walkthrough-row"
      className={EXPLORE_ARCHLUCID_ROW_CLASS}
    >
      <h3 id="explore-archlucid-walkthrough-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_HEADING}
      </h3>
      <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_LEAD}
      </p>
      <OperatorHomeGuidanceLink
        helpSlug="core-pilot"
        label={OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_CTA}
        className="mt-3 inline-block"
      />
    </section>
  );
}
