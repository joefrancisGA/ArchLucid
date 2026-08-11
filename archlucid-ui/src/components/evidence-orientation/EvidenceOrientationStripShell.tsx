import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Vertical rhythm between stacked orientation bands (claim discipline, freshness line, Sources). */
export const EVIDENCE_ORIENTATION_STRIP_SPACING = "space-y-3";

export type EvidenceOrientationStripShellProps = {
  readonly testId: string;
  readonly children: ReactNode;
  /** Extra layout classes for the strip root (page-specific outer margin or alignment). */
  readonly className?: string;
};

/** Root wrapper for an evidence orientation strip — owns strip spacing and the strip test id. */
export function EvidenceOrientationStripShell({
  testId,
  children,
  className,
}: EvidenceOrientationStripShellProps): React.JSX.Element {
  return (
    <div className={cn(EVIDENCE_ORIENTATION_STRIP_SPACING, className)} data-testid={testId}>
      {children}
    </div>
  );
}
