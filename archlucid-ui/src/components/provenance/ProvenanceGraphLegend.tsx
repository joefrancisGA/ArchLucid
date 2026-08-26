import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Button } from "@/components/ui/button";
import type { ProvenanceLegendEntry } from "@/lib/provenance-node-presentation";

export type ProvenanceGraphLegendProps = {
  readonly legendOpen: boolean;
  readonly onLegendOpenChange: (open: boolean) => void;
  readonly legendEntries: readonly ProvenanceLegendEntry[];
};

export function ProvenanceGraphLegend(props: ProvenanceGraphLegendProps): React.JSX.Element {
  return (
    <div className="absolute bottom-2 left-2 max-w-[min(100%,20rem)]">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 bg-white/95 dark:bg-neutral-950/95"
        aria-expanded={props.legendOpen}
        aria-controls="provenance-graph-legend-panel"
        onClick={() => props.onLegendOpenChange(!props.legendOpen)}
      >
        Legend
      </Button>
      {props.legendOpen ? (
        <div
          id="provenance-graph-legend-panel"
          className="mt-2 rounded-md border border-neutral-200 bg-white/95 p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950/95"
          data-testid="provenance-graph-legend"
        >
          <ul className={cn("m-0 list-none space-y-1.5 p-0", OPERATOR_TYPOGRAPHY.micro)}>
            {props.legendEntries.map((entry) => (
              <li key={entry.key} className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <span
                  className="inline-block h-3 w-3 shrink-0 border"
                  style={{
                    backgroundColor: entry.fill,
                    borderColor: entry.stroke,
                    borderRadius: entry.shape === "circle" ? "9999px" : entry.shape === "diamond" ? "2px" : "3px",
                    transform: entry.shape === "diamond" ? "rotate(45deg)" : undefined,
                  }}
                  aria-hidden="true"
                />
                <span>{entry.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
