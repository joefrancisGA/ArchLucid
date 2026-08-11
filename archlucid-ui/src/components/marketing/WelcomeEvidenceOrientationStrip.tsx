import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  WELCOME_CLAIM_DISCIPLINE,
  WELCOME_SOURCES,
  WELCOME_SOURCES_INTRO,
} from "@/lib/welcome-evidence-copy";

/** Evaluation Sources + claim discipline for `/welcome` (WXX Evidence). */
export function WelcomeEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="welcome"
      margin="mb-10"
      align="text-left"
      sourcesIntro={WELCOME_SOURCES_INTRO}
      sources={WELCOME_SOURCES}
      claimHeading="Marketing orientation only"
      claim={WELCOME_CLAIM_DISCIPLINE}
    />
  );
}
