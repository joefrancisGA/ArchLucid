"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { InfraDiagramsDataFlowCaptionPresentation } from "@/lib/infra-evidence/infra-evidence-data-flow-diagram";

type InfraEvidenceDataFlowCaptionDisclosureProps = {
  readonly presentation: InfraDiagramsDataFlowCaptionPresentation;
};

function formatHonestySummary(honestyCaptions: readonly string[]): string {
  return honestyCaptions.join(" ");
}

export function InfraEvidenceDataFlowCaptionDisclosure(
  props: InfraEvidenceDataFlowCaptionDisclosureProps,
): React.JSX.Element | null {
  const honestySummary = formatHonestySummary(props.presentation.honestyCaptions);

  if (honestySummary.length === 0) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="infra-diagrams-data-flow-caption"
    >
      {honestySummary}
    </p>
  );
}
