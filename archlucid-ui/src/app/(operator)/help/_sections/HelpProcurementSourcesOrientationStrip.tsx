import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PROCUREMENT_HELP_FOLLOW_UPS_TITLE,
  PROCUREMENT_HELP_ORIENTATION_SOURCES_INTRO,
  PROCUREMENT_HELP_SOURCES,
} from "@/lib/procurement-help-evidence-copy";
import { PROCUREMENT_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/procurement-help-page-copy";

/** Sources-only follow-ups for `/help/procurement` buyer-polished shell (PRO). */
export function HelpProcurementSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-procurement"
      stripTestId={PROCUREMENT_HELP_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="procurement-help-sources"
      sourcesTitle={PROCUREMENT_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PROCUREMENT_HELP_ORIENTATION_SOURCES_INTRO}
      sources={PROCUREMENT_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
