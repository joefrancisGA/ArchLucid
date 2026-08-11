import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  PRIVACY_CLAIM_DISCIPLINE,
  PRIVACY_SOURCES,
  PRIVACY_SOURCES_INTRO,
} from "@/lib/privacy-evidence-copy";

/** Evaluation Sources + claim discipline for `/privacy` (PRB Evidence). */
export function PrivacyEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="privacy"
      margin="mt-6"
      align="text-left"
      sourcesIntro={PRIVACY_SOURCES_INTRO}
      sources={PRIVACY_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
      claimHeading="Legal notice only"
      claim={PRIVACY_CLAIM_DISCIPLINE}
      claimElement="div"
    />
  );
}
