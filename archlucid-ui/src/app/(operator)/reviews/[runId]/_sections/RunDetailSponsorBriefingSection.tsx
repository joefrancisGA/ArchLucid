import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EmailRunToSponsorBanner } from "@/components/EmailRunToSponsorBanner";

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
      <CollapsibleSection title="Sponsor briefing package" defaultOpen={false}>
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
