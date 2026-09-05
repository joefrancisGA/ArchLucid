import type { OperatorAttentionKindId } from "@/lib/operator/operator-attention-taxonomy";

/** True when any attention partition has actionable items (count > 0). */
export function operatorAttentionChipNeedsAction(count: number): boolean {
  return count > 0;
}

export function formatOperatorAttentionChipAriaLabel(label: string, count: number): string {
  const itemWord = count === 1 ? "item" : "items";

  return `${label}: ${count} ${itemWord}`;
}

export function resolveHighestNonZeroAttentionKind(
  countsByKind: Readonly<Partial<Record<OperatorAttentionKindId, number>>>,
  kindOrder: readonly OperatorAttentionKindId[],
): OperatorAttentionKindId | null {
  let highestKind: OperatorAttentionKindId | null = null;
  let highestCount = 0;

  for (const kind of kindOrder) {
    const count = countsByKind[kind] ?? 0;

    if (count > highestCount) {
      highestCount = count;
      highestKind = kind;
    }
  }

  return highestKind;
}
