import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_HELP_ORIENTATION_SOURCES_INTRO,
  BASELINE_SETTINGS_HELP_SOURCES,
} from "@/lib/baseline-settings-help-evidence-copy";
import { BASELINE_SETTINGS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/baseline-settings-help-page-copy";

/** Sources-only follow-ups for `/help/baseline-settings` buyer-polished shell (HEB). */
export function HelpBaselineSettingsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-baseline-settings"
      stripTestId={BASELINE_SETTINGS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="help-baseline-settings-sources"
      sourcesTitle={BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={BASELINE_SETTINGS_HELP_ORIENTATION_SOURCES_INTRO}
      sources={BASELINE_SETTINGS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
