import { describe, expect, it } from "vitest";

import { formatHelpTopicApplicabilityMetadata } from "@/lib/help/help-topic-applicability-metadata";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

function sampleEntry(
  overrides: Partial<ProductDocumentationEntry> = {},
): ProductDocumentationEntry {
  return {
    slug: "azure-boards",
    title: "Azure Boards integration",
    summary: "Summary",
    audience: "operator",
    sourcePaths: ["docs/library/customer-facing/AZURE_BOARDS_INTEGRATION.md"],
    contentKind: "product-help",
    pdfStatus: "public",
    ...overrides,
  };
}

describe("formatHelpTopicApplicabilityMetadata", () => {
  it("returns null for topics outside report-a-problem and guide review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          lastReviewed: "2026-08-09",
          releaseApplicability: "Azure Boards work item connector",
        }),
      ),
    ).toBeNull();
  });

  it("formats architecture scorecard help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "architecture-scorecard",
          lastReviewed: "2026-08-12",
          releaseApplicability: "sponsor architecture scorecard orientation",
        }),
      ),
    ).toBe("Last reviewed 2026-08-12 · sponsor architecture scorecard orientation");
  });

  it("formats advisory scans help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "advisory-scans",
          lastReviewed: "2026-08-13",
          releaseApplicability: "governance advisory scans orientation",
        }),
      ),
    ).toBe("Last reviewed 2026-08-13 · governance advisory scans orientation");
  });

  it("formats baseline settings help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "baseline-settings",
          lastReviewed: "2026-08-13",
          releaseApplicability: "administration baseline settings orientation",
        }),
      ),
    ).toBe("Last reviewed 2026-08-13 · administration baseline settings orientation");
  });

  it("formats ai usage help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "ai-usage",
          lastReviewed: "2026-08-13",
          releaseApplicability: "Administration · AI usage orientation",
        }),
      ),
    ).toBe("Last reviewed 2026-08-13 · Administration · AI usage orientation");
  });

  it("formats architecture intelligence help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "architecture-intelligence",
          lastReviewed: "2026-08-13",
          releaseApplicability: "architecture intelligence orientation",
        }),
      ),
    ).toBe("Last reviewed 2026-08-13 · architecture intelligence orientation");
  });

  it("formats architecture drafts help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "architecture-drafts",
          lastReviewed: "2026-08-13",
          releaseApplicability: "architecture drafts orientation",
        }),
      ),
    ).toBe("Last reviewed 2026-08-13 · architecture drafts orientation");
  });

  it("formats connection status help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "connection-status",
          lastReviewed: "2026-08-12",
          releaseApplicability: "administration connection status orientation",
        }),
      ),
    ).toBe("Last reviewed 2026-08-12 · administration connection status orientation");
  });

  it("formats contact support help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "contact-support",
          lastReviewed: "2026-08-13",
          releaseApplicability: "in-product support discovery and escalation paths",
        }),
      ),
    ).toBe("Last reviewed 2026-08-13 · in-product support discovery and escalation paths");
  });

  it("returns null when report-a-problem registry metadata is absent", () => {
    expect(formatHelpTopicApplicabilityMetadata(sampleEntry({ slug: "report-a-problem" }))).toBeNull();
  });

  it("formats report-a-problem applicability without review dates", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "report-a-problem",
          lastReviewed: "2026-08-11",
          releaseApplicability: "Applies to in-product support intake",
        }),
      ),
    ).toBe("Applies to in-product support intake");
  });

  it("returns null for repeat-review-loop even when registry metadata exists", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "repeat-review-loop",
          lastReviewed: "2026-07-27",
          releaseApplicability: "Compare two reviews and Validate review workspace tools",
        }),
      ),
    ).toBeNull();
  });
});
