import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  GOVERNANCE_FINDINGS_FOLLOW_UPS_TITLE,
  GOVERNANCE_FINDINGS_SOURCES_INTRO,
  buildGovernanceFindingsOrientationSources,
} from "@/lib/governance/governance-findings-evidence-copy";

/** Claim discipline + Sources index for the policy findings queue (GFN). */
export function GovernanceFindingsClaimOrientationStrip(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-findings"
      sourcesTitle={GOVERNANCE_FINDINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={GOVERNANCE_FINDINGS_SOURCES_INTRO}
      sources={buildGovernanceFindingsOrientationSources(isWorkingMode)}
      hubSecondary
    />
  );
}
