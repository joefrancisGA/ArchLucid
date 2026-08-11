import { describe, expect, it } from "vitest";

import { formatHelpTopicApplicabilityMetadata } from "@/lib/help-topic-applicability-metadata";
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
  it("joins last reviewed and release applicability when both are set", () => {
    const label = formatHelpTopicApplicabilityMetadata(
      sampleEntry({
        lastReviewed: "2026-08-09",
        releaseApplicability: "Azure Boards work item connector",
      }),
    );

    expect(label).toBe(
      "Last reviewed 2026-08-09 · Applies to V1 GA — Azure Boards work item connector",
    );
  });

  it("formats policy-packs provenance with V1 GA release applicability", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "policy-packs",
          lastReviewed: "2026-08-09",
          releaseApplicability: "policy pack assignment and conflict resolution",
        }),
      ),
    ).toBe(
      "Last reviewed 2026-08-09 · Applies to V1 GA — policy pack assignment and conflict resolution",
    );
  });

  it("returns null when registry metadata is absent", () => {
    expect(formatHelpTopicApplicabilityMetadata(sampleEntry())).toBeNull();
  });
});
