import { describe, expect, it } from "vitest";

import type { CitationReference } from "@/types/explanation";

import { formatCitationBuyerDisplay, isOpaqueTechnicalToken } from "@/lib/citation-buyer-display";

describe("isOpaqueTechnicalToken", () => {
  it("detects short opaque ids and full guids", () => {
    expect(isOpaqueTechnicalToken("u0e…")).toBe(true);
    expect(isOpaqueTechnicalToken("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isOpaqueTechnicalToken("Evidence did not surface architecture components")).toBe(false);
  });
});

describe("formatCitationBuyerDisplay", () => {
  const citation: CitationReference = {
    kind: "Finding",
    id: "finding-123",
    label: "Evidence did not surface architecture components — u0e…",
  };

  it("strips opaque suffixes in buyer-polished shells", () => {
    const display = formatCitationBuyerDisplay(citation, true);

    expect(display.headline).toBe("Evidence did not surface architecture components");
    expect(display.technicalId).toBe("finding-123");
  });

  it("states when the citation label was not stored", () => {
    const display = formatCitationBuyerDisplay(
      { kind: "Finding", id: "finding-123", label: "   " },
      false,
    );

    expect(display.headline).toBe("Citation label was not stored.");
  });
});
