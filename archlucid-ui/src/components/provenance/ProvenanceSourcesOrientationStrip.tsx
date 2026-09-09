"use client";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  buildProvenanceSources,
  PROVENANCE_FOLLOW_UPS_TITLE,
  PROVENANCE_ORIENTATION_SOURCES_INTRO,
} from "@/lib/provenance-evidence-copy";
import { PROVENANCE_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/provenance-page-copy";

export type ProvenanceSourcesOrientationStripProps = {
  readonly runId: string;
  readonly architectureId?: string | null;
};

/** Sources-only follow-ups for `/architecture/reviews/[reviewId]/provenance` buyer-polished shell (RRP). */
export function ProvenanceSourcesOrientationStrip(props: ProvenanceSourcesOrientationStripProps): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="provenance-settings"
      stripTestId={PROVENANCE_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="provenance-settings-sources"
      sourcesTitle={PROVENANCE_FOLLOW_UPS_TITLE}
      sourcesIntro={PROVENANCE_ORIENTATION_SOURCES_INTRO}
      sources={buildProvenanceSources(props.runId, props.architectureId, { workingMode: isWorkingMode })}
      hubSecondary
    />
  );
}
