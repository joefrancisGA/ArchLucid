import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { SponsorSendPathHonestyPanel } from "@/components/help/SponsorSendPathHonestyPanel";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TITLE,
} from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";
import { EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PATH } from "@/lib/evidence-source-inspect-help-stored-evidence-route";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpInspectStoredEvidenceGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** ESI-08 — inspect stored evidence on the review Evidence tab. */
export function HelpInspectStoredEvidenceGuideView(
  props: HelpInspectStoredEvidenceGuideViewProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), "flex flex-col gap-6")}
      data-testid="help-inspect-stored-evidence-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TITLE}
        titleTestId="help-inspect-stored-evidence-page-title"
        subtitle="Preview first, download second."
        navHref={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <p
        className={cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody)}
        data-testid="help-inspect-stored-evidence-overview"
      >
        {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_OVERVIEW}
      </p>

      <SponsorSendPathHonestyPanel testIdPrefix="help-inspect-stored-evidence" showSsoOptional={false} />
    </article>
  );
}
