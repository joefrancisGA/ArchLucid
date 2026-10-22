import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  deriveAiOutputGovernanceLabel,
  type AiOutputGovernanceKind,
} from "@/lib/ai-output-governance-label";

const STATUS_KIND_BY_GOVERNANCE: Readonly<Record<AiOutputGovernanceKind, EnterpriseStatusKind>> = {
  governed: "approved",
  advisory: "in-progress",
};

export type AiOutputGovernanceLabelProps = {
  readonly findingId?: string | null;
  readonly forceAdvisory?: boolean;
  readonly className?: string;
};

/** Distinguishes persisted governed findings from advisory LLM narratives. */
export function AiOutputGovernanceLabel(props: AiOutputGovernanceLabelProps): ReactElement {
  const model = deriveAiOutputGovernanceLabel({
    findingId: props.findingId,
    forceAdvisory: props.forceAdvisory,
  });

  return (
    <StatusTag
      kind={STATUS_KIND_BY_GOVERNANCE[model.kind]}
      label={model.label}
      title={model.title}
      className={cn("shrink-0", props.className)}
      data-testid={`ai-output-governance-label-${model.kind}`}
    />
  );
}
