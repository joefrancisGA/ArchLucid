import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_OVERVIEW,
  DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TITLE,
} from "@/lib/daytime-wait-help-proxy-timeout-guide-content";
import { DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PATH } from "@/lib/daytime-wait-help-proxy-timeout-route";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpProxyTimeoutRealExecuteGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** DW-007 — proxy timeout vs Career Real execute. */
export function HelpProxyTimeoutRealExecuteGuideView(
  props: HelpProxyTimeoutRealExecuteGuideViewProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), "flex flex-col gap-6")}
      data-testid="help-proxy-timeout-real-execute-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TITLE}
        titleTestId="help-proxy-timeout-real-execute-page-title"
        subtitle="Edge timeout vs async execute."
        navHref={DAYTIME_WAIT_HELP_PROXY_TIMEOUT_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <p
        className={cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}
        data-testid="help-proxy-timeout-real-execute-overview"
      >
        {DAYTIME_WAIT_HELP_PROXY_TIMEOUT_OVERVIEW}
      </p>

      <SponsorSendPathHonestyPanel testIdPrefix="help-proxy-timeout-real-execute" showSsoOptional={false} />
    </article>
  );
}
