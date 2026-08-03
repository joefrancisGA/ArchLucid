import { describe, expect, it } from "vitest";

import {
  allPageContextualHelpRows,
  contextualHelpForPathname,
  type PageContextualHelpEntry,
} from "@/lib/contextual-help-registry";

const INTERNAL_ROUTE_IN_COPY =
  /\/(admin|api|governance|settings|integrations|reviews|architectures|help|graph|compare|replay|value-report|digests|planning|advisory|executive|manifests|signed-records)(\/|\b)/i;

const API_PATH_IN_COPY = /\/v\d+\//;

const TB_LABEL_IN_COPY = /\bTB-\d+\b/;

const MAX_WORDS_PER_PAGE = 120;

function entryFieldValues(entry: PageContextualHelpEntry): string[] {
  return [
    entry.whatIsThisPage,
    entry.whatToDoNext,
    entry.whyEmpty ?? "",
    entry.whereToConfigurePrerequisite ?? "",
  ].filter((value) => value.length > 0);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter((token) => token.length > 0).length;
}

describe("contextual-help-registry (TB-733)", () => {
  it("covers the starting operator pages", () => {
    const prefixes = allPageContextualHelpRows().map((row) => row.prefix);

    expect(prefixes).toEqual([
      "/architecture/reviews",
      "/governance/findings",
      "/insights/ask-review-questions",
      "/insights/compare-two-reviews",
      "/insights/search-review-evidence",
      "/help/data-handling-tenant-isolation",
      "/help/dpa-template",
      "/help/path-chooser",
      "/help/policy-pack-delta-demo",
      "/help/configuration-reference",
      "/help/first-review",
      "/help/developer-troubleshooting",
      "/governance/standards-and-rules",
      "/digests",
      "/planning",
      "/governance/advisory-scans",
      "/value-report",
    ]);
  });

  it("resolves nested paths from the longest matching prefix", () => {
    expect(contextualHelpForPathname("/architecture/reviews/new")?.whatIsThisPage).toContain("architecture reviews");
    expect(contextualHelpForPathname("/governance/findings?filter=open")?.whatToDoNext).toContain("Assign owners");
    expect(contextualHelpForPathname("/value-report/pilot")?.whatIsThisPage).toContain("sponsor-ready");
  });

  it("returns null for routes not yet migrated", () => {
    expect(contextualHelpForPathname("/administration/connection-status")).toBeNull();
    expect(contextualHelpForPathname("/architecture/architectures")).toBeNull();
  });

  it("keeps each page within the Category 1 word budget", () => {
    for (const row of allPageContextualHelpRows()) {
      const totalWords = entryFieldValues(row.entry).reduce((sum, field) => sum + wordCount(field), 0);

      expect(totalWords, row.prefix).toBeLessThanOrEqual(MAX_WORDS_PER_PAGE);
    }
  });

  it("forbids internal routes, API paths, and TB labels in registry copy", () => {
    for (const row of allPageContextualHelpRows()) {
      for (const field of entryFieldValues(row.entry)) {
        expect(field, `${row.prefix} internal route`).not.toMatch(INTERNAL_ROUTE_IN_COPY);
        expect(field, `${row.prefix} API path`).not.toMatch(API_PATH_IN_COPY);
        expect(field, `${row.prefix} TB label`).not.toMatch(TB_LABEL_IN_COPY);
      }
    }
  });
});
