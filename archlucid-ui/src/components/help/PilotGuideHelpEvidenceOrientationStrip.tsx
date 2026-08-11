import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { PILOT_GUIDE_HELP_CLAIM_DISCIPLINE } from "@/lib/pilot-guide-help-evidence-copy";

/** Claim-discipline orientation for `/help/pilot-guide` — no diligence Sources list (TB-2092). */
export function PilotGuideHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimCallout
      testId="pilot-guide-help-claim-discipline"
      body={PILOT_GUIDE_HELP_CLAIM_DISCIPLINE}
    />
  );
}
