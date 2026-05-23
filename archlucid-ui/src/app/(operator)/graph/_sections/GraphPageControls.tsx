import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { GRAPH_MODE_NATIVE_TITLES } from "@/components/GraphIdleLegend";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { cn } from "@/lib/utils";
import type { GraphMode } from "@/app/(operator)/graph/_sections/graph-page-helpers";

export type GraphPageControlsProps = {
  graphMainColumnMaxClass: string;
  runId: string;
  onRunIdChange: (value: string) => void;
  mode: GraphMode;
  onModeChange: (mode: GraphMode) => void;
  demoUi: boolean;
  buyerPolishedShell: boolean;
  showLoadButton: boolean;
  loadButtonLabel: string;
  loading: boolean;
  onLoadGraph: () => void;
  decisionId: string;
  nodeId: string;
};

export function GraphPageControls(props: GraphPageControlsProps) {
  const {
    graphMainColumnMaxClass,
    runId,
    onRunIdChange,
    mode,
    onModeChange,
    demoUi,
    buyerPolishedShell,
    showLoadButton,
    loadButtonLabel,
    loading,
    onLoadGraph,
    decisionId,
    nodeId,
  } = props;

  return (
    <div
      className={cn(
        "mb-6 flex flex-nowrap items-end gap-3 overflow-x-auto rounded-lg border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
        graphMainColumnMaxClass,
      )}
    >
      <div className="min-w-[12rem] flex-1 lg:max-w-sm">
        <AskRunIdPicker
          value={runId}
          onChange={onRunIdChange}
          selectedThreadId=""
          fieldId="graph-run"
          label="Review"
          committedOnly
        />
      </div>

      {!(demoUi || buyerPolishedShell) ? (
        <div className="min-w-[10rem] lg:w-auto">
          <Label htmlFor="graph-mode-select" className="text-[13px] font-semibold">
            Graph mode
          </Label>
          <select
            id="graph-mode-select"
            value={mode}
            onChange={(e) => onModeChange(e.target.value as GraphMode)}
            className={cn(
              "mt-1.5 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
              "lg:w-[220px]",
            )}
          >
            <option value="provenance-full" title={GRAPH_MODE_NATIVE_TITLES["provenance-full"]}>
              {BUYER_SURFACE_VOCABULARY.evidenceGraph} (provenance)
            </option>
            <option value="decision-subgraph" title={GRAPH_MODE_NATIVE_TITLES["decision-subgraph"]}>
              Decision focus
            </option>
            <option value="node-neighborhood" title={GRAPH_MODE_NATIVE_TITLES["node-neighborhood"]}>
              Node connections
            </option>
            <option value="architecture" title={GRAPH_MODE_NATIVE_TITLES.architecture}>
              Architecture graph
            </option>
          </select>
        </div>
      ) : null}

      {showLoadButton ? (
        <Button
          type="button"
          variant="primary"
          className="w-full lg:w-auto"
          onClick={() => void onLoadGraph()}
          disabled={
            loading ||
            runId.trim().length === 0 ||
            (mode === "decision-subgraph" && decisionId.trim().length === 0) ||
            (mode === "node-neighborhood" && nodeId.trim().length === 0)
          }
        >
          {loadButtonLabel}
        </Button>
      ) : null}
    </div>
  );
}
