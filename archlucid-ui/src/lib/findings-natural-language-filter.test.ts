import { describe, expect, it } from "vitest";

import {
  describeFindingsNaturalLanguageFacets,
  EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
  matchesFindingsNaturalLanguageFacets,
  parseFindingsNaturalLanguageFilter,
} from "@/lib/findings-natural-language-filter";

describe("findings-natural-language-filter (TB-2207)", () => {
  it("returns empty facets for blank input", () => {
    expect(parseFindingsNaturalLanguageFilter("")).toEqual(EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS);
    expect(parseFindingsNaturalLanguageFilter("   ")).toEqual(EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS);
  });

  it("parses severity bands deterministically", () => {
    expect(parseFindingsNaturalLanguageFilter("critical findings").severity).toBe("critical");
    expect(parseFindingsNaturalLanguageFilter("show high severity").severity).toBe("high");
    expect(parseFindingsNaturalLanguageFilter("medium risks").severity).toBe("medium");
    expect(parseFindingsNaturalLanguageFilter("moderate issues").severity).toBe("medium");
    expect(parseFindingsNaturalLanguageFilter("low informational").severity).toBe("low");
  });

  it("parses open and disposed status cues", () => {
    expect(parseFindingsNaturalLanguageFilter("open findings").status).toBe("open");
    expect(parseFindingsNaturalLanguageFilter("unresolved high").status).toBe("open");
    expect(parseFindingsNaturalLanguageFilter("disposed medium").status).toBe("disposed");
    expect(parseFindingsNaturalLanguageFilter("resolved accepted risks").status).toBe("disposed");
  });

  it("extracts title keywords after stripping facet tokens and stopwords", () => {
    const facets = parseFindingsNaturalLanguageFilter("open high severity TLS private endpoint");

    expect(facets.severity).toBe("high");
    expect(facets.status).toBe("open");
    expect(facets.titleKeywords).toEqual(["tls", "private", "endpoint"]);
  });

  it("matches rows by severity, status, and title keywords", () => {
    const facets = parseFindingsNaturalLanguageFilter("open high TLS");

    expect(
      matchesFindingsNaturalLanguageFacets(
        { title: "Missing TLS on ingress", severity: "High", status: "Open", latestDisposition: null },
        facets,
      ),
    ).toBe(true);

    expect(
      matchesFindingsNaturalLanguageFacets(
        { title: "Missing TLS on ingress", severity: "Low", status: "Open" },
        facets,
      ),
    ).toBe(false);

    expect(
      matchesFindingsNaturalLanguageFacets(
        {
          title: "Missing TLS on ingress",
          severity: "High",
          status: "Closed",
          latestDisposition: "Accepted",
        },
        facets,
      ),
    ).toBe(false);

    expect(
      matchesFindingsNaturalLanguageFacets(
        { title: "Public storage account", severity: "High", status: "Open" },
        facets,
      ),
    ).toBe(false);
  });

  it("describes applied facets for the operator helper line", () => {
    const facets = parseFindingsNaturalLanguageFilter("disposed critical encryption");

    expect(describeFindingsNaturalLanguageFacets(facets)).toContain("severity critical");
    expect(describeFindingsNaturalLanguageFacets(facets)).toContain("status disposed");
    expect(describeFindingsNaturalLanguageFacets(facets)).toContain("encryption");
  });
});