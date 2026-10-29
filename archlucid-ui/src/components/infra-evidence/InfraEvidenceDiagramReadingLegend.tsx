"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { resolveInfraEvidenceDiagramReadingLegend } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-reading-legend";
import { cn } from "@/lib/utils";

export function InfraEvidenceDiagramReadingLegend(props: {
  readonly mode: string;
  readonly executiveOverflowStripped?: boolean;
  readonly crossGroupFanOutIncluded?: boolean;
}): React.JSX.Element {
  const lines = resolveInfraEvidenceDiagramReadingLegend(props.mode, {
    executiveOverflowStripped: props.executiveOverflowStripped,
    crossGroupFanOutIncluded: props.crossGroupFanOutIncluded,
  });

  return (
    <section
      className="rounded-md border border-border bg-muted/20 p-3"
      aria-label="How to read this diagram"
      data-testid="infra-evidence-diagram-reading-legend"
    >
      <h3 className={cn("m-0 mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>How to read this diagram</h3>
      <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
        <li data-testid="infra-evidence-diagram-reading-legend-boxes">{lines.boxes}</li>
        <li data-testid="infra-evidence-diagram-reading-legend-connectors">{lines.connectors}</li>
        <li data-testid="infra-evidence-diagram-reading-legend-evidence-kind">{lines.evidenceKind}</li>
      </ul>
    </section>
  );
}
