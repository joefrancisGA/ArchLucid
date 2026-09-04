import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_SOURCES_STYLE,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  AUTH_SIGNIN_CLAIM_DISCIPLINE,
  AUTH_SIGNIN_FOLLOW_UPS_TITLE,
  AUTH_SIGNIN_SOURCES,
  AUTH_SIGNIN_SOURCES_INTRO,
} from "@/lib/auth-signin-evidence-copy";

/** Claim discipline + Sources index for `/auth/signin` (ASI). */
export function SignInClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="auth-signin"
      claim={AUTH_SIGNIN_CLAIM_DISCIPLINE}
      sourcesTitle={AUTH_SIGNIN_FOLLOW_UPS_TITLE}
      sourcesIntro={AUTH_SIGNIN_SOURCES_INTRO}
      sources={AUTH_SIGNIN_SOURCES}
      sourcesLayout="stacked"
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorNeutral}
    />
  );
}
