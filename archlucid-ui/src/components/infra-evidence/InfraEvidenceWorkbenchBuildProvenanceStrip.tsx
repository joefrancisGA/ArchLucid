"use client";

import { clientHasDeploymentBuildIdentity, readClientDeploymentFingerprint } from "@/lib/deployment-fingerprint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_INFRASTRUCTURE_WORKBENCH_BUILD_PROVENANCE_LIMITATION } from "@/lib/governance/governance-infrastructure-copy";
import { cn } from "@/lib/utils";

export type InfraEvidenceWorkbenchBuildProvenanceStripProps = {
  readonly testId: string;
};

/** Surfaces the provenance limitation when the workspace footer is hidden on infrastructure workbenches. */
export function InfraEvidenceWorkbenchBuildProvenanceStrip(
  props: InfraEvidenceWorkbenchBuildProvenanceStripProps,
): React.JSX.Element | null {
  if (clientHasDeploymentBuildIdentity(readClientDeploymentFingerprint())) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId}
      role="note"
    >
      {GOVERNANCE_INFRASTRUCTURE_WORKBENCH_BUILD_PROVENANCE_LIMITATION}
    </p>
  );
}
