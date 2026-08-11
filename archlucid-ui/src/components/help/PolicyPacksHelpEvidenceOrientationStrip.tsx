import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  POLICY_PACKS_HELP_CLAIM_DISCIPLINE,
  POLICY_PACKS_HELP_SOURCES,
  POLICY_PACKS_HELP_SOURCES_INTRO,
} from "@/lib/policy-packs-help-evidence-copy";

/** Claim discipline + governance follow-up index for `/help/policy-packs`. */
export function PolicyPacksHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="policy-packs-help"
      claim={POLICY_PACKS_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={POLICY_PACKS_HELP_SOURCES_INTRO}
      sources={POLICY_PACKS_HELP_SOURCES}
    />
  );
}
