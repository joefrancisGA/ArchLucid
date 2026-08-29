"use client";

import { GraphNodeKindLegendChips } from "@/components/GraphNodeKindLegendChips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type GraphViewerSelectionSettingsProps = {
  readonly buyerTrailPanel: boolean;
  readonly compactChrome: boolean;
  readonly interactiveSurfaceReady: boolean;
  readonly isAdvanced: boolean;
  readonly onToggleAdvanced: () => void;
  readonly edgeInferenceThreshold: string;
  readonly onEdgeInferenceThresholdChange: (value: string) => void;
};

export function GraphViewerSelectionSettings({
  buyerTrailPanel,
  compactChrome,
  interactiveSurfaceReady,
  isAdvanced,
  onToggleAdvanced,
  edgeInferenceThreshold,
  onEdgeInferenceThresholdChange,
}: GraphViewerSelectionSettingsProps): JSX.Element {
  return (
    <>
      {interactiveSurfaceReady ? (
        <div
          className={cn(
            "rounded-md border border-slate-200 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-900/40",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="graph-canvas-legend"
        >
          <GraphNodeKindLegendChips />
        </div>
      ) : null}
      {!buyerTrailPanel && !compactChrome ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="m-0">Graph Settings</h3>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={isAdvanced ? "outline" : "default"}
                size="sm"
                className={cn("h-7 px-2", OPERATOR_TYPOGRAPHY.button)}
                onClick={() => {
                  if (isAdvanced) {
                    onToggleAdvanced();
                  }
                }}
              >
                Basic
              </Button>
              <Button
                type="button"
                variant={isAdvanced ? "default" : "outline"}
                size="sm"
                className={cn("h-7 px-2", OPERATOR_TYPOGRAPHY.button)}
                onClick={() => {
                  if (!isAdvanced) {
                    onToggleAdvanced();
                  }
                }}
              >
                Advanced
              </Button>
            </div>
          </div>

          {isAdvanced ? (
            <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
              <Label htmlFor="edge-inference-threshold" className={OPERATOR_TYPOGRAPHY.helper}>
                Edge Inference Threshold
              </Label>
              <Input
                id="edge-inference-threshold"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={edgeInferenceThreshold}
                onChange={(event) => onEdgeInferenceThresholdChange(event.target.value)}
                className={cn("h-8", OPERATOR_TYPOGRAPHY.body)}
              />
              <p className={cn("text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                Minimum confidence score required to render inferred edges between nodes.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
