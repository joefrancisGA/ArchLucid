import { describe, expect, it } from "vitest";

import {
  architectureIntelligenceContextRunHrefFromSearch,
  parseArchitectureIntelligenceContextRunIdFromSearch,
} from "@/lib/architecture/architecture-intelligence-context-run-url";
import {
  architectureIntelligenceTierHrefFromSearch,
  parseArchitectureIntelligenceTierFromSearch,
} from "@/lib/architecture/architecture-intelligence-tier-url";

describe("architecture intelligence URL helpers", () => {
  it("parseArchitectureIntelligenceTierFromSearch rejects unknown tier tokens", () => {
    expect(parseArchitectureIntelligenceTierFromSearch("NotARealTier")).toBeNull();
    expect(parseArchitectureIntelligenceTierFromSearch("Deep")).toBe("Deep");
  });

  it("architectureIntelligenceTierHrefFromSearch drops invalid tier when clearing to default", () => {
    const href = architectureIntelligenceTierHrefFromSearch("tier=NotARealTier&runId=abc", null);

    expect(href).not.toContain("tier=NotARealTier");
    expect(href).toContain("runId=abc");
  });

  it("architectureIntelligenceContextRunHrefFromSearch clears stale contextRunId", () => {
    const href = architectureIntelligenceContextRunHrefFromSearch(
      "runId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&contextRunId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      null,
    );

    expect(href).toContain("runId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(href).not.toContain("contextRunId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
  });

  it("parseArchitectureIntelligenceContextRunIdFromSearch trims whitespace", () => {
    expect(parseArchitectureIntelligenceContextRunIdFromSearch("  run-1  ")).toBe("run-1");
  });
});
