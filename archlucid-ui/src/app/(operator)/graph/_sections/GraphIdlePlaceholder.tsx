import type { ComponentProps } from "react";

import { EmptyState } from "@/components/EmptyState";
import { GraphIdleLegend } from "@/components/GraphIdleLegend";

export type GraphIdlePlaceholderProps = {
  graphIdlePreset: ComponentProps<typeof EmptyState>;
  buyerPolishedShell: boolean;
};

export function GraphIdlePlaceholder(props: GraphIdlePlaceholderProps) {
  const { graphIdlePreset, buyerPolishedShell } = props;

  return (
    <div className="space-y-4">
      <GraphIdleLegend buyerPolished={buyerPolishedShell} />
      <EmptyState {...graphIdlePreset} />
    </div>
  );
}
