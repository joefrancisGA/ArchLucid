import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PILOT_GUIDE_HELP_FOLLOW_UPS_TITLE,
  PILOT_GUIDE_HELP_SOURCES,
  PILOT_GUIDE_HELP_SOURCES_INTRO,
} from "@/lib/pilot-guide-help-evidence-copy";

/** Sources follow-ups for `/help/pilot-guide` (HP). */
export function HelpPilotGuideClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-pilot-guide"
      sourcesTestId="help-pilot-guide-sources"
      sourcesTitle={PILOT_GUIDE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PILOT_GUIDE_HELP_SOURCES_INTRO}
      sources={PILOT_GUIDE_HELP_SOURCES}
    />
  );
}
