import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PATTERN_LIBRARY_DETAIL_SOURCES,
  PATTERN_LIBRARY_DETAIL_SOURCES_INTRO,
} from "@/lib/pattern-library-detail-evidence-copy";

/** Claim discipline + Sources index for pattern library detail (INA). */
export function PatternLibraryDetailClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="pattern-library-detail"
      sourcesIntro={PATTERN_LIBRARY_DETAIL_SOURCES_INTRO}
      sources={PATTERN_LIBRARY_DETAIL_SOURCES}
    />
  );
}
