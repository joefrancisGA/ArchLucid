import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import { EVIDENCE_CLAIM_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  SIGNUP_CLAIM_DISCIPLINE,
  SIGNUP_CLAIM_DISCIPLINE_HEADING,
  SIGNUP_SOURCES,
  SIGNUP_SOURCES_HEADING,
  SIGNUP_SOURCES_INTRO,
} from "@/lib/signup-evidence-copy";

/** Evaluation Sources + claim discipline for `/signup` (SIG Evidence). */
export function SignupEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="signup"
      margin="mt-8"
      align="text-left"
      sourcesTitle={SIGNUP_SOURCES_HEADING}
      sourcesIntro={SIGNUP_SOURCES_INTRO}
      sources={SIGNUP_SOURCES}
      claimHeading={SIGNUP_CLAIM_DISCIPLINE_HEADING}
      claim={SIGNUP_CLAIM_DISCIPLINE}
      claimStyle={EVIDENCE_CLAIM_STYLE.evaluationNeutral}
    />
  );
}
