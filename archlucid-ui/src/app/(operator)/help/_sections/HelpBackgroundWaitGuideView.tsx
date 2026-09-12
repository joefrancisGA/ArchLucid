import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE,
} from "@/lib/daytime-wait-help-background-wait-guide-content";
import { DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PATH } from "@/lib/daytime-wait-help-background-wait-route";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpBackgroundWaitGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** DW-015 — work continues in the background on Working. */
export function HelpBackgroundWaitGuideView(props: HelpBackgroundWaitGuideViewProps): React.ReactElement {
  const { entry } = props;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), "flex flex-col gap-6")}
      data-testid="help-background-wait-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE}
        titleTestId="help-background-wait-page-title"
        subtitle="Daytime wait on Working."
        navHref={DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <p className={cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody)} data-testid="help-background-wait-overview">
        {DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW}
      </p>

      <SponsorSendPathHonestyPanel testIdPrefix="help-background-wait" showSsoOptional={false} />
    </article>
  );
}
