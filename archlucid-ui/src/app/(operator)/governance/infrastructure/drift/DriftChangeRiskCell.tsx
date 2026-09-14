"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { InfraEvidenceDiffChange } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  buildInfraEvidenceDriftRiskTooltip,
  formatInfraEvidenceDriftRiskLabel,
  isInfraEvidenceDriftRiskTooltipEligible,
  resolveInfraEvidenceDriftRiskKey,
} from "@/lib/infra-evidence/infra-evidence-drift-risk-display";
import { OPERATOR_TYPOGRAPHY, TOOLTIP_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DriftChangeRiskCellProps = {
  readonly change: InfraEvidenceDiffChange;
};

export function DriftChangeRiskCell({ change }: DriftChangeRiskCellProps): React.JSX.Element {
  const riskKey = resolveInfraEvidenceDriftRiskKey(change.riskClassification);
  const label = formatInfraEvidenceDriftRiskLabel(riskKey);

  if (!isInfraEvidenceDriftRiskTooltipEligible(riskKey)) {
    return (
      <span className={OPERATOR_TYPOGRAPHY.body} data-testid="infra-drift-risk-label">
        {label}
      </span>
    );
  }

  const tooltip = buildInfraEvidenceDriftRiskTooltip(change);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "m-0 cursor-help border-0 border-b border-dotted border-neutral-500 bg-transparent p-0 text-left text-inherit underline-offset-2 dark:border-neutral-400",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="infra-drift-risk-label"
          aria-label={`${label} risk details`}
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm whitespace-pre-line py-2">
        <p className={cn("m-0", TOOLTIP_TYPOGRAPHY.body)}>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
