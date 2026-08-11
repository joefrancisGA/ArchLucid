import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  SIGNUP_VERIFY_CLAIM_DISCIPLINE,
  SIGNUP_VERIFY_SOURCES,
  SIGNUP_VERIFY_SOURCES_INTRO,
} from "@/lib/signup-verify-evidence-copy";

/** Evaluation Sources + claim discipline for `/signup/verify` (SVX Evidence). */
export function SignupVerifyEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="signup-verify"
      margin="mt-8"
      align="text-left"
      sourcesIntro={SIGNUP_VERIFY_SOURCES_INTRO}
      sources={SIGNUP_VERIFY_SOURCES}
      claimHeading="Evaluation access only"
      claim={SIGNUP_VERIFY_CLAIM_DISCIPLINE}
    />
  );
}
