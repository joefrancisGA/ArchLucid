import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  STANDARDS_RULES_FOLLOW_UPS_TITLE,
  STANDARDS_RULES_ORIENTATION_SOURCES,
  STANDARDS_RULES_ORIENTATION_SOURCES_INTRO,
} from "@/lib/standards-rules-evidence-copy";

/** Claim discipline + Sources index for the standards-and-rules hub (GRS). */
export function StandardsRulesClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="standards-rules-hub"
      sourcesTitle={STANDARDS_RULES_FOLLOW_UPS_TITLE}
      sourcesIntro={STANDARDS_RULES_ORIENTATION_SOURCES_INTRO}
      sources={STANDARDS_RULES_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
