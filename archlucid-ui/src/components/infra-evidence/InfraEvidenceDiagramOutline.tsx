"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

type InfraEvidenceDiagramOutlineProps = {
  readonly outline: InfraEvidenceMermaidOutline;
};

/** Structured list alternative to the Mermaid canvas (WCAG 1.1.1 peer affordance). */
export function InfraEvidenceDiagramOutline(props: InfraEvidenceDiagramOutlineProps): React.JSX.Element {
  const { outline } = props;
  const nodeRows = outline.nodes.slice(0, 200);
  const edgeRows = outline.edges.slice(0, 200);

  return (
    <div
      data-testid="infra-diagrams-mermaid-outline"
      className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-700"
    >
      <div className="grid gap-4 p-3 md:grid-cols-2">
        <div>
          <h3 className={cn("m-0 mb-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>Nodes</h3>
          <table className={cn("w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
            <thead className="bg-neutral-50 dark:bg-neutral-900/60">
              <tr>
                <th className="px-3 py-2 font-medium">Id</th>
                <th className="px-3 py-2 font-medium">Label</th>
              </tr>
            </thead>
            <tbody>
              {nodeRows.map((node) => (
                <tr key={node.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-3 py-2 font-mono text-sm">{node.id}</td>
                  <td className="px-3 py-2">{node.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {nodeRows.length === 0 ? (
            <p className={cn("m-0 px-3 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              No nodes parsed from the Mermaid source.
            </p>
          ) : null}
        </div>
        <div>
          <h3 className={cn("m-0 mb-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>Edges</h3>
          <table className={cn("w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
            <thead className="bg-neutral-50 dark:bg-neutral-900/60">
              <tr>
                <th className="px-3 py-2 font-medium">From</th>
                <th className="px-3 py-2 font-medium">To</th>
                <th className="px-3 py-2 font-medium">Label</th>
              </tr>
            </thead>
            <tbody>
              {edgeRows.map((edge, index) => (
                <tr
                  key={`${edge.from}-${edge.to}-${index}`}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td className="px-3 py-2 font-mono text-sm">{edge.from}</td>
                  <td className="px-3 py-2 font-mono text-sm">{edge.to}</td>
                  <td className="px-3 py-2">{edge.label ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {edgeRows.length === 0 ? (
            <p className={cn("m-0 px-3 py-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              No edges parsed from the Mermaid source.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
