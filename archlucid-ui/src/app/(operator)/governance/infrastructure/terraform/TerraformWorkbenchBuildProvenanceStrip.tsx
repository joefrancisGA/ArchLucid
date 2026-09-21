"use client";

import { GOVERNANCE_INFRASTRUCTURE_TERRAFORM_BUILD_PROVENANCE_LIMITATION } from "@/lib/governance/governance-infrastructure-copy";
import { clientHasDeploymentBuildIdentity, readClientDeploymentFingerprint } from "@/lib/deployment-fingerprint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Surfaces missing build identity when the workspace footer is hidden on buyer-polished Terraform mapping (ITE). */
export function TerraformWorkbenchBuildProvenanceStrip(): React.JSX.Element | null {
  if (clientHasDeploymentBuildIdentity(readClientDeploymentFingerprint())) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="infra-terraform-build-provenance-limitation"
      role="note"
    >
      {GOVERNANCE_INFRASTRUCTURE_TERRAFORM_BUILD_PROVENANCE_LIMITATION}
    </p>
  );
}
