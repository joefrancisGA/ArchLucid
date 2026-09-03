import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ACCESSIBILITY_FOLLOW_UPS_TITLE,
  ACCESSIBILITY_SOURCES,
  ACCESSIBILITY_SOURCES_INTRO,
} from "@/lib/accessibility-evidence-copy";

/** Sources follow-ups for `/accessibility` (AXX). */
export function AccessibilityMarketingClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="accessibility"
      sourcesTestId="accessibility-sources"
      sourcesTitle={ACCESSIBILITY_FOLLOW_UPS_TITLE}
      sourcesIntro={ACCESSIBILITY_SOURCES_INTRO}
      sources={ACCESSIBILITY_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
    />
  );
}
