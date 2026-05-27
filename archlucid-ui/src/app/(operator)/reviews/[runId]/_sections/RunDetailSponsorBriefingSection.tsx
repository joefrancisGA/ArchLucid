import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EmailRunToSponsorBanner } from "@/components/EmailRunToSponsorBanner";
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

  if (buyerPolishedArtifactTable) {
    return (
      <CollapsibleSection title={BUYER_EXECUTIVE_BRIEFING_PACKAGE_LABEL} defaultOpen={false}>
        <EmailRunToSponsorBanner
          runId={runId}
          manifestId={manifestId}
          curatedSampleRun={curatedSampleRun}
          sponsorDocxAvailable={sponsorDocxAvailable}
        />
      </CollapsibleSection>
    );
  }

  return (
    <EmailRunToSponsorBanner
      runId={runId}
      manifestId={manifestId}
      curatedSampleRun={curatedSampleRun}
      sponsorDocxAvailable={sponsorDocxAvailable}
    />
  );
}
