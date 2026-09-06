"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInventoryShowingLine } from "@/lib/inventory-showing-count";
import { cn } from "@/lib/utils";

export type InventoryShowingCountBandProps = {
  readonly loaded: number;
  readonly total: number;
  readonly hasMore?: boolean;
  readonly testId?: string;
};

/** Persistent inventory honesty line when the visible slice is not the full set (DA-07 / TB-2152). */
export function InventoryShowingCountBand(props: InventoryShowingCountBandProps): React.JSX.Element | null {
  const line = formatInventoryShowingLine(props.loaded, props.total, props.hasMore);

  if (line === null) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId ?? "inventory-showing-count"}
      role="status"
    >
      {line}
    </p>
  );
}
