import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE,
  SYSTEM_HEALTH_HELP_ORIENTATION_SOURCES_INTRO,
  SYSTEM_HEALTH_HELP_SOURCES,
} from "@/lib/system-health-help-evidence-copy";
import { SYSTEM_HEALTH_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/system-health-help-page-copy";

/** Sources-only follow-ups for `/help/system-health` buyer-polished shell (HEY). */
export function HelpSystemHealthSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-system-health"
      stripTestId={SYSTEM_HEALTH_HELP_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="help-system-health-sources"
      sourcesTitle={SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SYSTEM_HEALTH_HELP_ORIENTATION_SOURCES_INTRO}
      sources={SYSTEM_HEALTH_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
