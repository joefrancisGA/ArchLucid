"use client";

import { AUDIT_EVIDENCE_LOOKUP_BUILD_PROVENANCE_LIMITATION } from "@/lib/audit-evidence-page-copy";
import { clientHasDeploymentBuildIdentity, readClientDeploymentFingerprint } from "@/lib/deployment-fingerprint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Surfaces missing build identity when the workspace footer is hidden on buyer-polished lookup (COA). */
export function AuditEvidenceLookupBuildProvenanceStrip(): React.JSX.Element | null {
  if (clientHasDeploymentBuildIdentity(readClientDeploymentFingerprint())) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="audit-evidence-lookup-build-provenance-limitation"
      role="note"
    >
      {AUDIT_EVIDENCE_LOOKUP_BUILD_PROVENANCE_LIMITATION}
    </p>
  );
}
