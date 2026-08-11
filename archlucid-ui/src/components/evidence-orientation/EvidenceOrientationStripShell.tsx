import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Vertical rhythm between stacked orientation bands (claim discipline, freshness line, Sources). */
export const EVIDENCE_ORIENTATION_STRIP_SPACING = "space-y-3";

export type EvidenceOrientationStripShellProps = {
  readonly testId: string;
  readonly children: ReactNode;
  /** Outer page rhythm above or below the strip, composed before the shared band spacing. */
  readonly margin?: string;
  /** Alignment for strips inside centred page sections, composed after the shared band spacing. */
  readonly align?: string;
};

/** Root wrapper for an evidence orientation strip — owns strip spacing and the strip test id. */
export function EvidenceOrientationStripShell({
  testId,
  children,
  margin,
  align,
}: EvidenceOrientationStripShellProps): React.JSX.Element {
  return (
    <div className={cn(margin, EVIDENCE_ORIENTATION_STRIP_SPACING, align)} data-testid={testId}>
      {children}
    </div>
  );
}
