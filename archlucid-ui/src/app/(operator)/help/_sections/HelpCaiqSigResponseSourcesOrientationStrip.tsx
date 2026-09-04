import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  CAIQ_SIG_RESPONSE_HELP_FOLLOW_UPS_TITLE,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
  CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO,
} from "@/lib/caiq-sig-response-help-evidence-copy";

/** Sources-only follow-ups for `/help/caiq-sig-response` buyer-polished shell (ECA). */
export function HelpCaiqSigResponseSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="caiq-sig-response-help"
      sourcesTestId="help-caiq-sig-response-sources"
      sourcesTitle={CAIQ_SIG_RESPONSE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO}
      sources={CAIQ_SIG_RESPONSE_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
