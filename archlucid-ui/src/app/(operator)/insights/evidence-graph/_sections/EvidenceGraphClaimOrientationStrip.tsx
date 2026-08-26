import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_GRAPH_FOLLOW_UPS_TITLE,
  EVIDENCE_GRAPH_SOURCES,
  EVIDENCE_GRAPH_SOURCES_INTRO,
} from "@/lib/evidence-graph-evidence-copy";

/** Claim discipline + Sources index for Evidence graph (GRA). */
export function EvidenceGraphClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="evidence-graph"
      sourcesTitle={EVIDENCE_GRAPH_FOLLOW_UPS_TITLE}
      sourcesIntro={EVIDENCE_GRAPH_SOURCES_INTRO}
      sources={EVIDENCE_GRAPH_SOURCES}
      hubSecondary
    />
  );
}
