import { describe, expect, it } from "vitest";

import {
  formatHelpTopicApplicabilityMetadata,
  HELP_TOPIC_GUIDE_REVIEW_PROVENANCE_SLUGS,
  isRawInternalGuideReviewApplicability,
} from "@/lib/help/help-topic-applicability-metadata";
import { getProductDocumentationEntry, type ProductDocumentationEntry } from "@/lib/product-documentation-registry";

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
    ).toBe("Guide last reviewed 2026-08-12");
  });

  it("formats advisory scans help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "advisory-scans",
          lastReviewed: "2026-08-13",
          releaseApplicability: "advisory scans orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13");
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
    ).toBe("Guide last reviewed 2026-08-13");
  });

  it("formats decision register help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "decision-register",
          lastReviewed: "2026-08-13",
          releaseApplicability: "decision register orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13");
  });

  it("formats evidence graph help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "evidence-graph",
          lastReviewed: "2026-08-13",
          releaseApplicability: "insights evidence graph orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13");
  });

  it("formats impact preview help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "impact-preview",
          lastReviewed: "2026-08-13",
          releaseApplicability: "insights impact preview orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13");
  });

  it("formats improvement planning help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "improvement-planning",
          lastReviewed: "2026-08-13",
          releaseApplicability: "insights improvement planning orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13");
  });

  it("formats jira integration help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "jira-integration",
          lastReviewed: "2026-08-13",
          releaseApplicability: "integrations jira orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13");
  });

  it("formats slack integration help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "slack-integration",
          lastReviewed: "2026-08-13",
          releaseApplicability: "integrations slack notifications orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13");
  });

  it("formats teams integration help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "teams-integration",
          lastReviewed: "2026-08-13",
          releaseApplicability: "integrations teams notifications orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13");
  });

  it("formats standards and rules help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "standards-and-rules",
          lastReviewed: "2026-08-13",
          releaseApplicability: "Policy resolution, enforced rules, and diagnostic export",
        }),
      ),
    ).toBe(
      "Guide last reviewed 2026-08-13 · Policy resolution, enforced rules, and diagnostic export",
    );
  });

  it("formats model policy help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "model-governance",
          lastReviewed: "2026-08-13",
          releaseApplicability: "administration model approval orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13");
  });

  it("formats notifications help review provenance", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "notifications",
          lastReviewed: "2026-08-13",
          releaseApplicability: "administration notifications orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13");
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
    ).toBe("Guide last reviewed 2026-08-13 · Administration · AI usage orientation");
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
    ).toBe("Guide last reviewed 2026-08-13");
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
    ).toBe("Guide last reviewed 2026-08-13");
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
    ).toBe("Guide last reviewed 2026-08-12");
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
    ).toBe("Guide last reviewed 2026-08-13 · in-product support discovery and escalation paths");
  });

  it("formats workspace settings help review provenance with humanized applicability", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "workspace-settings",
          lastReviewed: "2026-08-13",
          releaseApplicability: "Administration · Workspace settings orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13 · Administration · Workspace settings orientation");
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

  it("formats servicenow integration help review provenance with humanized applicability", () => {
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "servicenow-integration",
          lastReviewed: "2026-08-13",
          releaseApplicability: "Integrations · ServiceNow orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13 · Integrations · ServiceNow orientation");
  });

  it("omits raw internal taxonomy tokens from guide review provenance", () => {
    expect(isRawInternalGuideReviewApplicability("integrations servicenow orientation")).toBe(true);
    expect(isRawInternalGuideReviewApplicability("Integrations · ServiceNow orientation")).toBe(false);
    expect(
      formatHelpTopicApplicabilityMetadata(
        sampleEntry({
          slug: "servicenow-integration",
          lastReviewed: "2026-08-13",
          releaseApplicability: "integrations servicenow orientation",
        }),
      ),
    ).toBe("Guide last reviewed 2026-08-13");
  });

  it("never surfaces raw internal taxonomy tokens for guide review provenance slugs", () => {
    for (const slug of HELP_TOPIC_GUIDE_REVIEW_PROVENANCE_SLUGS) {
      const entry = getProductDocumentationEntry(slug);

      if (entry === undefined) {
        continue;
      }

      const formatted = formatHelpTopicApplicabilityMetadata(entry);

      if (formatted === null) {
        continue;
      }

      const applicabilityPart = formatted.includes(" · ")
        ? formatted.split(" · ").slice(1).join(" · ")
        : "";

      if (applicabilityPart.length > 0) {
        expect(
          isRawInternalGuideReviewApplicability(applicabilityPart),
          `formatted provenance for ${slug} must not include raw taxonomy tokens`,
        ).toBe(false);
      }
    }
  });
});
