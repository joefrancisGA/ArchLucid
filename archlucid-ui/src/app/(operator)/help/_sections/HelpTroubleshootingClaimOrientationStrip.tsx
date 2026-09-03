import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE,
  TROUBLESHOOTING_HELP_SOURCES,
  TROUBLESHOOTING_HELP_SOURCES_INTRO,
} from "@/lib/troubleshooting-help-evidence-copy";

/** Sources follow-ups for `/help/troubleshooting` (HTX). */
export function HelpTroubleshootingClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-troubleshooting"
      sourcesTestId="help-troubleshooting-sources"
      sourcesTitle={TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={TROUBLESHOOTING_HELP_SOURCES_INTRO}
      sources={TROUBLESHOOTING_HELP_SOURCES}
    />
  );
}
