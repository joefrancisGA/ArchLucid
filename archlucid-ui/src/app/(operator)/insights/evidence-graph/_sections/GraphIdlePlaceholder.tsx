import type { ComponentProps } from "react";

import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export type GraphIdlePlaceholderProps = {
  graphIdlePreset: ComponentProps<typeof EmptyState>;
  buyerPolishedShell: boolean;
  className?: string;
  /** When true, center the empty-state card as the primary workspace content. */
  prioritize?: boolean;
};

export function GraphIdlePlaceholder(props: GraphIdlePlaceholderProps) {
  const { graphIdlePreset, buyerPolishedShell, className, prioritize = false } = props;

  return (
    <div
      className={cn(
        buyerPolishedShell && prioritize && "mx-auto w-full max-w-xl",
        className,
      )}
      data-testid={prioritize ? "graph-idle-placeholder-primary" : "graph-idle-placeholder"}
    >
      <EmptyState {...graphIdlePreset} />
    </div>
  );
}
