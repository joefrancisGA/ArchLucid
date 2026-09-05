import { describe, expect, it } from "vitest";

import {
  CAREER_EXPORT_EVAL_SAMPLE_MAX_FINDINGS,
  CAREER_EXPORT_EVAL_SAMPLE_LABEL,
  formatCareerExportFindingInventoryLine,
  resolveCareerExportFindingInventory,
} from "@/lib/career-export-finding-inventory";

describe("career-export-finding-inventory (DA-11)", () => {
  it("marks complete inventories when all findings are included", () => {
    expect(resolveCareerExportFindingInventory({ included: 25, total: 25 }).isComplete).toBe(true);
    expect(formatCareerExportFindingInventoryLine({ included: 25, total: 25, isComplete: true })).toBeNull();
  });

  it("blocks silent completeness when rows are omitted", () => {
    const inventory = resolveCareerExportFindingInventory({ included: 20, total: 25 });

    expect(inventory.isComplete).toBe(false);
    expect(formatCareerExportFindingInventoryLine(inventory)).toBe("This export includes 20 of 25 findings");
  });

  it("keeps eval sample cap at 20 with explicit sample labeling constant", () => {
    expect(CAREER_EXPORT_EVAL_SAMPLE_MAX_FINDINGS).toBe(20);
    expect(CAREER_EXPORT_EVAL_SAMPLE_LABEL).toContain("Sample");
  });
});
