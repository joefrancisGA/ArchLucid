import type { DemoProvenanceGraph, DemoProvenanceGraphEdge } from "@/types/demo-explain";

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
          className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
        >
          Provenance graph
        </h2>
        <p className="text-xs text-neutral-500">
          {graph.nodeCount} nodes · {graph.edgeCount} edges
        </p>
      </header>

      {graph.isEmpty ? (
        <p className="text-sm text-neutral-500">
          The demo review produced no provenance nodes — re-seed the demo to refresh.
        </p>
      ) : (
        <ol className="space-y-2 text-sm" data-testid="demo-explain-provenance-graph-nodes">
          {graph.nodes.map((node) => {
            const outgoing = adjacencyByNode[node.id] ?? [];

            return (
              <li
                key={node.id}
                className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {node.label}{" "}
                  <span className="rounded bg-neutral-200 px-1 py-0.5 text-xs font-normal text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {node.type}
                  </span>
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-neutral-500">{node.id}</p>
                {outgoing.length > 0 ? (
                  <ul className="mt-1 list-disc pl-5 text-xs text-neutral-600 dark:text-neutral-400">
                    {outgoing.map((edge) => (
                      <li key={`${edge.source}->${edge.target}:${edge.type}`}>
                        <span className="text-neutral-500">{edge.type} →</span>{" "}
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
