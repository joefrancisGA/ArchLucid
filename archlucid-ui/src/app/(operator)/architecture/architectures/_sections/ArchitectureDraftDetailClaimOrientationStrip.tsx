import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { ARCHITECTURE_DRAFT_DETAIL_CLAIM_HEADING } from "@/lib/architecture/architecture-draft-detail-page-copy";
import {
  ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE,
  ARCHITECTURES_DRAFT_FOLLOW_UPS_TITLE,
  ARCHITECTURES_DRAFT_SOURCES,
  ARCHITECTURES_DRAFT_SOURCES_INTRO,
} from "@/lib/architectures-draft-evidence-copy";

/** Claim discipline + Sources index for a saved architecture draft detail (ARR). */
export function ArchitectureDraftDetailClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-draft-detail"
      claim={ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURE_DRAFT_DETAIL_CLAIM_HEADING}
      sourcesIntro={ARCHITECTURES_DRAFT_SOURCES_INTRO}
      sources={ARCHITECTURES_DRAFT_SOURCES}
    />
  );
}
