"use client";

import { cn } from "@/lib/utils";

import { ProvenanceNodeExplainCell } from "@/components/ProvenanceNodeExplainCell";
import { ProvenanceReferenceLink } from "@/components/ProvenanceReferenceLink";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buyerTrailEdgeDisplayPhrase } from "@/lib/graph-mapper";
import {
  provenanceNodeDisplayName,
  provenanceNodeTypeLabel,
} from "@/lib/provenance-node-presentation";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";

type ProvenanceGraphNode = ArchitectureRunProvenanceGraph["nodes"][number];
type ProvenanceGraphEdge = ArchitectureRunProvenanceGraph["edges"][number];

export type ProvenancePageWorkspaceNodeAsideProps = {
  readonly runId: string;
  readonly selectedNode: ProvenanceGraphNode;
  readonly graphNodes: ArchitectureRunProvenanceGraph["nodes"];
  readonly nodeById: Map<string, ProvenanceGraphNode>;
  readonly incomingEdges: ProvenanceGraphEdge[];
  readonly outgoingEdges: ProvenanceGraphEdge[];
  readonly onSelectEdge: (edgeId: string) => void;
};

export function ProvenancePageWorkspaceNodeAside(props: ProvenancePageWorkspaceNodeAsideProps): React.JSX.Element {
  const { runId, selectedNode, graphNodes, nodeById, incomingEdges, outgoingEdges, onSelectEdge } = props;

  return (
    <aside
      className="mt-4 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      aria-label="Selected node details"
      data-testid="provenance-node-detail"
    >
      <h4 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{provenanceNodeDisplayName(selectedNode)}</h4>
      <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {provenanceNodeTypeLabel(selectedNode.type)}
      </p>
      <dl className={cn("mt-3 space-y-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="font-semibold">Reference</dt>
          <dd className="mt-0.5">
            <ProvenanceReferenceLink runId={runId} referenceId={selectedNode.referenceId} nodes={graphNodes} />
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Incoming</dt>
          <dd className="mt-0.5">
            {incomingEdges.length === 0 ? (
              <span className="text-neutral-500">None</span>
            ) : (
              <ul className="m-0 list-disc pl-5">
                {incomingEdges.map((edge) => (
                  <li key={edge.id}>
                    <button
                      type="button"
                      className="text-left underline decoration-neutral-400 underline-offset-2"
                      onClick={() => onSelectEdge(edge.id)}
                    >
                      {buyerTrailEdgeDisplayPhrase(edge.type)} from{" "}
                      {provenanceNodeDisplayName(
                        nodeById.get(edge.fromNodeId) ?? {
                          id: edge.fromNodeId,
                          type: "unknown",
                          referenceId: edge.fromNodeId,
                          name: edge.fromNodeId,
                        },
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Outgoing</dt>
          <dd className="mt-0.5">
            {outgoingEdges.length === 0 ? (
              <span className="text-neutral-500">None</span>
            ) : (
              <ul className="m-0 list-disc pl-5">
                {outgoingEdges.map((edge) => (
                  <li key={edge.id}>
                    <button
                      type="button"
                      className="text-left underline decoration-neutral-400 underline-offset-2"
                      onClick={() => onSelectEdge(edge.id)}
                    >
                      {buyerTrailEdgeDisplayPhrase(edge.type)} to{" "}
                      {provenanceNodeDisplayName(
                        nodeById.get(edge.toNodeId) ?? {
                          id: edge.toNodeId,
                          type: "unknown",
                          referenceId: edge.toNodeId,
                          name: edge.toNodeId,
                        },
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>
      <div className="mt-3">
        <ProvenanceNodeExplainCell runId={runId} nodeId={selectedNode.id} />
      </div>
    </aside>
  );
}
