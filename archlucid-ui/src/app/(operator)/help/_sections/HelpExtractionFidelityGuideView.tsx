import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_OVERVIEW,
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_TITLE,
} from "@/lib/livelihood-grade-no-help-extraction-fidelity-guide-content";
import { LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PATH } from "@/lib/livelihood-grade-no-help-route";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpExtractionFidelityGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** LN-034 — Working help for extraction fidelity and NotVerifiable diagram honesty. */
export function HelpExtractionFidelityGuideView(
  props: HelpExtractionFidelityGuideViewProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-extraction-fidelity-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_TITLE}
        titleTestId="help-extraction-fidelity-page-title"
        subtitle="Evidence-backed findings must point at stored sources."
        navHref={LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <p
        className={cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}
        data-testid="help-extraction-fidelity-overview"
      >
        {LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_OVERVIEW}
      </p>
    </article>
  );
}
