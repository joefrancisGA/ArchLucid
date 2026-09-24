import { cn } from "@/lib/utils";

import { collectInfraEvidenceDiagramAccentKinds } from "@/lib/infra-evidence/collect-infra-evidence-diagram-accent-kinds";
import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_HEADING,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_HOSTNAME_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_LEFT_EDGE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_LEFT_EDGE_GLOSS,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import {
  hasInfraEvidenceInferredDiagramEdges,
  hasInfraEvidenceDeclaredDiagramEdges,
  hasInfraEvidenceProbableDiagramEdges,
  type InfraEvidenceMermaidOutline,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type InfraEvidenceDiagramLegendProps = {
  readonly outline: InfraEvidenceMermaidOutline | null;
  readonly mermaidSource?: string | null;
  readonly layoutSvg?: string | null;
};

/** Inventory diagram legend for connector styles and left-edge category colors. */
export function InfraEvidenceDiagramLegend(props: InfraEvidenceDiagramLegendProps): React.JSX.Element | null {
  const hasDeclared = hasInfraEvidenceDeclaredDiagramEdges(props.outline, props.mermaidSource);
  const hasProbable = hasInfraEvidenceProbableDiagramEdges(props.outline, props.mermaidSource);
  const hasInferred = hasInfraEvidenceInferredDiagramEdges(props.outline, props.mermaidSource);
  const accentKinds = collectInfraEvidenceDiagramAccentKinds(props.layoutSvg);

  if (!hasDeclared && !hasProbable && !hasInferred && accentKinds.length === 0) {
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
        {hasProbable ? <li>{INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE}</li> : null}
        {hasInferred ? <li>{INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED}</li> : null}
      </ul>
      {hasInferred ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {INFRA_EVIDENCE_DIAGRAM_LEGEND_HOSTNAME_FOOTNOTE}
        </p>
      ) : null}
      {accentKinds.length > 0 ? (
        <div className="space-y-2">
          <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            {INFRA_EVIDENCE_DIAGRAM_LEGEND_LEFT_EDGE}
          </p>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {INFRA_EVIDENCE_DIAGRAM_LEGEND_LEFT_EDGE_GLOSS}
          </p>
          <ul
            aria-label={INFRA_EVIDENCE_DIAGRAM_LEGEND_LEFT_EDGE}
            className={cn("m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="infra-evidence-diagram-legend-left-edge"
          >
            {accentKinds.map((kind) => (
              <li key={kind.fill} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-3.5 w-1 shrink-0"
                  style={{ backgroundColor: kind.fill }}
                />
                {kind.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
