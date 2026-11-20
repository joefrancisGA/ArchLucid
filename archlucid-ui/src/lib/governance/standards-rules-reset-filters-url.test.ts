import { describe, expect, it } from "vitest";

import { standardsRulesResetFiltersHrefFromSearch } from "@/lib/governance/standards-rules-filters-url";

describe("standards rules reset filters URL", () => {
  it("removes every list filter while preserving review scope and unrelated disclosures", () => {
    expect(
      standardsRulesResetFiltersHrefFromSearch(
        "runId=r1&q=encryption&severity=high&linkedFindings=linked&evidenceCoverage=evidenced&enforcement=Required&framework=NIST&pack=baseline&details=1",
      ),
    ).toBe("/governance/standards-and-rules?runId=r1&details=1");
  });
});
