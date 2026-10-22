import { describe, expect, it } from "vitest";

import {
  INFRA_DIAGRAMS_EXECUTIVE_TIERS,
  formatInfraDiagramsHiddenExecutiveTierKeysForSearch,
  isKnownInfraDiagramsExecutiveTierKey,
  parseInfraDiagramsHiddenExecutiveTierKeysFromSearch,
} from "@/lib/infra-evidence/infra-evidence-diagrams-executive-tiers";

describe("infra-evidence-diagrams-executive-tiers", () => {
  it("defines the four fixed Executive always-show tiers", () => {
    expect(INFRA_DIAGRAMS_EXECUTIVE_TIERS.map((tier) => tier.key)).toEqual([
      "workloads",
      "databases",
      "storage",
      "integration",
    ]);
  });

  it("parses and formats hidden tier keys deterministically", () => {
    expect(parseInfraDiagramsHiddenExecutiveTierKeysFromSearch("storage,workloads,storage,bogus")).toEqual([
      "storage",
      "workloads",
    ]);
    expect(formatInfraDiagramsHiddenExecutiveTierKeysForSearch(["integration", "storage"])).toBe(
      "integration,storage",
    );
    expect(isKnownInfraDiagramsExecutiveTierKey("databases")).toBe(true);
    expect(isKnownInfraDiagramsExecutiveTierKey("containers")).toBe(false);
  });
});
