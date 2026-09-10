import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  EVIDENCE_GRAPH_FOLLOW_UPS_TITLE,
  EVIDENCE_GRAPH_SOURCES_INTRO,
  buildEvidenceGraphSources,
} from "@/lib/evidence-graph-evidence-copy";

/** Claim discipline + Sources index for Evidence graph (GRA). */
export function EvidenceGraphClaimOrientationStrip(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="evidence-graph"
      sourcesTitle={EVIDENCE_GRAPH_FOLLOW_UPS_TITLE}
      sourcesIntro={EVIDENCE_GRAPH_SOURCES_INTRO}
      sources={buildEvidenceGraphSources(isWorkingMode)}
      hubSecondary
    />
  );
}
