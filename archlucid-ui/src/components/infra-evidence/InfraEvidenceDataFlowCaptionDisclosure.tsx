"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DATA_FLOW_CAPTION_TITLE } from "@/lib/governance/governance-infrastructure-copy";
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
  const { honestyCaptions, metadataComments } = props.presentation;
  const honestySummary = formatHonestySummary(honestyCaptions);

  if (honestySummary.length === 0 && metadataComments.length === 0) {
    return null;
  }

  if (metadataComments.length === 0) {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="infra-diagrams-data-flow-caption"
      >
        {honestySummary}
      </p>
    );
  }

  return (
    <CollapsibleSection
      title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DATA_FLOW_CAPTION_TITLE}
      summaryLine={honestySummary.length > 0 ? honestySummary : undefined}
      defaultOpen={false}
      sectionTestId="infra-diagrams-data-flow-caption"
      className="mb-0 border-0 bg-transparent p-0 dark:bg-transparent"
    >
      <ul
        className={cn("m-0 list-none space-y-1 pl-0 font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="infra-diagrams-data-flow-metadata"
      >
        {metadataComments.map((comment) => (
          <li key={comment}>{comment}</li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}
