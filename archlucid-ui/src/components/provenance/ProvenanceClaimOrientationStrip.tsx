"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  buildProvenanceSources,
  PROVENANCE_FOLLOW_UPS_TITLE,
  PROVENANCE_SOURCES_INTRO,
} from "@/lib/provenance-evidence-copy";

export type ProvenanceClaimOrientationStripProps = {
  readonly runId: string;
  readonly architectureId?: string | null;
};

/** Sources follow-ups for `/architecture/reviews/[reviewId]/provenance` (RRP). */
export function ProvenanceClaimOrientationStrip(props: ProvenanceClaimOrientationStripProps): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="provenance-settings"
      sourcesTestId="provenance-settings-sources"
      sourcesTitle={PROVENANCE_FOLLOW_UPS_TITLE}
      sourcesIntro={PROVENANCE_SOURCES_INTRO}
      sources={buildProvenanceSources(props.runId, props.architectureId, { workingMode: isWorkingMode })}
      hubSecondary
    />
  );
}
