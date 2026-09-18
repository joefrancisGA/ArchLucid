"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_AUTHORIZATION_HINT,
  INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_HOSTNAME_HINT,
  INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_TITLE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import type { InfraEvidenceMermaidOutlineEdge } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export type InfraEvidenceInventoryEdgeDetailPanelProps = {
  readonly edge: InfraEvidenceMermaidOutlineEdge;
  readonly onClose: () => void;
};

function formatConfidenceBand(edge: InfraEvidenceMermaidOutlineEdge): string {
  switch (edge.confidenceBand) {
    case "declared":
      return "Declared";

    case "probable":
      return "Probable";

    case "inferred":
      return "Inferred";

    default:
      return "Observed";
  }
}

function resolveEdgeHint(edge: InfraEvidenceMermaidOutlineEdge): string | null {
  if (edge.inferenceSource === "inventory-app-authorized-access") {
    return INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_AUTHORIZATION_HINT;
  }

  if (edge.inferenceSource === "inventory-hostname-inferred-target") {
    return INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_HOSTNAME_HINT;
  }

  return null;
}

export function InfraEvidenceInventoryEdgeDetailPanel(
  props: InfraEvidenceInventoryEdgeDetailPanelProps,
): React.JSX.Element {
  const hint = resolveEdgeHint(props.edge);

  return (
    <div
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="infra-evidence-inventory-edge-detail-panel"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          {INFRA_EVIDENCE_INVENTORY_EDGE_PANEL_TITLE}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={props.onClose}>
          Close
        </Button>
      </div>
      <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.helper)}>
        <div>
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">Confidence band</dt>
          <dd className="m-0 text-neutral-900 dark:text-neutral-100">{formatConfidenceBand(props.edge)}</dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">Provenance</dt>
          <dd className="m-0 font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {props.edge.provenanceKind ?? "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-neutral-700 dark:text-neutral-300">Inference source</dt>
          <dd className="m-0 font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {props.edge.inferenceSource ?? "—"}
          </dd>
        </div>
      </dl>
      {hint != null ? (
        <p className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{hint}</p>
      ) : null}
    </div>
  );
}
