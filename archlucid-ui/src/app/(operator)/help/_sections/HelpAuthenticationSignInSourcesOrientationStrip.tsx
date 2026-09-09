import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE,
  AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_SOURCES_INTRO,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES,
} from "@/lib/authentication-sign-in-help-evidence-copy";
import { AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/authentication-sign-in-help-page-copy";

/** Sources-only follow-ups for `/help/authentication-sign-in` buyer-polished shell (HEA). */
export function HelpAuthenticationSignInSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="authentication-sign-in-help"
      stripTestId={AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="authentication-sign-in-help-sources"
      sourcesTitle={AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_SOURCES_INTRO}
      sources={AUTHENTICATION_SIGN_IN_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
