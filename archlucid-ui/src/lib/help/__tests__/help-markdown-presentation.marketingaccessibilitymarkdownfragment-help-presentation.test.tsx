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

describe("MarketingAccessibilityMarkdownFragment help presentation", () => {
  it("renders in-app help links instead of raw markdown paths", () => {
    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody="See [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md)."
        tableCaption="Test table"
        presentation="help"
        sourceDocPath="docs/library/operator-shell.md"
      />,
    );

    expect(screen.getByText(/Product Packaging/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Product Packaging" })).toBeNull();
    expect(screen.queryByText(/\.md/i)).toBeNull();
  });

  it("does not render internal change set labels in help mode", () => {
    const markdownBody = "# Architect workspace map (Change Set 55R)\n\n## What it is\n\nBody copy.";
    const prepared = prepareHelpMarkdownForPresentation(markdownBody, "docs/library/operator-shell.md");
    expect(prepared).toBe("## What it is\n\nBody copy.");

    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody={markdownBody}
        tableCaption="Test table"
        presentation="help"
        sourceDocPath="docs/library/operator-shell.md"
      />,
    );

    expect(screen.queryByText(/Change Set 55R/i)).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "What it is" })).toBeInTheDocument();
  });

  it("routes mermaid fences to the diagram renderer", () => {
    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody={"```mermaid\nflowchart LR\n  A --> B\n```"}
        tableCaption="Test table"
        presentation="help"
      />,
    );

    expect(screen.getByTestId("mermaid-diagram")).toHaveTextContent("flowchart LR");
    expect(screen.queryByRole("button", { name: /copy code/i })).toBeNull();
  });

  it("strips explicit markdown heading anchors from visible help headings", () => {
    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody={`## Workforce SSO {#workforce-sso}

Body copy.`}
        tableCaption="Test table"
        presentation="help"
      />,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Workforce SSO" });

    expect(heading).toHaveAttribute("id", "workforce-sso");
    expect(screen.queryByText(/\{#workforce-sso\}/i)).toBeNull();
  });

  it("strips onboarding hub bullets from enterprise onboarding markdown presentation", () => {
    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody={[
          "## Onboarding hub {#onboarding-hub}",
          "",
          "- **[Configure SSO](#workforce-sso)**",
          "- **[Assign policy packs](#default-policy-packs)**",
          "",
          "## Workforce SSO {#workforce-sso}",
          "",
          "SSO body.",
          "",
          "## Default policy packs {#default-policy-packs}",
          "",
          "Policy body.",
        ].join("\n")}
        tableCaption="Enterprise onboarding checklist reference table"
        presentation="help"
        sourceDocPath="docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md"
      />,
    );

    expect(screen.queryByRole("link", { name: "Configure SSO" })).toBeNull();
    expect(screen.queryByRole("heading", { level: 2, name: "Onboarding hub" })).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Workforce SSO" })).toHaveAttribute("id", "workforce-sso");
  });

  it("renders internal operator settings links from help markdown", () => {
    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody="Open [`/integrations/cloud-connections`](/integrations/cloud-connections)."
        tableCaption="Test table"
        presentation="help"
        sourceDocPath="docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md"
      />,
    );

    expect(screen.getByRole("link", { name: "Cloud Connections" })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
  });

  it("gives each scrollable help table region a unique landmark name", () => {
    const markdownBody = [
      "## Commands",
      "",
      "| Command | Scope |",
      "| --- | --- |",
      "| run | ExecuteAuthority |",
      "",
      "### Diagnose",
      "",
      "| Command | Scope |",
      "| --- | --- |",
      "| health | — |",
    ].join("\n");

    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody={markdownBody}
        tableCaption="CLI usage reference table"
        presentation="help"
        sourceDocPath="docs/library/CLI_USAGE.md"
        helpTopicSlug="cli-usage"
      />,
    );

    expect(screen.getByRole("region", { name: "Scrollable Commands table 1" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("region", { name: "Scrollable Diagnose table 2" })).toHaveAttribute("tabindex", "0");
  });
});
