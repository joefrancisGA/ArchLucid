"use client";

import { clientHasDeploymentBuildIdentity, readClientDeploymentFingerprint } from "@/lib/deployment-fingerprint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Surfaces missing build identity when the workspace footer is hidden on governance surfaces (SEA P1). */
export function GovernanceAssignedToMeBuildProvenanceStrip(): React.JSX.Element | null {
  if (clientHasDeploymentBuildIdentity(readClientDeploymentFingerprint())) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="governance-assigned-to-me-build-provenance-limitation"
      role="note"
    >
      Provenance limitation: build identity is unavailable in this environment, so screenshots and support bundles
      cannot be tied to a deployed UI commit from this page alone.
    </p>
  );
}
