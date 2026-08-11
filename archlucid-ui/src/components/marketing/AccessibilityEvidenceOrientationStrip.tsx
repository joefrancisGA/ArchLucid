import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ACCESSIBILITY_CLAIM_DISCIPLINE,
  ACCESSIBILITY_SOURCES,
  ACCESSIBILITY_SOURCES_INTRO,
} from "@/lib/accessibility-evidence-copy";

/** Evaluation Sources + claim discipline for `/accessibility` (AXX Evidence). */
export function AccessibilityEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="accessibility"
      align="text-left"
      sourcesIntro={ACCESSIBILITY_SOURCES_INTRO}
      sources={ACCESSIBILITY_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
      claimHeading="Public accessibility statement only"
      claim={ACCESSIBILITY_CLAIM_DISCIPLINE}
    />
  );
}
