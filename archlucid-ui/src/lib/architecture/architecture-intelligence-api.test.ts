import { describe, expect, it } from "vitest";

import {
  buildArchitectureIntelligenceRunRequest,
  buildArchitectureIntelligenceSourcesFromDraftFields,
  formatArchitectureIntelligenceSpendSummary,
  primaryDescriptionFromSources,
} from "@/lib/architecture/architecture-intelligence-api";

describe("architecture-intelligence-api", () => {
  it("prefers the architecture-description source for the primary text", () => {
    expect(
      primaryDescriptionFromSources([
        { fileName: "other.md", contentType: "text/markdown", content: "secondary" },
        {
          fileName: "architecture-description.txt",
          contentType: "text/plain",
          content: "  primary brief  ",
        },
      ]),
    ).toBe("primary brief");
  });

  it("builds source texts from draft form fields", () => {
    expect(
      buildArchitectureIntelligenceSourcesFromDraftFields({
        systemName: "Claims intake",
        freeTextIntent: "Modernize routing",
        businessOutcome: "Reduce manual work",
      }),
    ).toEqual([
      {
        fileName: "architecture-description.txt",
        contentType: "text/plain",
        content: "System: Claims intake\n\nModernize routing\n\nBusiness outcome: Reduce manual work",
      },
    ]);

    expect(
      buildArchitectureIntelligenceSourcesFromDraftFields({
        systemName: "  ",
        freeTextIntent: "",
        businessOutcome: "",
      }),
    ).toEqual([]);
  });

  it("builds a publish request over hydrated sources", () => {
    const body = buildArchitectureIntelligenceRunRequest({
      architectureDescription: "Updated brief",
      priorities: ["security"],
      runId: "run-1",
      publishToProduct: true,
      reviewTier: "Deep",
      hydratedSourceTexts: [
        {
          fileName: "architecture-description.txt",
          contentType: "text/plain",
          content: "Old brief",
        },
        {
          fileName: "diagram.md",
          contentType: "text/markdown",
          content: "edges",
        },
      ],
    });

    expect(body).toMatchObject({
      publishToProduct: true,
      runId: "run-1",
      reviewTier: "Deep",
      declaredPriorities: ["security"],
    });
    expect(body).not.toHaveProperty("tenantId");
    expect(body.sourceTexts).toEqual([
      {
        fileName: "architecture-description.txt",
        contentType: "text/plain",
        content: "Updated brief",
      },
      {
        fileName: "diagram.md",
        contentType: "text/markdown",
        content: "edges",
      },
    ]);
  });

  it("formats USD spend before token fallback", () => {
    expect(
      formatArchitectureIntelligenceSpendSummary({
        budgetEstimatedCostUsd: 0.42,
        budgetRemainingUsd: 12,
        budgetEstimatedTokens: 100,
        budgetMaxTokens: 1000,
      }),
    ).toBe(" · Estimated cost $0.42 · $12.00 AI budget remaining");

    expect(
      formatArchitectureIntelligenceSpendSummary({
        budgetEstimatedTokens: 100,
        budgetMaxTokens: 1000,
      }),
    ).toBe(" · Est. tokens 100/1000");
  });
});
