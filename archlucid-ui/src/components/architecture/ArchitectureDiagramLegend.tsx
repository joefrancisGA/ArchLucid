"use client";

import { cn } from "@/lib/utils";

import {
  ARCHITECTURE_DIAGRAM_LEGEND_ASSERTED,
  ARCHITECTURE_DIAGRAM_LEGEND_HEADING,
  ARCHITECTURE_DIAGRAM_LEGEND_INFERRED,
  ARCHITECTURE_DIAGRAM_LEGEND_INFERRED_LINE,
  ARCHITECTURE_DIAGRAM_LEGEND_PROVENANCE_NOTE,
  ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ACCEPTED_INFERENCE,
  ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ASSERTED,
  ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_INFERRED,
} from "@/lib/architecture/architecture-diagram-copy";
import {
  ARCHITECTURE_DIAGRAM_PROVENANCE_EDGES_WITHOUT_COMPONENTS,
  ARCHITECTURE_DIAGRAM_PROVENANCE_MODEL_EMPTY,
  ARCHITECTURE_DIAGRAM_PROVENANCE_MODEL_NOT_LOADED,
  architectureDiagramProvenanceActiveEdgeCount,
  architectureDiagramProvenanceActiveNodeCount,
  summarizeArchitectureDiagramProvenance,
} from "@/lib/architecture/architecture-diagram-provenance";
import type { ArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureDiagramLegendProps = {
  readonly model: ArchitectureDiagramModel | null;
};

/** Legend and asserted/inferred provenance counts for the architecture diagram panel. */
export function ArchitectureDiagramLegend(props: ArchitectureDiagramLegendProps): React.JSX.Element | null {
  if (props.model === null) {
    return (
      <p
        className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="architecture-diagram-legend-missing"
      >
        {ARCHITECTURE_DIAGRAM_PROVENANCE_MODEL_NOT_LOADED}
      </p>
    );
  }

  const summary = summarizeArchitectureDiagramProvenance(props.model);
  const activeNodeCount = architectureDiagramProvenanceActiveNodeCount(summary);
  const activeEdgeCount = architectureDiagramProvenanceActiveEdgeCount(summary);

  if (activeNodeCount === 0 && activeEdgeCount === 0) {
    return (
      <p
        className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="architecture-diagram-legend-empty"
      >
        {ARCHITECTURE_DIAGRAM_PROVENANCE_MODEL_EMPTY}
      </p>
    );
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
        <li data-testid="architecture-diagram-legend-inferred-line">{ARCHITECTURE_DIAGRAM_LEGEND_INFERRED_LINE}</li>
      </ul>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {ARCHITECTURE_DIAGRAM_LEGEND_PROVENANCE_NOTE}
      </p>
      {activeNodeCount === 0 ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-diagram-legend-edges-only"
        >
          {ARCHITECTURE_DIAGRAM_PROVENANCE_EDGES_WITHOUT_COMPONENTS}
        </p>
      ) : null}
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="status">
        {ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ASSERTED}: {summary.assertedNodeCount} components,{" "}
        {summary.assertedEdgeCount} lines. {ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ACCEPTED_INFERENCE}:{" "}
        {summary.acceptedInferenceNodeCount} components. {ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_INFERRED}:{" "}
        {summary.inferredNodeCount} components, {summary.inferredEdgeCount} lines.
      </p>
    </div>
  );
}
