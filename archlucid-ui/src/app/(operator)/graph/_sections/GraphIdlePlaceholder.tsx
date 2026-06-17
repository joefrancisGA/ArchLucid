import type { ComponentProps } from "react";

import { EmptyState } from "@/components/EmptyState";

export type GraphIdlePlaceholderProps = {
  graphIdlePreset: ComponentProps<typeof EmptyState>;
  buyerPolishedShell: boolean;
};

export function GraphIdlePlaceholder(props: GraphIdlePlaceholderProps) {
  const { graphIdlePreset } = props;

  return (
    <div className="space-y-4">
      <EmptyState {...graphIdlePreset} />
    </div>
  );
}
