import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  CLI_USAGE_HELP_FOLLOW_UPS_TITLE,
  CLI_USAGE_HELP_SOURCES,
  CLI_USAGE_HELP_SOURCES_INTRO,
} from "@/lib/cli-usage-help-evidence-copy";

/** Sources follow-ups for `/help/cli-usage` (HCX). */
export function HelpCliUsageClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-cli-usage"
      sourcesTestId="help-cli-usage-sources"
      sourcesTitle={CLI_USAGE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={CLI_USAGE_HELP_SOURCES_INTRO}
      sources={CLI_USAGE_HELP_SOURCES}
    />
  );
}
