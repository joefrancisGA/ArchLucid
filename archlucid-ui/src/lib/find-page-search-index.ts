import { COMMAND_PALETTE_ACTIONS } from "@/lib/command-palette-actions";
import { COMMAND_PALETTE_CURATED_TASKS } from "@/lib/command-palette-curated-tasks";
import { searchHelpTopics } from "@/lib/usability/search-help-topics";

export type FindPageSearchEntrySource = "curated" | "action" | "help";

export type FindPageSearchEntry = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly searchValue: string;
  readonly source: FindPageSearchEntrySource;
};

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function scoreEntry(entry: FindPageSearchEntry, normalizedQuery: string): number {
  const haystack = `${entry.label} ${entry.searchValue}`.toLowerCase();

  if (haystack.startsWith(normalizedQuery)) {
    return 100;
  }

  if (entry.label.toLowerCase().includes(normalizedQuery)) {
    return 80;
  }

  if (haystack.includes(normalizedQuery)) {
    return 60;
  }

  const tokens = normalizedQuery.split(/\s+/).filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return 0;
  }

  const matchedTokens = tokens.filter((token) => haystack.includes(token)).length;

  if (matchedTokens === tokens.length) {
    return 40 + matchedTokens;
  }

  return 0;
}

/** Static find-a-page entries shared by header search and command palette (TB-2364). */
export function buildStaticFindPageSearchIndex(): readonly FindPageSearchEntry[] {
  const curated: FindPageSearchEntry[] = COMMAND_PALETTE_CURATED_TASKS.map((task) => ({
    id: `curated:${task.href}`,
    label: task.label,
    href: task.href,
    searchValue: task.searchValue,
    source: "curated",
  }));

  const actions: FindPageSearchEntry[] = COMMAND_PALETTE_ACTIONS.map((action) => ({
    id: `action:${action.id}`,
    label: action.label,
    href: action.href,
    searchValue: action.searchValue,
    source: "action",
  }));

  return [...curated, ...actions];
}

export function searchFindPageIndex(
  query: string,
  options?: { readonly limit?: number },
): readonly FindPageSearchEntry[] {
  const normalizedQuery = normalizeQuery(query);

  if (normalizedQuery.length === 0) {
    return [];
  }

  const limit = options?.limit ?? 8;

  return buildStaticFindPageSearchIndex()
    .map((entry) => ({ entry, score: scoreEntry(entry, normalizedQuery) }))
    .filter((row) => row.score > 0)
    .sort((left, right) => right.score - left.score || left.entry.label.localeCompare(right.entry.label))
    .slice(0, limit)
    .map((row) => row.entry);
}

/** Help-topic rows in the same result shape for header merge (Insights Ask excluded). */
export function searchFindPageHelpEntries(
  query: string,
  options?: { readonly limit?: number },
): readonly FindPageSearchEntry[] {
  const limit = options?.limit ?? 4;

  return searchHelpTopics(query, limit).map((hit) => ({
    id: `help:${hit.slug}`,
    label: hit.title,
    href: `/help/${hit.slug}`,
    searchValue: `${hit.title} ${hit.summary}`,
    source: "help" as const,
  }));
}
