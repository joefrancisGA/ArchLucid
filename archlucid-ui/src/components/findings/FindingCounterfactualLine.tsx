"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  extractCounterfactualFromQuickDecisionFinding,
  FINDING_COUNTERFACTUAL_NOT_STORED,
  formatFindingCounterfactualPresentation,
} from "@/lib/findings/finding-counterfactual-line";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";

export type FindingCounterfactualLineProps = {
  readonly finding: QuickDecisionFinding;
  readonly className?: string;
};

/** Working-mode deterministic counterfactual helper (DX-26). */
export function FindingCounterfactualLine(props: FindingCounterfactualLineProps): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();

  if (!isWorkingMode) {
    return null;
  }

  const line = extractCounterfactualFromQuickDecisionFinding(props.finding);
  const presentation =
    line === null
      ? FINDING_COUNTERFACTUAL_NOT_STORED
      : formatFindingCounterfactualPresentation(line);

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid={`finding-counterfactual-${props.finding.findingId}`}
    >
      {presentation}
    </p>
  );
}
