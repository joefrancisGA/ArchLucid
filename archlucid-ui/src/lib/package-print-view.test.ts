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
  formatPackagePrintDraftSynopsisBody,
  resolvePackagePrintSynopsisBody,
  resolvePackagePrintSynopsisHeading,
  printPackagePage,
  resolvePackagePrintSemanticSupportBandStampLine,
  resolvePackagePrintStatusLabel,
} from "@/lib/package-print-view";
import { FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
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
    expect(buildPackagePrintBackHref("abc")).toBe("/architecture/reviews/abc?reviewTab=review-package");
    expect(buildPackagePrintPath("  ")).toBe("/architecture/reviews/print");
  });

  it("labels omitted governance warning flags on finalized print status (P-09)", () => {
    expect(
      resolvePackagePrintStatusLabel(
        summary({ hasGovernanceWarnings: undefined }),
      ),
    ).toBe("Finalized. Governance warning flags were not stored.");
    expect(resolvePackagePrintStatusLabel(summary({ hasGovernanceWarnings: false }))).toBe("Finalized");
  });

  it("resolves status and presentation for a finalized package", () => {
    const presentation = buildPackagePrintPresentation(summary());

    expect(resolvePackagePrintStatusLabel(summary())).toBe("Finalized. Governance warnings were stored.");
    expect(presentation.title).toBe("Payments edge");
    expect(presentation.findingsSummary).toContain("3 findings");
    expect(presentation.findingsSummary).toContain("1 warning");
    expect(presentation.sponsorSynopsis).toContain("Sponsor synopsis");
    expect(presentation.sponsorSynopsis).toContain("Payments edge");
  });

  it("includes finding count omission in findings summary when count is missing", () => {
    const line = buildPackagePrintFindingsSummary(summary({ findingCount: null, warningCount: 0 }));

    expect(line).toContain("Finding count was not stored.");
    expect(line).not.toContain("0 findings");
  });

  it("appends warning count omission to findings summary when warning count is missing", () => {
    const line = buildPackagePrintFindingsSummary(summary({ findingCount: 3, warningCount: null }));

    expect(line).toContain("3 findings");
    expect(line).toContain("Warning count was not stored.");
  });

  it("states zero warnings when warning count is stored as zero", () => {
    const line = buildPackagePrintFindingsSummary(summary({ findingCount: 3, warningCount: 0 }));

    expect(line).toContain("3 findings");
    expect(line).toContain("0 warnings were stored.");
    expect(line).not.toContain("Warning count was not stored.");
  });

  it("labels omitted finding and warning counts on sponsor synopsis", () => {
    const synopsis = buildPackagePrintSponsorSynopsis(
      summary({
        findingCount: null,
        warningCount: null,
        displayName: "Payments edge",
      }),
    );

    expect(synopsis).toContain("Finding count was not stored.");
    expect(synopsis).toContain("Warning count was not stored.");
    expect(synopsis).not.toContain("findings are available on the review");
    expect(synopsis).not.toContain("No open approval-check warnings");
  });

  it("keeps no-warnings sentence when warning count is zero", () => {
    const synopsis = buildPackagePrintSponsorSynopsis(summary({ warningCount: 0 }));

    expect(synopsis).toContain("No open approval-check warnings");
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

  it("labels omitted listed finding count without implying full inventory (P-09)", () => {
    const presentation = buildPackagePrintPresentation(summary({ findingCount: 25 }), {
      findingsListedCount: null,
    });

    expect(presentation.findingsSummary).toContain("Listed finding count was not stored.");
    expect(presentation.findingsSummary).not.toContain("Showing 25 of 25");
  });

  it("CA-41: adds showing N of M when listed findings are fewer than the run total", () => {
    const presentation = buildPackagePrintPresentation(summary({ findingCount: 25 }), {
      findingsListedCount: 20,
    });

    expect(presentation.findingsSummary).toContain("Showing 20 of 25");
    expect(PACKAGE_PRINT_INSTRUCTIONS.toLowerCase()).toContain("not a signed export");
  });

  it("resolvePackagePrintSemanticSupportBandStampLine matches stamp counts (AS-071)", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-1",
        title: "Gateway posture",
        recommendation: "Review gateway TLS.",
        severityValue: 3,
        findingOrder: 1,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
        semanticSupportBand: "Supported",
      },
    ];

    const line = resolvePackagePrintSemanticSupportBandStampLine(findings);

    expect(line).toContain("1 Supported");
  });

  it("labels draft working synopsis as not published", () => {
    expect(formatPackagePrintDraftSynopsisBody("Working paragraph.")).toContain("not published");
    expect(formatPackagePrintDraftSynopsisBody(null)).toBe("Draft sponsor synopsis was not stored.");
    expect(resolvePackagePrintSynopsisHeading("Draft")).toContain("draft");
    const body = resolvePackagePrintSynopsisBody({
      title: "Draft",
      statusLabel: "Draft",
      statusKind: "draft",
      findingsSummary: "x",
      sponsorSynopsis: null,
      draftWorkingSynopsisParagraph: "Working paragraph.",
      createdUtc: "2026-01-01T00:00:00Z",
      runId: "r1",
    });

    expect(body).toContain("Working paragraph.");
  });

  it("buildPackagePrintPresentation carries semantic support stamp line", () => {
    const presentation = buildPackagePrintPresentation(summary(), {
      semanticSupportBandStampLine: "Semantic support (decision-grade): 1 Supported",
    });

    expect(presentation.semanticSupportBandStampLine).toContain("1 Supported");
  });
});
