import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { SCOPE_HELP_CLAIM_DISCIPLINE } from "@/lib/scope-help-evidence-copy";

/** Claim-discipline orientation for `/help/scope` — no diligence Sources list (TB-2092). */
export function ScopeHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimCallout
      testId="scope-help-claim-discipline"
      body={SCOPE_HELP_CLAIM_DISCIPLINE}
    />
  );
}
