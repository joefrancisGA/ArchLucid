import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ARCHITECTURES_DRAFT_FOLLOW_UPS_TITLE,
  ARCHITECTURES_DRAFT_SOURCES,
  ARCHITECTURES_DRAFT_SOURCES_INTRO,
} from "@/lib/architectures-draft-evidence-copy";

/** Sources index for a saved architecture draft detail (ARR) — scope lives in the page subtitle. */
export function ArchitectureDraftDetailClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-draft-detail"
      sourcesIntro={ARCHITECTURES_DRAFT_SOURCES_INTRO}
      sourcesTitle={ARCHITECTURES_DRAFT_FOLLOW_UPS_TITLE}
      sources={ARCHITECTURES_DRAFT_SOURCES}
    />
  );
}
