/**
 * Deterministic natural-language → findings filter facets (TB-2207).
 * Template/phrase parsing only — no LLM.
 */

export type FindingsNaturalLanguageSeverity = "critical" | "high" | "medium" | "low";

export type FindingsNaturalLanguageStatus = "open" | "disposed";

export type FindingsNaturalLanguageFacets = {
  readonly severity: FindingsNaturalLanguageSeverity | null;
  readonly status: FindingsNaturalLanguageStatus | null;
  readonly titleKeywords: readonly string[];
};

export const EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS: FindingsNaturalLanguageFacets = {
  severity: null,
  status: null,
  titleKeywords: [],
};

/** Stopwords and facet cue words stripped before leftover tokens become title keywords. */
const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "for",
  "in",
  "on",
  "with",
  "about",
  "show",
  "find",
  "filter",
  "findings",
  "finding",
  "risks",
  "risk",
  "please",
  "me",
  "all",
  "any",
  "that",
  "are",
  "is",
  "severity",
  "status",
  "titled",
  "title",
  "named",
  "keyword",
  "keywords",
  "containing",
  "contains",
  "include",
  "includes",
]);

const SEVERITY_PATTERNS: readonly {
  readonly severity: FindingsNaturalLanguageSeverity;
  readonly pattern: RegExp;
}[] = [
  { severity: "critical", pattern: /\bcritical\b/i },
  { severity: "high", pattern: /\bhigh\b/i },
  { severity: "medium", pattern: /\b(?:medium|moderate)\b/i },
  { severity: "low", pattern: /\b(?:low|info(?:rmational)?|minor)\b/i },
];

const OPEN_STATUS_PATTERN =
  /\b(?:open|undisposed|unresolved|needs?\s+decision|awaiting\s+decision|pending)\b/i;
const DISPOSED_STATUS_PATTERN =
  /\b(?:disposed|closed|resolved|remediated|waived|accepted|dismissed|deferred)\b/i;

