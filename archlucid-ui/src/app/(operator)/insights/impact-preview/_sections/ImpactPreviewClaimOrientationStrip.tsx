import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  IMPACT_PREVIEW_SOURCES,
  IMPACT_PREVIEW_SOURCES_INTRO,
} from "@/lib/impact-preview-evidence-copy";

/** Claim discipline + Sources index for impact preview (INI). */
export function ImpactPreviewClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="impact-preview"
      sourcesIntro={IMPACT_PREVIEW_SOURCES_INTRO}
      sources={IMPACT_PREVIEW_SOURCES}
    />
  );
}
