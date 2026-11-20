"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRemediationWorkbenchActiveFiltersSummary } from "@/lib/infra-evidence/remediation-workbench-active-filters-summary-copy";
import { cn } from "@/lib/utils";

export function RemediationWorkbenchActiveFiltersSummaryLine(props: {
  readonly statusLabel: string;
  readonly waveId: string;
}): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="infra-remediation-active-filters-summary"
    >
      {formatRemediationWorkbenchActiveFiltersSummary(props.statusLabel, props.waveId)}
    </p>
  );
}