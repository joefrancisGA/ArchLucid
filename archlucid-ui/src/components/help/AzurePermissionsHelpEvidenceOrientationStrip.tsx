import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE } from "@/lib/azure-permissions-help-evidence-copy";

/** Claim-discipline orientation for `/help/azure-permissions` — no diligence Sources list (TB-2092). */
export function AzurePermissionsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimCallout
      testId="azure-permissions-help-claim-discipline"
      body={AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE}
    />
  );
}
