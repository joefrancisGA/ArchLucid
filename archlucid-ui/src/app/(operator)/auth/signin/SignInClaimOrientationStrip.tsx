import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_SOURCES_STYLE,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  AUTH_SIGNIN_CLAIM_DISCIPLINE,
  AUTH_SIGNIN_FOLLOW_UPS_TITLE,
  AUTH_SIGNIN_SOURCES_INTRO,
  authSignInSourcesForProductLine,
} from "@/lib/auth-signin-evidence-copy";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";

/** Claim discipline + Sources index for `/auth/signin` (ASI). */
export function SignInClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useLocalizedProductCopy();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="auth-signin"
      claim={AUTH_SIGNIN_CLAIM_DISCIPLINE}
      sourcesTitle={AUTH_SIGNIN_FOLLOW_UPS_TITLE}
      sourcesIntro={AUTH_SIGNIN_SOURCES_INTRO}
      sources={authSignInSourcesForProductLine(productLine)}
      sourcesLayout="stacked"
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorNeutral}
    />
  );
}
