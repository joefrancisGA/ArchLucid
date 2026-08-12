import { describe, expect, it } from "vitest";

import {
  FINDING_SEVERITY_TAG_SEMANTIC_CONTRACT,
  listFindingSeverityContractMismatches,
} from "@/lib/finding-severity-tag-semantic-contract";
import { normalizeFindingSeverity, SEVERITY_LABELS } from "@/lib/design-tokens";

describe("FINDING_SEVERITY_TAG_SEMANTIC_CONTRACT (TB-328)", () => {
  it("covers all contract FindingSeverity enum names", () => {
    const names = FINDING_SEVERITY_TAG_SEMANTIC_CONTRACT.mappings.map(
      (mapping) => mapping.enumName,
    );

    expect(names).toEqual(["Info", "Warning", "Error", "Critical"]);
  });

  it("normalizeFindingSeverity matches the contract for API enum strings", () => {
    expect(listFindingSeverityContractMismatches()).toEqual([]);
  });

  it("maps Warning and Error without falling back to unknown", () => {
    expect(normalizeFindingSeverity("Warning")).toBe("warning");
    expect(normalizeFindingSeverity("Error")).toBe("error");
    expect(SEVERITY_LABELS.warning).toBe("Warning");
    expect(SEVERITY_LABELS.error).toBe("Error");
  });
});
