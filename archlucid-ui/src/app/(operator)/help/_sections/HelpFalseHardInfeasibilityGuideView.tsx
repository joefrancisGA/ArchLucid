import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_OVERVIEW,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_TITLE,
} from "@/lib/livelihood-grade-no-help-false-hard-guide-content";
import { LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PATH } from "@/lib/livelihood-grade-no-help-route";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpFalseHardInfeasibilityGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** LN-024 — Working help for hard vs soft infeasibility on Career export. */
export function HelpFalseHardInfeasibilityGuideView(
  props: HelpFalseHardInfeasibilityGuideViewProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-false-hard-infeasibility-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_TITLE}
        titleTestId="help-false-hard-infeasibility-page-title"
        subtitle="Working Career export honesty — cite law before hard infeasible."
        navHref={LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <p
        className={cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}
        data-testid="help-false-hard-infeasibility-overview"
      >
        {LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_OVERVIEW}
      </p>
    </article>
  );
}
