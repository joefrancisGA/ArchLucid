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
