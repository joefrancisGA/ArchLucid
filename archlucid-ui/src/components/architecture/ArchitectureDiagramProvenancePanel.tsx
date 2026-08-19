"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import {
  buildArchitectureDiagramEdgeProvenanceDetail,
  buildArchitectureDiagramNodeProvenanceDetail,
  listSelectableArchitectureDiagramElements,
  type ArchitectureDiagramElementKind,
  type ArchitectureDiagramProvenanceClass,
} from "@/lib/architecture/architecture-diagram-provenance";
import type {
  ArchitectureDiagramModel,
  ArchitectureDiagramVersionSource,
} from "@/lib/architecture/architecture-diagram-types";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureDiagramProvenancePanelProps = {
  readonly runId: string;
  readonly model: ArchitectureDiagramModel;
  readonly diagramVersionSource: ArchitectureDiagramVersionSource | null;
  readonly selectedKind: ArchitectureDiagramElementKind | null;
  readonly selectedId: string | null;
  readonly onSelect: (kind: ArchitectureDiagramElementKind, id: string) => void;
};

function provenanceStatusKind(provenanceClass: ArchitectureDiagramProvenanceClass): "approved" | "needs-attention" | "neutral" {
  if (provenanceClass === "evidence-backed") {
    return "approved";
  }

  if (provenanceClass === "inferred") {
    return "needs-attention";
  }

  return "neutral";
}

function provenanceStatusLabel(provenanceClass: ArchitectureDiagramProvenanceClass): string {
  switch (provenanceClass) {
    case "evidence-backed":
      return "Evidence-backed";
    case "inferred":
      return "Inferred";
    case "user-drawn":
      return "User-drawn";
    default: {
      const exhaustive: never = provenanceClass;
      return exhaustive;
    }
  }
}

/** TB-2180: Why-is-this-here provenance for a selected diagram node or edge. */
export function ArchitectureDiagramProvenancePanel(props: ArchitectureDiagramProvenancePanelProps): React.JSX.Element {
  const selectable = listSelectableArchitectureDiagramElements(props.model);
  const selectedNode =
    props.selectedKind === "node"
      ? props.model.nodes.find((node) => node.id === props.selectedId && !node.removed) ?? null
      : null;
  const selectedEdge =
    props.selectedKind === "edge"
      ? props.model.edges.find((edge) => edge.id === props.selectedId && !edge.removed) ?? null
      : null;
  const detail =
    selectedNode !== null
      ? buildArchitectureDiagramNodeProvenanceDetail({
          runId: props.runId,
          node: selectedNode,
          diagramVersionSource: props.diagramVersionSource,
        })
      : selectedEdge !== null
        ? buildArchitectureDiagramEdgeProvenanceDetail({
            runId: props.runId,
            edge: selectedEdge,
            diagramVersionSource: props.diagramVersionSource,
          })
        : null;

  return (
    <aside className="space-y-3" data-testid="architecture-diagram-provenance-panel">
      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        Why is this here?
      </p>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Diagram nodes and connections">
        {selectable.map((entry) => {
          const active = props.selectedKind === entry.kind && props.selectedId === entry.id;

          return (
            <button
              key={`${entry.kind}:${entry.id}`}
              type="button"
              className={cn(
                "rounded-md px-2 py-1 text-left text-sm",
                active
                  ? "bg-neutral-900 font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-100 dark:bg-neutral-950 dark:text-neutral-200 dark:ring-neutral-700",
              )}
              aria-pressed={active}
              data-testid={`architecture-diagram-select-${entry.kind}-${entry.id}`}
              onClick={() => {
                props.onSelect(entry.kind, entry.id);
              }}
            >
              {entry.kind === "node" ? "Node" : "Edge"}: {entry.label}
            </button>
          );
        })}
      </div>

      {detail !== null ? (
        <div
          className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
          data-testid="architecture-diagram-provenance-detail"
        >
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag
              kind={provenanceStatusKind(detail.provenanceClass)}
              label={provenanceStatusLabel(detail.provenanceClass)}
            />
            <span className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{detail.label}</span>
          </div>
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{detail.sentence}</p>
          {detail.sourceHref !== null ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              <Link className={OPERATOR_LINK.inline} href={detail.sourceHref} data-testid="architecture-diagram-provenance-source-link">
                Open source evidence
              </Link>
            </p>
          ) : null}
        </div>
      ) : (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="status">
          Select a node or connection to see provenance.
        </p>
      )}
    </aside>
  );
}
