import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_GRAPH_CLAIM_DISCIPLINE,
  EVIDENCE_GRAPH_CLAIM_DISCIPLINE_HEADING,
  EVIDENCE_GRAPH_FOLLOW_UPS_TITLE,
  EVIDENCE_GRAPH_SOURCES,
  EVIDENCE_GRAPH_SOURCES_INTRO,
} from "@/lib/evidence-graph-evidence-copy";

/** Claim discipline + Sources index for Evidence graph (GRA). */
export function EvidenceGraphClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="evidence-graph"
      claim={EVIDENCE_GRAPH_CLAIM_DISCIPLINE}
      claimHeading={EVIDENCE_GRAPH_CLAIM_DISCIPLINE_HEADING}
      sourcesTitle={EVIDENCE_GRAPH_FOLLOW_UPS_TITLE}
      sourcesIntro={EVIDENCE_GRAPH_SOURCES_INTRO}
      sources={EVIDENCE_GRAPH_SOURCES}
    />
  );
}
