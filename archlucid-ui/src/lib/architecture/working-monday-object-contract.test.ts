import { describe, expect, it } from "vitest";

import {
  WORKING_MONDAY_OBJECT_ADR_ID,
  WORKING_MONDAY_OBJECT_CONTRACT,
  WORKING_MONDAY_OBJECT_FAILURE_IDS,
  architectureNestedAskPath,
} from "@/lib/architecture/working-monday-object-contract";

describe("working-monday-object-contract (SY-03 / ADR 0079)", () => {
  it("names ADR 0079 and documents five Monday-morning failures", () => {
    expect(WORKING_MONDAY_OBJECT_ADR_ID).toBe("0079");
    expect(WORKING_MONDAY_OBJECT_FAILURE_IDS).toHaveLength(5);
    expect(WORKING_MONDAY_OBJECT_CONTRACT.failureIds).toEqual(WORKING_MONDAY_OBJECT_FAILURE_IDS);
    expect(WORKING_MONDAY_OBJECT_CONTRACT.nestedToolHelperNames).toContain("architectureNestedAskPath");
  });

  it("exposes nested Ask path helper after SY-36", () => {
    expect(architectureNestedAskPath("architecture-identity-001")).toBe(
      "/architecture/architectures/architecture-identity-001/ask",
    );
  });
});
