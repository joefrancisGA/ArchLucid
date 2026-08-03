import type { ComponentProps } from "react";

import { EmptyState } from "@/components/EmptyState";
import { GraphIdleLegend } from "@/components/GraphIdleLegend";
import { cn } from "@/lib/utils";
import {
  EVIDENCE_GRAPH_IDLE_PREVIEW_STEPS,
  EVIDENCE_GRAPH_IDLE_PREVIEW_TITLE,
} from "@/lib/evidence-graph-page";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type GraphIdlePlaceholderProps = {
  graphIdlePreset: ComponentProps<typeof EmptyState>;
  buyerPolishedShell: boolean;
  className?: string;
  /** When true, center the empty-state card as the primary workspace content. */
  prioritize?: boolean;
};

/** Idle workspace: teach the evidence graph shape before a review is loaded. */
export function GraphIdlePlaceholder(props: GraphIdlePlaceholderProps) {
  const { graphIdlePreset, buyerPolishedShell, className, prioritize = false } = props;

  return (
    <div
      className={cn(
        "space-y-4",
        buyerPolishedShell && prioritize && "mx-auto w-full max-w-xl",
        className,
      )}
      data-testid={prioritize ? "graph-idle-placeholder-primary" : "graph-idle-placeholder"}
    >
      <EmptyState {...graphIdlePreset} />
      <div
        className={cn(
          "rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50/70 p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-950/40",
          !prioritize && "min-h-[min(42vh,28rem)]",
        )}
        data-testid="graph-idle-workspace-frame"
        aria-label={EVIDENCE_GRAPH_IDLE_PREVIEW_TITLE}
      >
        <p className={cn("m-0 mb-3 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {EVIDENCE_GRAPH_IDLE_PREVIEW_TITLE}
        </p>
        <ol className={cn("m-0 mb-4 list-none space-y-1 p-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {EVIDENCE_GRAPH_IDLE_PREVIEW_STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="inline-flex min-w-[1.25rem] justify-center font-semibold text-al-text-primary">
                {index + 1}
              </span>
              <span>{step}</span>
              {index < EVIDENCE_GRAPH_IDLE_PREVIEW_STEPS.length - 1 ? (
                <span className="text-al-text-secondary" aria-hidden>
                  ↓
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <GraphIdleLegend buyerPolished={buyerPolishedShell} />
      </div>
    </div>
  );
}
