"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { GraphViewModel } from "@/types/graph";

type FindingEvidenceGraphOutlineProps = {
  readonly graph: GraphViewModel;
  readonly graphNodeIdsExamined: readonly string[];
};

/** Structured list alternative to the React Flow canvas (WCAG 1.1.1 peer affordance). */
export function FindingEvidenceGraphOutline(props: FindingEvidenceGraphOutlineProps): React.JSX.Element {
  const examinedSet = new Set(props.graphNodeIdsExamined);
  const rows = props.graph.nodes.slice(0, 200);

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
              <td className="px-3 py-2 font-mono text-sm">{node.label ?? node.id}</td>
              <td className="px-3 py-2">{node.type ?? "Unknown"}</td>
              <td className="px-3 py-2">{examinedSet.has(node.id) ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className={cn("m-0 px-3 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          No graph nodes match the examined set for this finding.
        </p>
      ) : null}
    </div>
  );
}
