import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES_INTRO,
} from "@/lib/authentication-sign-in-help-evidence-copy";

/** Claim discipline + diligence artifact index for `/help/authentication-sign-in`. */
export function AuthenticationSignInHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="authentication-sign-in-help"
      claim={AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={AUTHENTICATION_SIGN_IN_HELP_SOURCES_INTRO}
      sources={AUTHENTICATION_SIGN_IN_HELP_SOURCES}
    />
  );
}
