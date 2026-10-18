"use client";

import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EXPORT_HONESTY_LINE } from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type InfraDiagramsExportHonestyStripProps = {
  readonly className?: string;
  readonly testId?: string;
};

/** Diagram export literacy — not sponsor-package or disposition copy. */
export function InfraDiagramsExportHonestyStrip({
  className,
  testId = "infra-diagrams-export-honesty",
}: InfraDiagramsExportHonestyStripProps): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper, className)}
      data-testid={testId}
      role="note"
    >
      {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EXPORT_HONESTY_LINE}
    </p>
  );
}
