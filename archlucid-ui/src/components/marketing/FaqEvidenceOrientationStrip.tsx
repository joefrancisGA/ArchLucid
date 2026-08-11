import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { FAQ_CLAIM_DISCIPLINE, FAQ_SOURCES, FAQ_SOURCES_INTRO } from "@/lib/faq-evidence-copy";

/** Evaluation Sources + claim discipline for `/faq` (FXX Evidence). */
export function FaqEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="faq"
      margin="mt-8"
      align="text-left"
      sourcesIntro={FAQ_SOURCES_INTRO}
      sources={FAQ_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.evaluationMutedAccentLink}
      claimHeading="Evaluation orientation only"
      claim={FAQ_CLAIM_DISCIPLINE}
    />
  );
}
