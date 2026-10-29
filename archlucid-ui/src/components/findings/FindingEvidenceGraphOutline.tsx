"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildExaminedNodeIdSet, isGraphNodeExamined } from "@/lib/findings/finding-evidence-graph-highlight";

type FindingEvidenceGraphOutlineProps = {
  readonly graph: GraphViewModel;
  readonly graphNodeIdsExamined: readonly string[];
};

/** Structured list alternative to the React Flow canvas (WCAG 1.1.1 peer affordance). */
export function FindingEvidenceGraphOutline(props: FindingEvidenceGraphOutlineProps): React.JSX.Element {
  const examinedIds = buildExaminedNodeIdSet(props.graphNodeIdsExamined);
  const totalNodes = props.graph.nodes.length;
  const rows = props.graph.nodes.slice(0, 200);
  const hiddenNodeCount = totalNodes - rows.length;

  return (
    <div data-testid="finding-evidence-graph-outline" className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-700">
      <table className={cn("w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
        <thead className="bg-neutral-50 dark:bg-neutral-900/60">
          <tr>
            <th className="px-3 py-2 font-medium">Node</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Examined</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((node) => (
            <tr key={node.id} className="border-t border-neutral-200 dark:border-neutral-800">
              <td className="whitespace-pre-line px-3 py-2 font-mono text-sm">
                {node.label === null || node.label === undefined
                  ? "Node name was not stored"
                  : node.label.length === 0
                    ? "Node name was stored empty."
                    : node.label}
              </td>
              <td className="px-3 py-2">
                {node.type === null || node.type === undefined
                  ? "Node type was not stored"
                  : node.type.length === 0
                    ? "Node type was stored empty."
                    : node.type}
              </td>
              <td className="px-3 py-2">{isGraphNodeExamined(node.id, examinedIds) ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className={cn("m-0 px-3 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Graph nodes were not stored.
        </p>
      ) : null}
      {hiddenNodeCount > 0 ? (
        <p
          className={cn("m-0 px-3 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="finding-evidence-graph-outline-remainder"
        >
          Showing 200 of {totalNodes} nodes. The rest were not listed in this outline.
        </p>
      ) : null}
    </div>
  );
}
