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

describe("help-markdown-presentation (leakage 4)", () => {
  it("preserves maintenance metadata for developer-audience help topics", () => {
    const source = "**Last reviewed:** 2026-06-06\n\nEngineering notes.";
    const prepared = prepareHelpMarkdownForPresentation(source, "docs/library/CLI_USAGE.md", {
      preserveMaintenanceMetadata: true,
      helpTopicSlug: "cli-usage",
    });

    expect(prepared).toContain("**Last reviewed:** 2026-06-06");
  });
  it("stripInternalBuyerHelpPreamble drops scripts/ci fences whole-block without empty fences", () => {
    const source = [
      "Lead-in before fence.",
      "",
      "```bash",
      "python scripts/ci/check_proof_summary_promise_language.py sample.md",
      "```",
      "",
      "```bash",
      "archlucid health",
      "```",
      "",
      "Trailing copy.",
    ].join("\n");

    const stripped = stripInternalBuyerHelpPreamble(source);

    expect(stripped).not.toContain("scripts/ci/");
    expect(stripped).not.toMatch(/```[^\n]*\n```/);
    expect(stripped).toContain("archlucid health");
    expect(stripped).toContain("Trailing copy.");
  });
  it("cli-usage presentation strips vendor-internal leakage and staging hosts", () => {
    const loaded = tryLoadProductDocumentation("cli-usage");

    expect(loaded).not.toBeNull();

    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, "docs/library/CLI_USAGE.md", {
      helpTopicSlug: "cli-usage",
      preserveMaintenanceMetadata: true,
    });

    expect(prepared.toLowerCase()).not.toContain("staging.archlucid.net");
    expect(prepared).not.toContain("Partner Center");
    expect(prepared).not.toContain("dbo.");
    expect(prepared).not.toContain("C:\\ArchLucid");
    expect(prepared.toLowerCase()).not.toContain("owner approval");
    expect(prepared).not.toContain("proof-packet gtm guardrails");
    expect(prepared.toLowerCase()).not.toContain("marketplace preflight");
    expect(prepared).toMatch(/https:\/\/<your-archlucid-host>/);
    expect(prepared).toContain("creates a new tenant");
    expect(prepared).not.toMatch(/```[^\n]*\n```/);
  });
  it("help topics do not retain empty fenced code blocks after presentation prep", () => {
    for (const topic of HELP_TOPICS) {
      const loaded = tryLoadProductDocumentation(topic.id);

      if (loaded === null) {
        continue;
      }

      const sourcePath = loaded.entry.sourcePaths[0] ?? "";
      const prepared = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
        helpTopicSlug: topic.id,
      });

      expect(prepared, topic.id).not.toMatch(/```[^\n]*\n```/);
    }
  });
  it("stripDocumentationMaintenanceMetadata leaves fenced code unchanged", () => {
    const input = "```bash\nLast reviewed: 2026-01-01\n```\n\n**Last reviewed:** 2026-06-06";
    const stripped = stripDocumentationMaintenanceMetadata(input);

    expect(stripped).toContain("```bash\nLast reviewed: 2026-01-01\n```");
    expect(stripped.toLowerCase()).not.toContain("**last reviewed:**");
  });
  it("applies review-package product language and migrates legacy /runs/ links", () => {
    const source =
      "An empty artifact list can be valid: manifest exists but none stored for that manifest. See [/runs/new](/runs/new).";
    const prepared = prepareHelpMarkdownForPresentation(source, "docs/library/operator-shell.md");

    expect(prepared).toContain("review exists");
    expect(prepared).toContain("](/architecture/reviews/new)");
    expect(prepared.includes("manifest exists")).toBe(false);
    expect(prepared.includes("/runs/")).toBe(false);
  });
  it("rewrites legacy manifest/run jargon during help presentation", () => {
    const source =
      "manifest exists for that manifest; golden manifest summary; RunId=abc; run not ready for commit; open /runs/abc.";
    const prepared = prepareHelpMarkdownForPresentation(source, "docs/runbooks/TROUBLESHOOTING.md").toLowerCase();

    expect(prepared).toContain("reviewid=abc");
    expect(prepared).toContain("/architecture/reviews/abc");
    expect(prepared).toContain("signed review record");
    expect(prepared).toContain("review not ready to finalize");
    for (const pattern of HELP_TOPIC_BANNED_COPY_PATTERNS) {
      expect(prepared, `should not contain "${pattern}"`).not.toContain(pattern);
    }
  });
});
