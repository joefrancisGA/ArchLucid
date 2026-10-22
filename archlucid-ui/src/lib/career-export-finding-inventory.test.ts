import { describe, expect, it } from "vitest";

import {
  CAREER_EXPORT_EVAL_SAMPLE_MAX_FINDINGS,
  CAREER_EXPORT_EVAL_SAMPLE_LABEL,
  countCareerExportEligibleFindings,
  formatCareerExportFindingInventoryLine,
  resolveCareerExportFindingInventory,
  resolveCareerExportFindingInventoryForExport,
  resolveCareerExportMaxFindings,
} from "@/lib/career-export-finding-inventory";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

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

  it("CA-41: Working career export with 25 eligible findings is complete when uncapped", () => {
    const findings = Array.from({ length: 25 }, (_, index) => ({
      findingId: `f-${index}`,
      title: `Finding ${index}`,
    })) as QuickDecisionFinding[];

    expect(countCareerExportEligibleFindings(findings)).toBe(25);
    expect(
      resolveCareerExportFindingInventoryForExport({
        totalEligibleFindings: 25,
        maxFindings: resolveCareerExportMaxFindings({
          workingDesk: true,
          evalSampleExport: false,
        }),
      }).isComplete,
    ).toBe(true);
  });

  it("CA-41: eval sample export caps at 20 and stays labeled incomplete vs total", () => {
    const inventory = resolveCareerExportFindingInventoryForExport({
      totalEligibleFindings: 25,
      maxFindings: resolveCareerExportMaxFindings({
        workingDesk: false,
        evalSampleExport: true,
      }),
    });

    expect(inventory.included).toBe(20);
    expect(inventory.total).toBe(25);
    expect(inventory.isComplete).toBe(false);
    expect(formatCareerExportFindingInventoryLine(inventory)).toBe("This export includes 20 of 25 findings");
  });
});
