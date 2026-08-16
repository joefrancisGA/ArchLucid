import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PATTERN_LIBRARY_CLAIM_DISCIPLINE,
  PATTERN_LIBRARY_SOURCES,
  PATTERN_LIBRARY_SOURCES_INTRO,
} from "@/lib/pattern-library-evidence-copy";

/** Claim discipline + Sources index for the pattern library hub (INP). */
export function PatternLibraryClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="pattern-library"
      claim={PATTERN_LIBRARY_CLAIM_DISCIPLINE}
      claimHeading="Anonymized catalog only"
      sourcesIntro={PATTERN_LIBRARY_SOURCES_INTRO}
      sources={PATTERN_LIBRARY_SOURCES}
    />
  );
}
