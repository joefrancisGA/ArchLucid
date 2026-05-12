import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { GraphMode } from "@/app/(operator)/graph/_sections/graph-page-helpers";

export type GraphModeAuxiliaryFieldsProps = {
  mode: GraphMode;
  graphMainColumnMaxClass: string;
  decisionId: string;
  onDecisionIdChange: (value: string) => void;
  nodeId: string;
  onNodeIdChange: (value: string) => void;
  depth: number;
  onDepthChange: (value: number) => void;
};

export function GraphModeAuxiliaryFields(props: GraphModeAuxiliaryFieldsProps) {
  const {
    mode,
    graphMainColumnMaxClass,
    decisionId,
    onDecisionIdChange,
    nodeId,
    onNodeIdChange,
    depth,
    onDepthChange,
  } = props;

  if (mode === "decision-subgraph") {
    return (
      <div className={cn("mb-3", graphMainColumnMaxClass)}>
        <Label htmlFor="graph-decision-id">Decision ID</Label>
        <Input
          id="graph-decision-id"
          value={decisionId}
          onChange={(e) => onDecisionIdChange(e.target.value)}
          placeholder="e.g. claims.intake.boundary"
          className="mt-1.5 max-w-xl font-mono text-sm"
        />
      </div>
    );
  }

  if (mode === "node-neighborhood") {
    return (
      <div className={cn("mb-3 flex flex-wrap items-end gap-3", graphMainColumnMaxClass)}>
        <div className="min-w-0 flex-1 sm:max-w-md">
          <Label htmlFor="graph-node-id">Node ID</Label>
          <Input
            id="graph-node-id"
            value={nodeId}
            onChange={(e) => onNodeIdChange(e.target.value)}
            placeholder="Graph node identifier"
            className="mt-1.5 font-mono text-sm"
          />
        </div>
        <div>
          <Label htmlFor="graph-depth">Depth</Label>
          <Input
            id="graph-depth"
            type="number"
            min={0}
            max={10}
            value={depth}
            onChange={(e) => onDepthChange(Number(e.target.value))}
            className="mt-1.5 w-20"
          />
        </div>
      </div>
    );
  }

  return null;
}
