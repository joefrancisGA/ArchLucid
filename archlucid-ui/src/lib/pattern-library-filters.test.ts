import { describe, expect, it } from "vitest";

import {
  DEFAULT_PATTERN_LIBRARY_FILTERS,
  filterPatternLibraryRecords,
  derivePatternLibrarySummary,
  resolvePatternLibraryRecords,
} from "@/lib/pattern-library-filters";
import { PATTERN_LIBRARY_SAMPLE_CATALOG } from "@/lib/pattern-library-catalog";

describe("filterPatternLibraryRecords", () => {
  it("filters by domain and platform", () => {
    const filtered = filterPatternLibraryRecords(PATTERN_LIBRARY_SAMPLE_CATALOG, {
      ...DEFAULT_PATTERN_LIBRARY_FILTERS,
      domain: "Healthcare",
      platform: "Azure",
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((record) => record.domains.includes("Healthcare"))).toBe(true);
    expect(filtered.every((record) => record.platforms.includes("Azure"))).toBe(true);
  });

  it("filters by search query", () => {
    const filtered = filterPatternLibraryRecords(PATTERN_LIBRARY_SAMPLE_CATALOG, {
      ...DEFAULT_PATTERN_LIBRARY_FILTERS,
      query: "knowledge assistant",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.patternKey).toBe("rag-knowledge-assistant");
  });
});

describe("derivePatternLibrarySummary", () => {
  it("counts domains and platforms across the catalog", () => {
    const summary = derivePatternLibrarySummary(PATTERN_LIBRARY_SAMPLE_CATALOG);

    expect(summary.patternsTracked).toBe(10);
    expect(summary.domainsRepresented).toBeGreaterThan(3);
    expect(summary.platformsRepresented).toBeGreaterThan(3);
    expect(summary.minimumTenantThreshold).toBe(5);
  });
});

describe("resolvePatternLibraryRecords", () => {
  it("returns an empty list when live keys are absent and sample catalog is disabled", () => {
    expect(resolvePatternLibraryRecords([], false)).toEqual([]);
  });

  it("returns the sample catalog when sample mode is enabled", () => {
    expect(resolvePatternLibraryRecords([], true).length).toBeGreaterThan(0);
  });
});
