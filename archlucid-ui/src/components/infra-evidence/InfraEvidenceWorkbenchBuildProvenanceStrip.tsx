"use client";

import { clientHasDeploymentBuildIdentity, readClientDeploymentFingerprint } from "@/lib/deployment-fingerprint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
      <strong>Provenance limitation:</strong>
    </p>
  );
}
