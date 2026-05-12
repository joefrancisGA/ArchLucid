import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EmailRunToSponsorBanner } from "@/components/EmailRunToSponsorBanner";

type RunDetailSponsorBriefingSectionProps = {
  readonly runId: string;
  readonly manifestId: string;
  readonly curatedSampleRun: boolean;
  readonly buyerPolishedArtifactTable: boolean;
};

export function RunDetailSponsorBriefingSection(props: RunDetailSponsorBriefingSectionProps): ReactElement {
  const { runId, manifestId, curatedSampleRun, buyerPolishedArtifactTable } = props;

  if (buyerPolishedArtifactTable) {
    return (
      <CollapsibleSection title="Sponsor briefing package" defaultOpen={false}>
        <EmailRunToSponsorBanner runId={runId} manifestId={manifestId} curatedSampleRun={curatedSampleRun} />
      </CollapsibleSection>
    );
  }

  return <EmailRunToSponsorBanner runId={runId} manifestId={manifestId} curatedSampleRun={curatedSampleRun} />;
}
