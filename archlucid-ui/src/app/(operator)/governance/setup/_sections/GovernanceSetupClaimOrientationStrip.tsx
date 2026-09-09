import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_SETUP_FOLLOW_UPS_TITLE,
  GOVERNANCE_SETUP_ORIENTATION_SOURCES,
  GOVERNANCE_SETUP_SOURCES_INTRO,
} from "@/lib/governance/governance-setup-evidence-copy";

/** Sources index for the approval setup guide (GFX). */
export function GovernanceSetupClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-setup"
      sourcesTitle={GOVERNANCE_SETUP_FOLLOW_UPS_TITLE}
      sourcesIntro={GOVERNANCE_SETUP_SOURCES_INTRO}
      sources={GOVERNANCE_SETUP_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
