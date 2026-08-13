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

describe("help topic product-language drift guards", () => {
  const SCOPED_ARCHITECT_HELP_SLUGS = [
    "troubleshooting",
    "admin-diagnostics",
    "review-guide",
  ] as const;

  it("loads scoped architect help topics without operator persona in prepared copy", () => {
    for (const slug of SCOPED_ARCHITECT_HELP_SLUGS) {
      const loaded = tryLoadProductDocumentation(slug);

      expect(loaded, slug).not.toBeNull();

      const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
      const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath);
      const proseOnly = prepared
        .replace(/\]\(\/help\/[^)]+\)/gi, "]")
        .replace(/`[^`]*`/g, "")
        .toLowerCase();

      expect(proseOnly, slug).not.toMatch(/\boperator\b/);
      expect(proseOnly, slug).not.toContain("runbook");
    }
  });

  it("keeps static help topic catalog free of banned manifest/run fragments", () => {
    for (const topic of HELP_TOPICS) {
      const corpus = [topic.title, topic.summary, ...topic.keywords].join(" ").toLowerCase();

      for (const pattern of HELP_TOPIC_BANNED_COPY_PATTERNS) {
        expect(corpus, `${topic.id} should not contain "${pattern}"`).not.toContain(pattern);
      }

      expect(corpus, `${topic.id} should not contain "operator"`).not.toContain("operator");
    }
  });

  it("keeps generated help search excerpts free of banned manifest/run fragments", () => {
    for (const record of HELP_DOC_SEARCH_RECORDS) {
      const corpus = [record.sectionHeading, record.excerpt].join(" ").toLowerCase();

      for (const pattern of HELP_TOPIC_BANNED_COPY_PATTERNS) {
        expect(corpus, `${record.docPath}#${record.sectionSlug} should not contain "${pattern}"`).not.toContain(
          pattern,
        );
      }
    }
  });

  it("keeps prepared help topics free of product version labels", () => {
    for (const topic of HELP_TOPICS) {
      const loaded = tryLoadProductDocumentation(topic.id);

      if (loaded === null) {
        continue;
      }

      const sourcePath = loaded.entry.sourcePaths[0] ?? "";
      const prepared = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
        helpTopicSlug: topic.id,
        preserveMaintenanceMetadata: loaded.entry.audience === "developer",
      });
      const withoutCodeFences = prepared.replace(/```[\s\S]*?```/g, "");
      const withoutApiPaths = withoutCodeFences.replace(/\/v1\/[^\s)`]*/gi, "");

      expect(withoutApiPaths, topic.id).not.toMatch(/\bV1\b/);
    }
  });
});
