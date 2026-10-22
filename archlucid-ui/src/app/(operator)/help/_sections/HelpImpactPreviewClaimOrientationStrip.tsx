import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  IMPACT_PREVIEW_HELP_FOLLOW_UPS_TITLE,
  IMPACT_PREVIEW_HELP_SOURCES,
  IMPACT_PREVIEW_HELP_SOURCES_INTRO,
} from "@/lib/impact-preview-help-evidence-copy";

/** Sources follow-ups for `/help/impact-preview` (HEM). */
export function HelpImpactPreviewClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-impact-preview"
      sourcesTestId="help-impact-preview-sources"
      sourcesTitle={IMPACT_PREVIEW_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={IMPACT_PREVIEW_HELP_SOURCES_INTRO}
      sources={IMPACT_PREVIEW_HELP_SOURCES}
    />
  );
}
