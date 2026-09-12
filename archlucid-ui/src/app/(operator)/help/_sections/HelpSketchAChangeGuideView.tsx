import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PATH } from "@/lib/cheap-exploration-help-sketch-a-change-route";
import {
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_OVERVIEW,
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TITLE,
} from "@/lib/cheap-exploration-help-sketch-a-change-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpSketchAChangeGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** CE-019 — how to sketch a labeled change on the architecture desk. */
export function HelpSketchAChangeGuideView(props: HelpSketchAChangeGuideViewProps): React.ReactElement {
  const { entry } = props;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), "flex flex-col gap-6")}
      data-testid="help-sketch-a-change-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TITLE}
        titleTestId="help-sketch-a-change-page-title"
        subtitle="Cheap labeled envelope on Working."
        navHref={CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <p className={cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody)} data-testid="help-sketch-a-change-overview">
        {CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_OVERVIEW}
      </p>
    </article>
  );
}
