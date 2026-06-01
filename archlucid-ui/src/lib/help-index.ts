import { isHelpDocPathInDefaultOperatorSearch } from "@/lib/help-doc-audience";
import { type HelpDocSearchRecord, HELP_DOC_SEARCH_RECORDS } from "@/lib/help-index.generated";

export type { HelpDocSearchRecord };

export type HelpDocSearchHit = HelpDocSearchRecord & {
  score: number;
};

export type HelpDocumentationSearchOptions = {
  /** When false (default), engineering runbook sections are excluded from shell search. */
  readonly includeDeveloperDocs?: boolean;
};

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

/**
 * Lightweight client-side search over {@link HELP_DOC_SEARCH_RECORDS} (build-time index; no network).
 */
function filterSearchRecords(
  records: readonly HelpDocSearchRecord[],
  options: HelpDocumentationSearchOptions | undefined,
): readonly HelpDocSearchRecord[] {
  if (options?.includeDeveloperDocs === true) {
    return records;
  }

  return records.filter((r) => isHelpDocPathInDefaultOperatorSearch(r.docPath));
}

export function searchHelpDocumentation(
  query: string,
  limit = 24,
  options?: HelpDocumentationSearchOptions,
): HelpDocSearchHit[] {
  const safeLimit = Math.max(1, Math.min(limit, 80));
  const tokens = tokenize(query.trim());
  const visibleRecords = filterSearchRecords(HELP_DOC_SEARCH_RECORDS, options);

  if (tokens.length === 0) {
    return visibleRecords.slice(0, Math.min(12, safeLimit)).map((r) => ({ ...r, score: 1 }));
  }

  const hits: HelpDocSearchHit[] = [];

  for (const r of visibleRecords) {
    const blob = `${r.docTitle}\n${r.sectionHeading}\n${r.excerpt}`.toLowerCase();
    const headingLower = r.sectionHeading.toLowerCase();
    const titleLower = r.docTitle.toLowerCase();
    let score = 0;

    for (const t of tokens) {
      if (blob.includes(t)) {
        score += 4;
      }

      if (headingLower.includes(t)) {
        score += 3;
      }

      if (titleLower.includes(t)) {
        score += 2;
      }
    }

    if (score > 0) {
      hits.push({ ...r, score });
    }
  }

  hits.sort((a, b) => b.score - a.score);

  return hits.slice(0, safeLimit);
}
