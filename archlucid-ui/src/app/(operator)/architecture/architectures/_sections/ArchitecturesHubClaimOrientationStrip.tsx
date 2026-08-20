import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { ARCHITECTURES_HUB_CLAIM_HEADING } from "@/lib/architectures-hub-copy";
import {
  ARCHITECTURES_LIST_CLAIM_DISCIPLINE,
  ARCHITECTURES_LIST_FOLLOW_UPS_TITLE,
  ARCHITECTURES_LIST_SOURCES,
  ARCHITECTURES_LIST_SOURCES_INTRO,
} from "@/lib/architectures-list-evidence-copy";

/** Claim discipline + Sources index for the architecture drafts hub (ARA). */
export function ArchitecturesHubClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architectures-hub"
      claim={ARCHITECTURES_LIST_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURES_HUB_CLAIM_HEADING}
      sourcesTitle={ARCHITECTURES_LIST_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURES_LIST_SOURCES_INTRO}
      sources={ARCHITECTURES_LIST_SOURCES}
      hubSecondary
    />
  );
}
