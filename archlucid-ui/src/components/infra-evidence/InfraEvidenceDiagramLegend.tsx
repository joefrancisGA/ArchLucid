import { cn } from "@/lib/utils";

import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_HEADING,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import {
  hasInfraEvidenceInferredDiagramEdges,
  hasInfraEvidenceDeclaredDiagramEdges,
  type InfraEvidenceMermaidOutline,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type InfraEvidenceDiagramLegendProps = {
  readonly outline: InfraEvidenceMermaidOutline | null;
  readonly mermaidSource?: string | null;
};

/** Inventory diagram edge-style legend when declared or inferred edges are present. */
export function InfraEvidenceDiagramLegend(props: InfraEvidenceDiagramLegendProps): React.JSX.Element | null {
  const hasDeclared = hasInfraEvidenceDeclaredDiagramEdges(props.outline, props.mermaidSource);
  const hasInferred = hasInfraEvidenceInferredDiagramEdges(props.outline, props.mermaidSource);

  if (!hasDeclared && !hasInferred) {
    return null;
  }

  return (
    <div
      className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="infra-evidence-diagram-legend"
    >
      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {INFRA_EVIDENCE_DIAGRAM_LEGEND_HEADING}
      </p>
      <ul className={cn("m-0 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        <li>{INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED}</li>
        {hasDeclared ? <li>{INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED}</li> : null}
        {hasInferred ? <li>{INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED}</li> : null}
      </ul>
    </div>
  );
}
