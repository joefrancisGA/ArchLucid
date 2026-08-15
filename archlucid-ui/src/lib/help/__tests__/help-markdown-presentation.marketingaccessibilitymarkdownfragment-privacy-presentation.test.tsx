import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { HELP_DOC_SEARCH_RECORDS } from "@/lib/help/help-index.generated";
import {
  humanizeMarkdownFileReference,
  humanizeMarkdownLinkLabel,
  isDocumentationMaintenanceMetadataLine,
  prepareHelpMarkdownForPresentation,
  resolveRelativeRepoDocPath,
  rewriteHelpMarkdownDocLinks,
  sanitizeBareMarkdownFileReferences,
  alignCaiqSigAssuranceHonesty,
  alignDataHandlingIsolationHonesty,
  stripTenantIsolationContributorLeakage,
  stripDpaTemplateContributorLeakage,
  stripSponsorReportContributorLeakage,
  stripSponsorReportSponsorBriefLeakage,
  stripFirstValue20ContributorLeakage,
  stripPathChooserContributorLeakage,
  stripPilotFeedbackContributorLeakage,
  stripPolicyPackDeltaContributorLeakage,
  stripPriorManifestRetrievalContributorLeakage,
  stripProductOverviewContributorLeakage,
  stripSoc2SelfAssessmentContributorLeakage,
  stripSubprocessorsContributorLeakage,
  alignSubprocessorsResidencyHonesty,
  alignSubprocessorsRegisterProductLanguage,
  stripAcceleratorChooserContributorLeakage,
  stripAcceleratorChooserContributorSections,
  stripAzureBoardsContributorLeakage,
  stripCaiqSigContributorLeakage,
  stripConfigurationReferenceContributorLeakage,
  stripConfigurationReferenceContributorSections,
  stripDocumentationMaintenanceMetadata,
  stripEnterpriseOnboardingContributorLeakage,
  stripEnterpriseOnboardingContributorSections,
  stripEnterpriseOnboardingQuickLinksBlock,
  stripEvaluatorWorkbookContributorLeakage,
  stripGovernanceApiContractsContributorLeakage,
  stripGovernanceApiContractsContributorSections,
  stripPilotRoiModelContributorLeakage,
  stripRepeatReviewLoopContributorLeakage,
  stripRepeatReviewLoopContributorSections,
  stripInternalBuyerHelpPreamble,
  stripTrustCenterContributorLeakage,
} from "@/lib/help/help-markdown-presentation";
import { HELP_TOPIC_BANNED_COPY_PATTERNS } from "@/lib/help/help-product-language";
import { tryLoadFoldedInternalRunbook, tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { HELP_TOPICS } from "@/lib/help/help-topics";

describe("MarketingAccessibilityMarkdownFragment privacy presentation", () => {
  it("gives each scrollable table region a unique landmark name", () => {
    const markdownBody = [
      "| A | B |",
      "| --- | --- |",
      "| 1 | 2 |",
      "",
      "| C | D |",
      "| --- | --- |",
      "| 3 | 4 |",
    ].join("\n");

    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody={markdownBody}
        tableCaption="ArchLucid privacy policy details"
        presentation="privacy"
      />,
    );

    expect(screen.getByRole("region", { name: "Scrollable comparison table 1" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Scrollable comparison table 2" })).toBeInTheDocument();
  });

  it("skips horizontal rules and keeps in-app privacy links clickable", () => {
    const markdownBody = [
      "See the [Data Processing Agreement](/help/dpa-template).",
      "",
      "---",
      "",
      "## 1. Who we are",
      "",
      "Visit the [Trust Center](/trust).",
    ].join("\n");

    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody={markdownBody}
        tableCaption="ArchLucid privacy policy details"
        presentation="privacy"
      />,
    );

    expect(screen.queryByText("---")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Data Processing Agreement" })).toHaveAttribute(
      "href",
      "/help/dpa-template",
    );
    expect(screen.getByRole("link", { name: "Trust Center" })).toHaveAttribute("href", "/trust");
    expect(screen.getByRole("heading", { level: 2, name: "1. Who we are" })).toBeInTheDocument();
  });

  it("rewrites trust-center pen-test lead-in and scalability anchor for security-trust help (HSE P0)", () => {
    const source = [
      "| Scalability | Self-asserted | [V1 scalability and load evidence](#v1-scalability-and-load-evidence) |",
      "",
      "## Third-party engagements",
      "",
      "**V1:** There is **no** awarded third-party penetration-test vendor.",
      "**V1** assurance includes **owner-conducted** testing.",
    ].join("\n");

    const prepared = prepareHelpMarkdownForPresentation(source, "docs/go-to-market/trust-center.md", {
      helpTopicSlug: "security-trust",
    });

    expect(prepared).toContain("/help/security-trust#scalability-and-load-evidence");
    expect(prepared).toMatch(/awarded third-party penetration-test vendor/i);
    expect(prepared).toMatch(/owner-conducted/i);
    expect(prepared).not.toMatch(/\bV1\b/);
    expect(prepared).not.toContain("scripts/ci/");
  });

  it("keeps presented security-trust help buyer-safe (HSE P0)", () => {
    const loaded = tryLoadProductDocumentation("security-trust");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "security-trust",
    }).toLowerCase();

    expect(prepared).not.toContain("check_procurement_pack_index");
    expect(prepared).not.toContain("automated freshness posture");
    expect(prepared).not.toContain("cache-control:");
    expect(prepared).not.toContain("if-none-match");
    expect(prepared).not.toContain("assurance_status_canonical.md");
    expect(prepared).toContain("/help/soc2-self-assessment");
    expect(prepared).toContain("/help/procurement");
    expect(prepared).toContain("#scalability-and-load-evidence");
    expect(prepared).toMatch(/awarded third-party penetration-test vendor/);
    expect(prepared).not.toContain("cache-control:");
  });
});
