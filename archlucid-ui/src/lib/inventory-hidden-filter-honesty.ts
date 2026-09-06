export type InventoryHiddenFilterHonestyInput = {
  readonly visibleCount: number;
  readonly filteredPoolCount: number;
  readonly unitSingular: string;
  readonly unitPlural: string;
  readonly filterLabel?: string | null;
};

export type InventoryHiddenFilterHonesty = {
  readonly hiddenCount: number;
  readonly line: string | null;
  readonly hasHidden: boolean;
};

export const INVENTORY_HIDDEN_FILTER_SHOW_ALL_LABEL = "Show all" as const;

function pluralizeUnit(count: number, unitSingular: string, unitPlural: string): string {
  return `${count} ${count === 1 ? unitSingular : unitPlural}`;
}

export function formatInventoryHiddenFilterLine(
  hiddenCount: number,
  unitSingular: string,
  unitPlural: string,
  filterLabel?: string | null,
): string | null {
  const safeHidden = Math.max(0, Math.trunc(hiddenCount));

  if (safeHidden <= 0) {
    return null;
  }

  const unitPhrase = pluralizeUnit(safeHidden, unitSingular, unitPlural);
  const trimmedFilterLabel = filterLabel?.trim() ?? "";

  if (trimmedFilterLabel.length > 0) {
    return `${unitPhrase} hidden by ${trimmedFilterLabel} filter`;
  }

  return `${unitPhrase} hidden by filters`;
}

/** Persistent honesty when inventory filters hide open work (DA-08 / CA-40). */
export function deriveInventoryHiddenFilterHonesty(
  input: InventoryHiddenFilterHonestyInput,
): InventoryHiddenFilterHonesty {
  const safeVisible = Math.max(0, Math.trunc(input.visibleCount));
  const safePool = Math.max(0, Math.trunc(input.filteredPoolCount));
  const hiddenCount = Math.max(0, safePool - safeVisible);
  const line = formatInventoryHiddenFilterLine(
    hiddenCount,
    input.unitSingular,
    input.unitPlural,
    input.filterLabel,
  );

  return {
    hiddenCount,
    line,
    hasHidden: line !== null,
  };
}
