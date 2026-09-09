import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_LINE,
  formatArchitectureInventoryEstateGapCareerExportMarkdown,
  formatArchitectureInventoryUnboundEstateGapLine,
  resolveArchitectureInventoryEstateGapState,
} from "@/lib/architecture/architecture-inventory-estate-gap-copy";

describe("architecture-inventory-estate-gap-copy (AS-051)", () => {
  it("labels unbound architectures with the estate gap line", () => {
    expect(
      formatArchitectureInventoryUnboundEstateGapLine({
        architectureId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        isBound: false,
      }),
    ).toBe(ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_LINE);
  });

  it("does not imply all-clear when bound or unknown", () => {
    expect(resolveArchitectureInventoryEstateGapState({ isBound: true })).toBe("bound");
    expect(formatArchitectureInventoryUnboundEstateGapLine({ isBound: true })).toBeNull();
    expect(formatArchitectureInventoryUnboundEstateGapLine(null)).toBeNull();
    expect(formatArchitectureInventoryUnboundEstateGapLine(undefined)).toBeNull();
  });

  it("includes the estate gap in career export markdown when inventory is unbound", () => {
    const markdown = formatArchitectureInventoryEstateGapCareerExportMarkdown(false);

    expect(markdown).toContain(ARCHITECTURE_INVENTORY_UNBOUND_ESTATE_GAP_LINE);
    expect(markdown).toContain("## Inventory estate");
  });

  it("omits career export estate gap markdown when bound or not applicable", () => {
    expect(formatArchitectureInventoryEstateGapCareerExportMarkdown(true)).toBe("");
    expect(formatArchitectureInventoryEstateGapCareerExportMarkdown(null)).toBe("");
    expect(formatArchitectureInventoryEstateGapCareerExportMarkdown(undefined)).toBe("");
  });
});
