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
  packagePrintPipelineStageFlagsOmitted,
  buildPackagePrintSponsorSynopsis,
  formatPackagePrintSponsorSynopsisHonestyBody,
  formatPackagePrintDraftSynopsisBody,
  formatPackagePrintCoverageHonestyLine,
  formatPackagePrintCreatedMetadataLine,
  PACKAGE_PRINT_COVERAGE_HONESTY_LINE,
  PACKAGE_PRINT_COVERAGE_HONESTY_STORED_EMPTY,
  PACKAGE_PRINT_CREATED_TIME_NOT_STORED,
  PACKAGE_PRINT_CREATED_TIME_NOT_READABLE,
  PACKAGE_PRINT_CREATED_TIME_STORED_EMPTY,
  resolvePackagePrintSynopsisBody,
  resolvePackagePrintSynopsisHeading,
  printPackagePage,
  resolvePackagePrintSemanticSupportBandDisplayLine,
  resolvePackagePrintSemanticSupportBandStampLine,
  resolvePackagePrintFindingsSnapshotPresent,
  PACKAGE_PRINT_SEMANTIC_SUPPORT_NO_DECISION_GRADE_LINE,
  PACKAGE_PRINT_SEMANTIC_SUPPORT_STAMP_NOT_STORED_LINE,
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

  it("labels omitted vs stored-empty coverage honesty on print (P-19)", () => {
    expect(formatPackagePrintCoverageHonestyLine(null)).toBe(PACKAGE_PRINT_COVERAGE_HONESTY_LINE);
    expect(formatPackagePrintCoverageHonestyLine(undefined)).toBe(PACKAGE_PRINT_COVERAGE_HONESTY_LINE);
    expect(formatPackagePrintCoverageHonestyLine("   ")).toBe(PACKAGE_PRINT_COVERAGE_HONESTY_STORED_EMPTY);
    expect(formatPackagePrintCoverageHonestyLine(" Custom line ")).toBe("Custom line");
  });

  it("labels omitted created time on print metadata (P-19)", () => {
    expect(formatPackagePrintCreatedMetadataLine(null)).toBe(PACKAGE_PRINT_CREATED_TIME_NOT_STORED);
    expect(formatPackagePrintCreatedMetadataLine("   ")).toBe(PACKAGE_PRINT_CREATED_TIME_STORED_EMPTY);
    expect(formatPackagePrintCreatedMetadataLine("not-an-instant")).toBe(
      PACKAGE_PRINT_CREATED_TIME_NOT_READABLE,
    );
  });

  it("does not clamp negative finding counts on print rollup (P-09)", () => {
    const line = buildPackagePrintFindingsSummary(summary({ findingCount: -2, warningCount: 0 }));

    expect(line).toContain("-2 findings");
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
    expect(presentation.sponsorSynopsis).toBeNull();
    expect(resolvePackagePrintSynopsisBody(presentation)).toContain(
      "A stored sponsor synopsis was not on this print.",
    );
    expect(resolvePackagePrintSynopsisBody(presentation)).toContain("Payments edge");
    expect(resolvePackagePrintSynopsisBody(presentation)).not.toContain(
      "Sponsor synopsis for",
    );
  });

  it("includes finding count omission in package print rollup when count is missing (P-01)", () => {
    const line = buildPackagePrintFindingsSummary(summary({ findingCount: null, warningCount: 0 }));

    expect(line).toContain("Finding count was not stored.");
    expect(line).not.toContain("0 findings");
    expect(line).not.toContain("Included in the finalized architecture review.");
    expect(line).toContain("Package is finalized.");
  });

  it("labels omitted snapshot flags as package status not stored (P-11)", () => {
    expect(
      resolvePackagePrintStatusLabel(
        summary({
          hasGoldenManifest: undefined,
          hasFindingsSnapshot: undefined,
          hasGraphSnapshot: undefined,
          hasContextSnapshot: undefined,
        }),
      ),
    ).toBe("Review status was not stored.");
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

  it("resolvePackagePrintSynopsisBody uses stored warning count when available (P-15)", () => {
    const body = resolvePackagePrintSynopsisBody(
      buildPackagePrintPresentation(summary({ findingCount: 2, warningCount: 1 })),
    );

    expect(body).toContain("1 approval-check warning on this summary.");
    expect(body).not.toContain("Warning count was not stored on this print view.");
  });

  it("labels omitted finding and warning counts on sponsor synopsis honesty body", () => {
    const body = formatPackagePrintSponsorSynopsisHonestyBody(
      summary({
        findingCount: null,
        warningCount: null,
        displayName: "Payments edge",
      }),
    );

    expect(body).toContain("Finding count was not stored.");
    expect(body).toContain("Warning count was not stored.");
    expect(body).not.toContain("Sponsor synopsis for");
  });

  it("records zero warnings on sponsor synopsis honesty body", () => {
    const body = formatPackagePrintSponsorSynopsisHonestyBody(summary({ warningCount: 0 }));

    expect(body).toContain("0 approval-check warnings on this summary.");
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

  it("resolvePackagePrintSemanticSupportBandDisplayLine distinguishes missing stamp from zero decision-grade", () => {
    expect(resolvePackagePrintSemanticSupportBandDisplayLine(null)).toBe(
      PACKAGE_PRINT_SEMANTIC_SUPPORT_STAMP_NOT_STORED_LINE,
    );
    expect(
      resolvePackagePrintSemanticSupportBandDisplayLine(null, {
        findingsSnapshotPresent: true,
        decisionGradeCount: 0,
      }),
    ).toBe(PACKAGE_PRINT_SEMANTIC_SUPPORT_NO_DECISION_GRADE_LINE);
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

  it("surfaces pipeline stage flag omission on print presentation", () => {
    expect(packagePrintPipelineStageFlagsOmitted(summary({ hasGoldenManifest: false }))).toBe(true);

    const presentation = buildPackagePrintPresentation(summary({ hasGoldenManifest: false }));

    expect(presentation.pipelineStageFlagsOmittedLine).toContain("Assessment step flags were not stored");
  });

  it("buildPackagePrintPresentation carries semantic support stamp line", () => {
    const presentation = buildPackagePrintPresentation(summary(), {
      semanticSupportBandStampLine: "Semantic support (decision-grade): 1 Supported",
    });

    expect(presentation.semanticSupportBandStampLine).toContain("1 Supported");
  });

  it("resolvePackagePrintFindingsSnapshotPresent does not treat unknown flags as absent (P-06/P-07)", () => {
    expect(
      resolvePackagePrintFindingsSnapshotPresent(summary({ hasFindingsSnapshot: undefined }), undefined),
    ).toBeUndefined();
    expect(
      resolvePackagePrintFindingsSnapshotPresent(summary({ hasFindingsSnapshot: false }), undefined),
    ).toBe(false);
    expect(
      resolvePackagePrintFindingsSnapshotPresent(summary({ hasFindingsSnapshot: true }), null),
    ).toBe(true);
  });

  it("buildPackagePrintPresentation leaves findings snapshot flag undefined when omitted (P-06/P-07)", () => {
    const presentation = buildPackagePrintPresentation(summary());

    expect(presentation.semanticSupportFindingsSnapshotPresent).toBeUndefined();
  });
});
