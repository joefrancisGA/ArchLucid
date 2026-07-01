import { cn } from "@/lib/utils";
import type { DemoProvenanceGraph, DemoProvenanceGraphEdge } from "@/types/demo-explain";
import { provenanceGraphNodeTypeBuyerLabel } from "@/lib/citation-kind-buyer-label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly graph: DemoProvenanceGraph;
};

export function DemoExplainProvenanceGraphPanel(props: Props) {
  const graph = props.graph;
  const adjacencyByNode: Record<string, DemoProvenanceGraphEdge[]> = {};

  graph.edges.forEach((edge) => {
    if (!adjacencyByNode[edge.source]) {
      adjacencyByNode[edge.source] = [];
    }

    adjacencyByNode[edge.source].push(edge);
  });

  return (
    <section
      aria-labelledby="demo-explain-graph-heading"
      data-testid="demo-explain-provenance-graph"
      className="space-y-3 rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <header className="space-y-1">
        <h2
          id="demo-explain-graph-heading"
          className={OPERATOR_TYPOGRAPHY.cardTitle}
        >
          Provenance graph
        </h2>
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {graph.nodeCount} nodes · {graph.edgeCount} edges
        </p>
      </header>

      {graph.isEmpty ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          The demo review produced no provenance nodes — re-seed the demo to refresh.
        </p>
      ) : (
        <ol className={cn("space-y-2", OPERATOR_TYPOGRAPHY.body)} data-testid="demo-explain-provenance-graph-nodes">
          {graph.nodes.map((node) => {
            const outgoing = adjacencyByNode[node.id] ?? [];

            return (
              <li
                key={node.id}
                className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <p className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {node.label}{" "}
                  <span className={cn("rounded bg-neutral-200 px-1 py-0.5 font-normal text-al-text-primary dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.badge)}>
                    {provenanceGraphNodeTypeBuyerLabel(node.type)}
                  </span>
                </p>
                <p className={cn("mt-0.5 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{node.id}</p>
                {outgoing.length > 0 ? (
                  <ul className={cn("mt-1 list-disc pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {outgoing.map((edge) => (
                      <li key={`${edge.source}->${edge.target}:${edge.type}`}>
                        <span className="text-al-text-secondary">{edge.type} →</span>{" "}
                        <code>{edge.target}</code>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
