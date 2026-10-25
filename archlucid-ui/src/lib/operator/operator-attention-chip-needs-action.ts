import { normalizeOperatorHomeNonNegativeCount } from "@/lib/operator/run-home-status";
import type { OperatorAttentionKindId } from "@/lib/operator/operator-attention-taxonomy";

/** Whole-number attention badge count safe for UI and aria (non-finite → 0). */
export function resolveOperatorAttentionChipCount(count: number): number {
  return normalizeOperatorHomeNonNegativeCount(count);
}

/** True when any attention partition has actionable items (count > 0). */
export function operatorAttentionChipNeedsAction(count: number): boolean {
  return resolveOperatorAttentionChipCount(count) > 0;
}

export function formatOperatorAttentionChipAriaLabel(label: string, count: number): string {
  const normalized = resolveOperatorAttentionChipCount(count);
  const itemWord = normalized === 1 ? "item" : "items";

  return `${label}: ${normalized} ${itemWord}`;
}

export function resolveHighestNonZeroAttentionKind(
  countsByKind: Readonly<Partial<Record<OperatorAttentionKindId, number>>>,
  kindOrder: readonly OperatorAttentionKindId[],
): OperatorAttentionKindId | null {
  let highestKind: OperatorAttentionKindId | null = null;
  let highestCount = 0;

  for (const kind of kindOrder) {
    const count = resolveOperatorAttentionChipCount(countsByKind[kind] ?? 0);

    if (count > highestCount) {
      highestCount = count;
      highestKind = kind;
    }
  }

  return highestKind;
}
