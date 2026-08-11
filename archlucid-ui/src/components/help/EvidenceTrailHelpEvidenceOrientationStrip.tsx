import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE } from "@/lib/evidence-trail-help-evidence-copy";

/** Claim-discipline orientation for `/help/evidence-trail` — no diligence Sources list (TB-2092). */
export function EvidenceTrailHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimCallout
      testId="evidence-trail-help-claim-discipline"
      body={EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE}
    />
  );
}
