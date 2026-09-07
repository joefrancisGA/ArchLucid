import { describe, expect, it, vi } from "vitest";

import {
  PACKAGE_PRINT_BUTTON_LABEL,
  PACKAGE_PRINT_INSTRUCTIONS,
  PACKAGE_PRINT_OPEN_LABEL,
  PACKAGE_PRINT_PAGE_TITLE,
  buildPackagePrintBackHref,
  buildPackagePrintFindingsSummary,
  buildPackagePrintPath,
  buildPackagePrintPresentation,
  buildPackagePrintSponsorSynopsis,
  printPackagePage,
  resolvePackagePrintStatusLabel,
} from "@/lib/package-print-view";
import type { RunSummary } from "@/types/authority";

function summary(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "11111111-1111-1111-1111-111111111111",
    projectId: "22222222-2222-2222-2222-222222222222",
    createdUtc: "2026-08-01T12:00:00Z",
    description: "Payments edge architecture",
    displayName: "Payments edge",
    hasGoldenManifest: true,
    findingCount: 3,
    warningCount: 1,
    hasGovernanceWarnings: true,
    ...overrides,
  };
}

describe("package-print-view (TB-2205)", () => {
  it("exposes stable print copy", () => {
    expect(PACKAGE_PRINT_PAGE_TITLE).toBe("Architecture review");
    expect(PACKAGE_PRINT_BUTTON_LABEL).toBe("Print / Save as PDF");
    expect(PACKAGE_PRINT_OPEN_LABEL).toBe("Print / Save as PDF");
    expect(PACKAGE_PRINT_INSTRUCTIONS.toLowerCase()).toContain("print");
    expect(PACKAGE_PRINT_INSTRUCTIONS.toLowerCase()).toContain("not a signed export");
  });

  it("builds print and back hrefs", () => {
    expect(buildPackagePrintPath("abc/def")).toBe("/architecture/reviews/abc%2Fdef/print");
    expect(buildPackagePrintBackHref("abc")).toBe("/architecture/reviews/abc?tab=review-package");
    expect(buildPackagePrintBackHref("abc", "architecture-identity-001")).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/abc?reviewTab=review-package",
    );
    expect(buildPackagePrintPath("  ")).toBe("/architecture/reviews/print");
  });

  it("resolves status and presentation for a finalized package", () => {
    const presentation = buildPackagePrintPresentation(summary());

    expect(resolvePackagePrintStatusLabel(summary())).toBe("Active");
    expect(presentation.title).toBe("Payments edge");
    expect(presentation.findingsSummary).toContain("3 findings");
    expect(presentation.findingsSummary).toContain("1 warning");
    expect(presentation.sponsorSynopsis).toContain("Sponsor synopsis");
    expect(presentation.sponsorSynopsis).toContain("Payments edge");
  });

  it("omits sponsor synopsis before finalize", () => {
    expect(
      buildPackagePrintSponsorSynopsis(
        summary({ hasGoldenManifest: false, findingCount: 2, warningCount: 0 }),
      ),
    ).toBeNull();
    expect(
      buildPackagePrintFindingsSummary(summary({ hasGoldenManifest: false, findingCount: 2, warningCount: 0 })),
    ).toContain("not finalized");
  });

  it("invokes window.print in the browser", () => {
    const printMock = vi.spyOn(window, "print").mockImplementation(() => {});

    printPackagePage();

    expect(printMock).toHaveBeenCalledTimes(1);
    printMock.mockRestore();
  });

  it("CA-41: adds showing N of M when listed findings are fewer than the run total", () => {
    const presentation = buildPackagePrintPresentation(summary({ findingCount: 25 }), {
      findingsListedCount: 20,
    });

    expect(presentation.findingsSummary).toContain("Showing 20 of 25");
    expect(PACKAGE_PRINT_INSTRUCTIONS.toLowerCase()).toContain("not a signed export");
  });
});
