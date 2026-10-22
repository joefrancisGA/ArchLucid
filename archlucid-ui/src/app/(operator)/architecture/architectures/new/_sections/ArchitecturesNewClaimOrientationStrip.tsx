import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ARCHITECTURES_NEW_SOURCES,
  ARCHITECTURES_NEW_SOURCES_INTRO,
} from "@/lib/architectures-new-evidence-copy";

/** Sources index for architecture create-bootstrap (ANE) — scope lives in the page subtitle. */
export function ArchitecturesNewClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architectures-new"
      sourcesIntro={ARCHITECTURES_NEW_SOURCES_INTRO}
      sources={ARCHITECTURES_NEW_SOURCES}
    />
  );
}
