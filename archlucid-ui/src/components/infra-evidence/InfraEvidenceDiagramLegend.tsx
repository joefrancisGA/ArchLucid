import { cn } from "@/lib/utils";

import { collectInfraEvidenceDiagramAccentKinds } from "@/lib/infra-evidence/collect-infra-evidence-diagram-accent-kinds";
import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_HEADING,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_HOSTNAME_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_RESOURCE_CATEGORY,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import {
  hasInfraEvidenceInferredDiagramEdges,
  hasInfraEvidenceDeclaredDiagramEdges,
  hasInfraEvidenceProbableDiagramEdges,
  type InfraEvidenceMermaidOutline,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function PrivateEndpointAccessGlyph(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-5 shrink-0"
      data-testid="infra-evidence-private-endpoint-access-glyph"
      viewBox="0 0 20 12"
    >
      <title>Private endpoint access</title>
      <g className="private-endpoint-access" fill="none">
        <g className="private-endpoint-lock" transform="scale(0.667)">
          <rect x="3.5" y="6.5" width="5" height="4.5" rx="0.8" fill="#0f766e" />
          <path
            d="M4 6.5V4.8C4 3.25 5.2 2 6.75 2S9.5 3.25 9.5 4.8V6.5"
            stroke="#0f766e"
            strokeLinecap="round"
            strokeWidth="1.4"
          />
        </g>
        <path
          className="private-endpoint-arrow"
          d="M10 3 L16 6 L10 9 z"
          fill="#0f766e"
        />
      </g>
    </svg>
  );
}

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
  const hasPrivateEndpointAccess = props.layoutSvg?.includes("private-endpoint-access") === true;
  const showConnectorLegend = hasDeclared || hasProbable || hasInferred || hasPrivateEndpointAccess;

  if (!showConnectorLegend && accentKinds.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="infra-evidence-diagram-legend"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
        {showConnectorLegend ? (
          <div className="min-w-0 flex-1 space-y-2">
            <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              {INFRA_EVIDENCE_DIAGRAM_LEGEND_HEADING}
            </p>
            <ul className={cn("m-0 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              <li>{INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED}</li>
              {hasDeclared ? <li>{INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED}</li> : null}
              {hasProbable ? <li>{INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE}</li> : null}
              {hasInferred ? <li>{INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED}</li> : null}
            </ul>
            {hasPrivateEndpointAccess ? (
              <div
                className={cn("flex items-center gap-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="infra-evidence-diagram-legend-private-endpoint"
              >
                <PrivateEndpointAccessGlyph />
                <span>Private endpoint</span>
              </div>
            ) : null}
            {hasInferred ? (
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {INFRA_EVIDENCE_DIAGRAM_LEGEND_HOSTNAME_FOOTNOTE}
              </p>
            ) : null}
          </div>
        ) : null}
        {accentKinds.length > 0 ? (
          <div className="min-w-0 space-y-2 sm:shrink-0">
            <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              {INFRA_EVIDENCE_DIAGRAM_LEGEND_RESOURCE_CATEGORY}
            </p>
            <ul
              aria-label={INFRA_EVIDENCE_DIAGRAM_LEGEND_RESOURCE_CATEGORY}
              className={cn("m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="infra-evidence-diagram-legend-resource-category"
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
    </div>
  );
}
