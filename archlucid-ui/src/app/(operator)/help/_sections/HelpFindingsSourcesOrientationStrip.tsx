import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  FINDINGS_HELP_FOLLOW_UPS_TITLE,
  FINDINGS_HELP_SOURCES,
  FINDINGS_HELP_SOURCES_INTRO,
} from "@/lib/findings/findings-help-evidence-copy";

/** Sources-only follow-ups for `/help/findings` buyer-polished shell (HFX). */
export function HelpFindingsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="findings-help"
      sourcesTestId="help-findings-sources"
      sourcesTitle={FINDINGS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={FINDINGS_HELP_SOURCES_INTRO}
      sources={FINDINGS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