function nonEmptyTrimmed(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function extractSeverity(normalized: string): FindingsNaturalLanguageSeverity | null {
  for (const entry of SEVERITY_PATTERNS) {
    if (entry.pattern.test(normalized)) {
      return entry.severity;
    }
  }

  return null;
}

function extractStatus(normalized: string): FindingsNaturalLanguageStatus | null {
  const hasOpen = OPEN_STATUS_PATTERN.test(normalized);
  const hasDisposed = DISPOSED_STATUS_PATTERN.test(normalized);

  if (hasOpen && !hasDisposed) {
    return "open";
  }

  if (hasDisposed && !hasOpen) {
    return "disposed";
  }

  // Prefer open when both cues appear ("open or disposed") — operators usually want work left.
  if (hasOpen && hasDisposed) {
    return "open";
  }

  return null;
}

function stripFacetTokens(normalized: string): string {
  return normalized
    .replace(OPEN_STATUS_PATTERN, " ")
    .replace(DISPOSED_STATUS_PATTERN, " ")
    .replace(/\b(?:critical|high|medium|moderate|low|info(?:rmational)?|minor)\b/gi, " ")
    .replace(/[^a-z0-9\s\-_/]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitleKeywords(normalized: string): string[] {
  const residual = stripFacetTokens(normalized);

  if (residual.length === 0) {
    return [];
  }

  const keywords: string[] = [];

  for (const token of residual.split(" ")) {
    const cleaned = token.trim().toLowerCase();

    if (cleaned.length < 2) {
      continue;
    }

    if (STOPWORDS.has(cleaned)) {
      continue;
    }

    if (!keywords.includes(cleaned)) {
      keywords.push(cleaned);
    }
  }

  return keywords;
}

/**
 * Parses a free-text phrase into severity, open/disposed status, and title keywords.
 * Order of severity patterns is fixed; first match wins.
 */
export function parseFindingsNaturalLanguageFilter(phrase: string): FindingsNaturalLanguageFacets {
  const raw = nonEmptyTrimmed(phrase);

  if (raw === null) {
    return EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS;
  }

  const normalized = raw.toLowerCase();

  return {
    severity: extractSeverity(normalized),
    status: extractStatus(normalized),
    titleKeywords: extractTitleKeywords(normalized),
  };
}

export function findingsNaturalLanguageFacetsAreEmpty(facets: FindingsNaturalLanguageFacets): boolean {
  return facets.severity === null && facets.status === null && facets.titleKeywords.length === 0;
}

export type FindingsNaturalLanguageMatchInput = {
  readonly title?: string | null;
  readonly severity?: string | null;
  /** Free-text status / disposition label (e.g. Open, Accepted, Remediated). */
  readonly status?: string | null;
  readonly latestDisposition?: string | null;
};

function severityMatches(
  itemSeverity: string | null | undefined,
  wanted: FindingsNaturalLanguageSeverity,
): boolean {
  const normalized = (itemSeverity ?? "").trim().toLowerCase();

  if (normalized.length === 0) {
    return false;
  }

  switch (wanted) {
    case "critical":
      return normalized.includes("critical") || normalized === "error" || normalized.includes("blocker");
    case "high":
      return normalized.includes("high") || normalized === "warning";
    case "medium":
      return normalized.includes("medium") || normalized.includes("moderate");
    case "low":
      return (
        normalized.includes("low") ||
        normalized.includes("info") ||
        normalized.includes("informational") ||
        normalized.includes("minor")
      );
    default: {
      const _exhaustive: never = wanted;

      return _exhaustive;
    }
  }
}

function isDisposedMatchInput(item: FindingsNaturalLanguageMatchInput): boolean {
  const haystack = `${item.status ?? ""} ${item.latestDisposition ?? ""}`.trim().toLowerCase();

  if (haystack.length === 0) {
    return false;
  }

  if (
    haystack.includes("closed") ||
    haystack.includes("resolved") ||
    haystack.includes("recorded") ||
    haystack.includes("remediated") ||
    haystack.includes("accepted") ||
    haystack.includes("dismissed") ||
    haystack.includes("rejected") ||
    haystack.includes("deferred") ||
    haystack.includes("waived")
  ) {
    return true;
  }

  return false;
}

/**
 * Client-side match for parsed NL facets against a finding/risk row.
 * Empty facets match everything.
 */
export function matchesFindingsNaturalLanguageFacets(
  item: FindingsNaturalLanguageMatchInput,
  facets: FindingsNaturalLanguageFacets,
): boolean {
  if (findingsNaturalLanguageFacetsAreEmpty(facets)) {
    return true;
  }

  if (facets.severity !== null && !severityMatches(item.severity, facets.severity)) {
    return false;
  }

  if (facets.status !== null) {
    const disposed = isDisposedMatchInput(item);

    if (facets.status === "open" && disposed) {
      return false;
    }

    if (facets.status === "disposed" && !disposed) {
      return false;
    }
  }

  if (facets.titleKeywords.length > 0) {
    const title = (item.title ?? "").toLowerCase();

    for (const keyword of facets.titleKeywords) {
      if (!title.includes(keyword)) {
        return false;
      }
    }
  }

  return true;
}

/** Human-readable chip line for applied NL facets (operator helper). */
export function describeFindingsNaturalLanguageFacets(facets: FindingsNaturalLanguageFacets): string {
  if (findingsNaturalLanguageFacetsAreEmpty(facets)) {
    return "No natural-language filters applied.";
  }

  const parts: string[] = [];

  if (facets.severity !== null) {
    parts.push(`severity ${facets.severity}`);
  }

  if (facets.status !== null) {
    parts.push(`status ${facets.status}`);
  }

  if (facets.titleKeywords.length > 0) {
    parts.push(`title contains "${facets.titleKeywords.join(" ")}"`);
  }

  return `Applied: ${parts.join("; ")}.`;
}