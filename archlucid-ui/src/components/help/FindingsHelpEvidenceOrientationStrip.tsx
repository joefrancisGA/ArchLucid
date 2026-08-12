import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  FINDINGS_HELP_CLAIM_DISCIPLINE,
  FINDINGS_HELP_SOURCES,
  FINDINGS_HELP_SOURCES_INTRO,
} from "@/lib/findings/findings-help-evidence-copy";

/** Claim discipline + diligence artifact index for `/help/findings`. */
export function FindingsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="findings-help"
      claimTestId="help-findings-claim-discipline"
      claim={FINDINGS_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={FINDINGS_HELP_SOURCES_INTRO}
      sources={FINDINGS_HELP_SOURCES}
    />
  );
}
