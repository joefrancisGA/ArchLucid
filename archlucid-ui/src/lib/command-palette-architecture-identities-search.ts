import type { ArchitectureIdentityListItem } from "@/types/architecture-identity";

const COMMAND_PALETTE_ARCHITECTURE_MATCH_LIMIT = 6;

function normalizedSearchTokens(search: string): readonly string[] {
  return search
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function architectureIdentityMatchesSearch(
  item: ArchitectureIdentityListItem,
  tokens: readonly string[],
): boolean {
  if (tokens.length === 0) {
    return false;
  }

  const haystack = `${item.displayName} ${item.architectureId}`.toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

/** Filters CA-11 identity rows for Ctrl+K open — never treats draft ids as architecture ids. */
export function filterArchitectureIdentitiesForPaletteSearch(
  items: readonly ArchitectureIdentityListItem[],
  search: string,
): readonly ArchitectureIdentityListItem[] {
  const tokens = normalizedSearchTokens(search);

  if (tokens.length === 0) {
    return [];
  }

  return items
    .filter((item) => architectureIdentityMatchesSearch(item, tokens))
    .slice(0, COMMAND_PALETTE_ARCHITECTURE_MATCH_LIMIT);
}

export function commandPaletteOpenArchitectureLabel(displayName: string): string {
  const trimmed = displayName.trim();

  return trimmed.length > 0 ? `Open architecture ${trimmed}` : "Open architecture";
}
