import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EmailRunToSponsorBanner } from "@/components/EmailRunToSponsorBanner";
import { RunDetailAiReadinessGateCard } from "@/components/RunDetailAiReadinessGateCard";
import { BUYER_EXECUTIVE_BRIEFING_PACKAGE_LABEL } from "@/lib/buyer-polish-copy";

type RunDetailSponsorBriefingSectionProps = {
  readonly runId: string;
  readonly manifestId: string;
  readonly curatedSampleRun: boolean;
  readonly buyerPolishedArtifactTable: boolean;
  readonly sponsorDocxAvailable: boolean;
};

export function RunDetailSponsorBriefingSection(props: RunDetailSponsorBriefingSectionProps): ReactElement {
  const { runId, manifestId, curatedSampleRun, buyerPolishedArtifactTable, sponsorDocxAvailable } = props;

  const deliverables = (
    <>
      <RunDetailAiReadinessGateCard runId={runId} manifestId={manifestId} />
      <EmailRunToSponsorBanner
        runId={runId}
        manifestId={manifestId}
        curatedSampleRun={curatedSampleRun}
        sponsorDocxAvailable={sponsorDocxAvailable}
      />
    </>
  );

  if (buyerPolishedArtifactTable) {
    return (
      <CollapsibleSection title={BUYER_EXECUTIVE_BRIEFING_PACKAGE_LABEL} defaultOpen={false}>
        <div id="sponsor-deliverables" className="scroll-mt-24">
          {deliverables}
        </div>
      </CollapsibleSection>
    );
  }

  return <div id="sponsor-deliverables" className="scroll-mt-24">{deliverables}</div>;
}
