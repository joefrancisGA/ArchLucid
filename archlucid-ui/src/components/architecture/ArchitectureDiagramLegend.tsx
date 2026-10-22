"use client";

import { cn } from "@/lib/utils";

import {
  ARCHITECTURE_DIAGRAM_LEGEND_ASSERTED,
  ARCHITECTURE_DIAGRAM_LEGEND_HEADING,
  ARCHITECTURE_DIAGRAM_LEGEND_INFERRED,
  ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ASSERTED,
  ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_INFERRED,
} from "@/lib/architecture/architecture-diagram-copy";
import { summarizeArchitectureDiagramProvenance } from "@/lib/architecture/architecture-diagram-provenance";
import type { ArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureDiagramLegendProps = {
  readonly model: ArchitectureDiagramModel | null;
};

/** Legend and asserted/inferred provenance counts for the architecture diagram panel. */
export function ArchitectureDiagramLegend(props: ArchitectureDiagramLegendProps): React.JSX.Element | null {
  if (props.model === null) {
    return null;
  }

  const summary = summarizeArchitectureDiagramProvenance(props.model);

  if (summary.assertedNodeCount + summary.inferredNodeCount === 0) {
    return null;
  }

  return (
    <div
      className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="architecture-diagram-legend"
    >
      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {ARCHITECTURE_DIAGRAM_LEGEND_HEADING}
      </p>
      <ul className={cn("m-0 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        <li>{ARCHITECTURE_DIAGRAM_LEGEND_ASSERTED}</li>
        <li>{ARCHITECTURE_DIAGRAM_LEGEND_INFERRED}</li>
      </ul>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="status">
        {ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ASSERTED}: {summary.assertedNodeCount} components,{" "}
        {summary.assertedEdgeCount} connections. {ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_INFERRED}:{" "}
        {summary.inferredNodeCount} components, {summary.inferredEdgeCount} connections.
      </p>
    </div>
  );
}
