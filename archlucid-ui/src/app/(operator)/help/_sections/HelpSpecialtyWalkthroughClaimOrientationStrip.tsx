import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { HUB_SECONDARY_SOURCES_LAYOUT } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import {
  SPECIALTY_WALKTHROUGHS_HELP_FOLLOW_UPS_TITLE,
  SPECIALTY_WALKTHROUGHS_HELP_SOURCES,
  SPECIALTY_WALKTHROUGHS_HELP_SOURCES_INTRO,
} from "@/lib/specialty-walkthroughs-help-evidence-copy";

/** Sources-only follow-ups for `/help/specialty-walkthroughs` buyer-polished shell (HS). */
export function HelpSpecialtyWalkthroughClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="help-specialty-walkthroughs-orientation">
      <EvidenceOrientationSourcesSection
        testId="help-specialty-walkthroughs-sources"
        headingId="where-to-go-next"
        title={SPECIALTY_WALKTHROUGHS_HELP_FOLLOW_UPS_TITLE}
        intro={SPECIALTY_WALKTHROUGHS_HELP_SOURCES_INTRO}
        links={SPECIALTY_WALKTHROUGHS_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout={HUB_SECONDARY_SOURCES_LAYOUT}
        distinguishFollowUpDestinations
      />
    </EvidenceOrientationStripShell>
  );
}
