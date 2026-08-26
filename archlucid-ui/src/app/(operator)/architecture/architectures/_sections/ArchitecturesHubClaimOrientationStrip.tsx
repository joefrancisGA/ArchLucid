import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";

import {
  ARCHITECTURES_LIST_FOLLOW_UPS_TITLE,
  ARCHITECTURES_LIST_SOURCES,
  ARCHITECTURES_LIST_SOURCES_INTRO,
} from "@/lib/architectures-list-evidence-copy";

/** Claim discipline + Sources index for the architecture drafts hub (ARA). */
export function ArchitecturesHubClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architectures-hub"
      sourcesTitle={ARCHITECTURES_LIST_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURES_LIST_SOURCES_INTRO}
      sources={ARCHITECTURES_LIST_SOURCES}
      hubSecondary
    />
  );
}
