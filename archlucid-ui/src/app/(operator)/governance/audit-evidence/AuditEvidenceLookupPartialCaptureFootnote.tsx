"use client";

import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { AUDIT_EVIDENCE_LOOKUP_PARTIAL_CAPTURE_LINE } from "@/lib/governance/audit-evidence-lookup-partial-capture-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function AuditEvidenceLookupPartialCaptureFootnote(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);

  if (!partialCapture) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="audit-evidence-lookup-partial-capture"
    >
      {AUDIT_EVIDENCE_LOOKUP_PARTIAL_CAPTURE_LINE}
    </p>
  );
}