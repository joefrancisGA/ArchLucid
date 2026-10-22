"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_DIAGRAM_ACCEPT_INFERRED_ACTION,
  ARCHITECTURE_DIAGRAM_INFERRED_REVIEW_HEADING,
  ARCHITECTURE_DIAGRAM_REMOVE_INFERRED_ACTION,
  ARCHITECTURE_DIAGRAM_RESTORE_INFERRED_ACTION,
  ARCHITECTURE_DIAGRAM_REMOVED_INFERRED_HEADING,
} from "@/lib/architecture/architecture-diagram-copy";
import type { ArchitectureDiagramModel, ArchitectureDiagramNode } from "@/lib/architecture/architecture-diagram-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureDiagramInferredPanelProps = {
  readonly model: ArchitectureDiagramModel;
  readonly canEdit: boolean;
  readonly onNodeOverride: (nodes: readonly ArchitectureDiagramNode[]) => void;
};

function updateNode(
  nodes: readonly ArchitectureDiagramNode[],
  nodeId: string,
  patch: Partial<ArchitectureDiagramNode>,
): ArchitectureDiagramNode[] {
  return nodes.map((entry) => (entry.id === nodeId ? { ...entry, ...patch } : entry));
}

/** Accept, remove, or restore inferred diagram components beside the viewer. */
export function ArchitectureDiagramInferredPanel(props: ArchitectureDiagramInferredPanelProps): React.JSX.Element | null {
  const pendingNodes = props.model.nodes.filter(
    (node) => node.provenance === "inferred" && !node.accepted && !node.removed,
  );
  const removedNodes = props.model.nodes.filter((node) => node.provenance === "inferred" && node.removed);

  if (pendingNodes.length === 0 && removedNodes.length === 0) {
    return null;
  }

  return (
    <aside className="space-y-4" data-testid="architecture-diagram-inferred-panel">
      {pendingNodes.length > 0 ? (
        <div className="space-y-2" data-testid="architecture-diagram-inferred-list">
          <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            {ARCHITECTURE_DIAGRAM_INFERRED_REVIEW_HEADING}
          </p>
          <ul className="m-0 list-none space-y-2 p-0">
            {pendingNodes.map((node) => (
              <li
                key={node.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-neutral-300 p-2 dark:border-neutral-700"
              >
                <span className={OPERATOR_TYPOGRAPHY.body}>{node.label}</span>
                {props.canEdit ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      data-testid={`architecture-diagram-accept-${node.id}`}
                      onClick={() => {
                        props.onNodeOverride(updateNode(props.model.nodes, node.id, { accepted: true }));
                      }}
                    >
                      {ARCHITECTURE_DIAGRAM_ACCEPT_INFERRED_ACTION}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      data-testid={`architecture-diagram-remove-${node.id}`}
                      onClick={() => {
                        props.onNodeOverride(updateNode(props.model.nodes, node.id, { removed: true }));
                      }}
                    >
                      {ARCHITECTURE_DIAGRAM_REMOVE_INFERRED_ACTION}
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {removedNodes.length > 0 ? (
        <div className="space-y-2" data-testid="architecture-diagram-removed-inferred-list">
          <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            {ARCHITECTURE_DIAGRAM_REMOVED_INFERRED_HEADING}
          </p>
          <ul className="m-0 list-none space-y-2 p-0">
            {removedNodes.map((node) => (
              <li
                key={node.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 p-2 dark:border-neutral-800"
              >
                <span className={cn(OPERATOR_TYPOGRAPHY.body, "text-neutral-600 dark:text-neutral-400")}>{node.label}</span>
                {props.canEdit ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid={`architecture-diagram-restore-${node.id}`}
                    onClick={() => {
                      props.onNodeOverride(updateNode(props.model.nodes, node.id, { removed: false }));
                    }}
                  >
                    {ARCHITECTURE_DIAGRAM_RESTORE_INFERRED_ACTION}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
