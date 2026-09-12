import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-route";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpImpactPreviewVsArchitectureEnvelopeGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** CE-020 — impact preview vs architecture sketch envelope. */
export function HelpImpactPreviewVsArchitectureEnvelopeGuideView(
  props: HelpImpactPreviewVsArchitectureEnvelopeGuideViewProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), "flex flex-col gap-6")}
      data-testid="help-impact-preview-vs-envelope-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE}
        titleTestId="help-impact-preview-vs-envelope-page-title"
        subtitle="Policy preview vs architecture sketch."
        navHref={CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <p
        className={cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}
        data-testid="help-impact-preview-vs-envelope-overview"
      >
        {CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW}
      </p>
    </article>
  );
}
