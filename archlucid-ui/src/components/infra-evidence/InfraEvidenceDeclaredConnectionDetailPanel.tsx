"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_NOT_FOUND,
  INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_OPEN_WORKBENCH,
  INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_TITLE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import {
  resolveInfraEvidenceOutlineEdgeLabel,
  resolveInfraEvidenceOutlineNodeLabel,
  type InfraEvidenceMermaidOutlineEdge,
  type InfraEvidenceMermaidOutlineNode,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { infrastructureDeclaredConnectionsPathForProductLine } from "@/lib/product-line/securenow-infrastructure-routes";
import { formatSecurityEvidenceProvenanceKindLabel } from "@/lib/security-evidence-path-presentation";
import type { SecurityDeclaredConnectionRow } from "@/lib/security-declared-connection-types";

export type InfraEvidenceDeclaredConnectionDetailPanelProps = {
  readonly edge: InfraEvidenceMermaidOutlineEdge;
  readonly nodes: readonly InfraEvidenceMermaidOutlineNode[];
  readonly connections: readonly SecurityDeclaredConnectionRow[];
  readonly connectionsLoading: boolean;
  readonly connectionsError: string | null;
  readonly onClose: () => void;
};

function formatPanelCell(value: string | null | undefined): string {
  if (value == null || value.trim().length === 0) {
    return "—";
  }

  return value;
}

function formatExpiration(value: string | null | undefined): string {
  if (value == null || value.trim().length === 0) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

/** Read-only accountability panel for a declared diagram edge. */
export function InfraEvidenceDeclaredConnectionDetailPanel(
  props: InfraEvidenceDeclaredConnectionDetailPanelProps,
): React.JSX.Element {
  const { productLine } = useProductLine();
  const workbenchHref = infrastructureDeclaredConnectionsPathForProductLine(productLine);
  const matchedConnection = useMemo(() => {
    const connectionId = props.edge.declaredConnectionId?.trim() ?? "";

    if (connectionId.length === 0) {
      return null;
    }

    return props.connections.find((row) => row.connectionId === connectionId) ?? null;
  }, [props.connections, props.edge.declaredConnectionId]);

  const fromLabel = resolveInfraEvidenceOutlineNodeLabel(props.nodes, props.edge.from);
  const toLabel = resolveInfraEvidenceOutlineNodeLabel(props.nodes, props.edge.to);
  const relationshipLabel = resolveInfraEvidenceOutlineEdgeLabel(props.edge, props.nodes);

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="infra-evidence-declared-connection-panel"
      aria-labelledby="infra-evidence-declared-connection-panel-title"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3
          id="infra-evidence-declared-connection-panel-title"
          className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_TITLE}
        </h3>
        <Button type="button" size="sm" variant="outline" onClick={props.onClose}>
          Close
        </Button>
      </div>

      <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="text-al-text-secondary">From</dt>
          <dd className="m-0">{fromLabel}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">To</dt>
          <dd className="m-0">{toLabel}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Relationship</dt>
          <dd className="m-0">{formatPanelCell(relationshipLabel)}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Provenance</dt>
          <dd className="m-0">{formatSecurityEvidenceProvenanceKindLabel("HumanAssertion")}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-al-text-secondary">Rationale</dt>
          <dd className="m-0">{formatPanelCell(matchedConnection?.rationale)}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Evidence reference</dt>
          <dd className="m-0">{formatPanelCell(matchedConnection?.evidenceReference)}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Approved by</dt>
          <dd className="m-0">—</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Expires</dt>
          <dd className="m-0">{formatExpiration(matchedConnection?.expirationUtc)}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Status</dt>
          <dd className="m-0">{formatPanelCell(matchedConnection?.status)}</dd>
        </div>
      </dl>

      {props.connectionsLoading ? (
        <p className={cn("mt-3 m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          Loading declared connections…
        </p>
      ) : null}

      {!props.connectionsLoading && matchedConnection == null ? (
        <p className={cn("mt-3 m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_NOT_FOUND}
        </p>
      ) : null}

      {props.connectionsError != null ? (
        <p className={cn("mt-3 m-0 text-al-status-error", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {props.connectionsError}
        </p>
      ) : null}

      <div className="mt-4">
        <Button asChild type="button" size="sm" variant="outline">
          <Link href={workbenchHref}>{INFRA_EVIDENCE_DECLARED_CONNECTION_PANEL_OPEN_WORKBENCH}</Link>
        </Button>
      </div>
    </section>
  );
}
