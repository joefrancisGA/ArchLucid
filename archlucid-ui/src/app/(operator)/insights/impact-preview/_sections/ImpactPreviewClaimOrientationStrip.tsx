import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  IMPACT_PREVIEW_CLAIM_DISCIPLINE,
  IMPACT_PREVIEW_CLAIM_DISCIPLINE_HEADING,
  IMPACT_PREVIEW_SOURCES,
  IMPACT_PREVIEW_SOURCES_INTRO,
} from "@/lib/impact-preview-evidence-copy";

/** Claim discipline + Sources index for impact preview (INI). */
export function ImpactPreviewClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="impact-preview"
      claim={IMPACT_PREVIEW_CLAIM_DISCIPLINE}
      claimHeading={IMPACT_PREVIEW_CLAIM_DISCIPLINE_HEADING}
      sourcesIntro={IMPACT_PREVIEW_SOURCES_INTRO}
      sources={IMPACT_PREVIEW_SOURCES}
    />
  );
}
