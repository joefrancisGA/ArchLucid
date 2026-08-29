import { cn } from "@/lib/utils";
import { OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";
import {
  GRAPH_NODE_KIND_LEGEND_ENTRIES,
  graphNodeKindCssVar,
} from "@/lib/graph-node-kind-presentation";

/**
 * Compact legend chips for graph node categories — shown in idle state and when the interactive graph is visible.
 * TB-2098: this is the sole loaded-graph legend vocabulary (node types the canvas draws).
 */
export function GraphNodeKindLegendChips(props: {
  className?: string;
  /** Accessible name; defaults to Legend for the single canvas legend contract (TB-2098). */
  "aria-label"?: string;
}) {
  return (
    <ul
      className={cn("m-0 flex flex-wrap gap-2 p-0 list-none", props.className)}
      data-testid="graph-node-kind-legend"
      aria-label={props["aria-label"] ?? "Legend"}
    >
      {GRAPH_NODE_KIND_LEGEND_ENTRIES.map((entry) => (
        <li
          key={entry.key}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-semibold uppercase tracking-wide",
            OPERATOR_NAV_GROUP_LABEL,
          )}
          style={{
            backgroundColor: graphNodeKindCssVar(entry.key, "bg"),
            borderColor: graphNodeKindCssVar(entry.key, "border"),
            color: "var(--al-text-primary)",
          }}
        >
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10"
            style={{ backgroundColor: graphNodeKindCssVar(entry.key, "swatch") }}
            aria-hidden
          />
          {entry.label}
        </li>
      ))}
    </ul>
  );
}
