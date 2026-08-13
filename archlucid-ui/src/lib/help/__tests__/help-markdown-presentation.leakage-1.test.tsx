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
  stripExecutiveSummaryContributorLeakage,
  stripExecutiveSummarySponsorBriefLeakage,
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

describe("help-markdown-presentation (leakage 1)", () => {
  it("resolves in-app help link labels from product documentation titles", () => {
    expect(humanizeMarkdownLinkLabel("DPA_TEMPLATE.md", "/help/dpa-template")).toBe(
      "Data Processing Agreement (template)",
    );
    expect(humanizeMarkdownLinkLabel("Dpa Template", "/help/dpa-template")).toBe(
      "Data Processing Agreement (template)",
    );
  });
  it("resolves relative repo doc paths without node:path", () => {
    expect(resolveRelativeRepoDocPath("../OPERATOR_ATLAS.md", "docs/library/operator-shell.md")).toBe(
      "docs/OPERATOR_ATLAS.md",
    );
    expect(resolveRelativeRepoDocPath("OPERATOR_ATLAS.md", "docs/library/operator-shell.md")).toBe(
      "docs/library/OPERATOR_ATLAS.md",
    );
    expect(resolveRelativeRepoDocPath("docs/START_HERE.md", "docs/library/operator-shell.md")).toBe(
      "docs/START_HERE.md",
    );
  });
  it("rewrites mapped markdown links to in-app help routes", () => {
    const source = "See [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) for details.";
    const rewritten = rewriteHelpMarkdownDocLinks(source, "docs/library/operator-shell.md");

    expect(rewritten).toBe("See Product Packaging for details.");
    expect(rewritten.includes(".md")).toBe(false);
  });
  it("preserves same-page anchor links and internal operator routes", () => {
    const source = [
      "- **[Configure SSO](#workforce-sso)**",
      "- **[Connect Azure securely](/help/cloud-connections/azure)**",
      "- [`/integrations/cloud-connections`](/integrations/cloud-connections)",
    ].join("\n");
    const rewritten = rewriteHelpMarkdownDocLinks(
      source,
      "docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md",
    );

    expect(rewritten).toContain("[Configure SSO](#workforce-sso)");
    expect(rewritten).toContain("[Connect Azure securely](/help/cloud-connections/azure)");
    expect(rewritten).toContain("[Cloud Connections](/integrations/cloud-connections)");
  });
  it("drops unmapped markdown links to plain labels", () => {
    const source = "Contributor note in [BUILD.md](BUILD.md).";
    const rewritten = rewriteHelpMarkdownDocLinks(source, "docs/library/operator-shell.md");

    expect(rewritten).toBe("Contributor note in Build.");
    expect(rewritten.includes(".md")).toBe(false);
  });
  it("sanitizes bare markdown filenames in body copy", () => {
    const source =
      "Long-form tables remain in **OPERATOR_DECISION_GUIDE.md**; see `docs/PRE_COMMIT_GOVERNANCE_GATE.md`.";

    const sanitized = sanitizeBareMarkdownFileReferences(source);

    expect(sanitized).toBe(
      "Long-form tables remain in **Deployment decision guide**; see Pre Commit Governance Gate.",
    );
    expect(sanitized.includes(".md")).toBe(false);
  });
  it("prepares operator-shell excerpts without raw md references", () => {
    const excerpt =
      "**Workspace route map:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md). Onboarding: **[`CORE_PILOT.md`](../CORE_PILOT.md)**.";
    const prepared = prepareHelpMarkdownForPresentation(excerpt, "docs/library/operator-shell.md");

    expect(prepared.includes(".md")).toBe(false);
    expect(prepared).toContain("[Workspace route map](/help/pilot-guide)");
    expect(prepared).toMatch(/\[Your first architecture review\]\(\/help\/first-architecture-review\)/);
  });
  it("strips markdown horizontal rules from prepared help copy", () => {
    const prepared = prepareHelpMarkdownForPresentation(
      "## Section\n\n---\n\nParagraph.",
      "docs/CORE_PILOT.md",
    );

    expect(prepared).not.toMatch(/^---$/m);
    expect(prepared).toContain("## Section");
  });
  it("omits Testing and marketing sections from configuration reference presentation (TB-1327)", () => {
    const source = [
      "## Testing (non-production)",
      "",
      "| `ArchLucid:Testing:SimulateLlmBudgetExhausted` | demo |",
      "",
      "## Public marketing site (`archlucid-ui`, build-time)",
      "",
      "see **TB-019** / **TB-020**",
      "",
      "## Hosting roles",
      "",
      "Api / Worker / Combined",
    ].join("\n");

    const prepared = stripConfigurationReferenceContributorSections(source);

    expect(prepared.toLowerCase()).not.toContain("testing (non-production)");
    expect(prepared.toLowerCase()).not.toContain("public marketing site");
    expect(prepared).toContain("## Hosting roles");
    expect(prepared).not.toContain("SimulateLlmBudgetExhausted");
  });
  it("omits tenant provisioning from enterprise onboarding presentation (TB-1339)", () => {
    const source = [
      "## Tenant provisioning {#tenant-provisioning}",
      "",
      "| Create tenant row | ArchLucid | Tenant GUID |",
      "",
      "## Workforce SSO {#workforce-sso}",
      "",
      "Choose SAML or OIDC JwtBearer.",
    ].join("\n");

    const prepared = stripEnterpriseOnboardingContributorSections(source);

    expect(prepared.toLowerCase()).not.toContain("tenant provisioning");
    expect(prepared).not.toContain("Tenant GUID");
    expect(prepared).toContain("## Workforce SSO");
  });
  it("strips duplicate Quick links blockquote from enterprise onboarding presentation", () => {
    const source = [
      "> **Quick links**",
      ">",
      "> - **[Configure SSO](#workforce-sso)**",
      "",
      "---",
      "",
      "## Onboarding hub {#onboarding-hub}",
      "",
      "- **[Configure SSO](#workforce-sso)**",
      "",
      "## Sign-in models {#sign-in-models}",
      "",
      "Body.",
    ].join("\n");

    const prepared = stripEnterpriseOnboardingQuickLinksBlock(
      stripEnterpriseOnboardingContributorSections(source),
    );

    expect(prepared).not.toContain("**Quick links**");
    expect(prepared).not.toContain("## Onboarding hub");
    expect(prepared).toContain("## Sign-in models");
  });
  it("omits sign-off section from enterprise onboarding presentation", () => {
    const source = [
      "## Azure cloud evidence connection {#azure-cloud-evidence-connection}",
      "",
      "Body.",
      "",
      "## Sign-off {#sign-off}",
      "",
      "| Role | Name | Date | Signature |",
      "| Customer technical owner | | | |",
    ].join("\n");

    const prepared = stripEnterpriseOnboardingContributorSections(source);

    expect(prepared.toLowerCase()).not.toContain("sign-off");
    expect(prepared).toContain("## Azure cloud evidence connection");
  });
  it("strips CLI collectors and eng jargon from evaluator workbook (TB-1346)", () => {
    const source = [
      "Evidence | Tier-1 cloud inventory ZIP",
      "",
      "<details>",
      "<summary>Administrator details — CLI and proof collectors</summary>",
      "",
      "./scripts/collect-first-pilot-proof.ps1",
      "dotnet run --project ArchLucid.Cli -- try",
      "",
      "</details>",
      "",
      "Stop when PilotStrict signals are unresolved.",
      "",
      "Run the authority pipeline, then use [`SECOND_RUN.md`](../library/SECOND_RUN.md).",
    ].join("\n");

    const prepared = stripEvaluatorWorkbookContributorLeakage(source);

    expect(prepared).not.toContain("collect-first-pilot-proof");
    expect(prepared).not.toContain("ArchLucid.Cli");
    expect(prepared).not.toContain("Tier-1");
    expect(prepared).toContain("optional cloud inventory");
    expect(prepared).not.toContain("PilotStrict");
    expect(prepared).toContain("strict AI quality checks");
    expect(prepared).not.toContain("authority pipeline");
    expect(prepared).toContain("architecture analysis");
    expect(prepared).toContain("/help/repeat-review-loop");
    expect(prepared).not.toContain("SECOND_RUN.md");
  });
  it("omits CI and PR checklist sections from governance API contracts presentation (TB-1388)", () => {
    const source = [
      "## API versioning",
      "",
      "Use `/v1/...` paths.",
      "",
      "## Contract surface and CI controls",
      "",
      "OpenApiContractSnapshotTests and ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1",
      "",
      "## Deprecation policy",
      "",
      "Respect Sunset headers.",
      "",
      "## Changing the HTTP contract (PR checklist)",
      "",
      "Regenerate ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json",
      "",
      "## Run DTO shapes under `/v1`",
      "",
      "Two JSON shapes.",
    ].join("\n");

    const prepared = stripGovernanceApiContractsContributorSections(source);

    expect(prepared.toLowerCase()).not.toContain("contract surface and ci controls");
    expect(prepared.toLowerCase()).not.toContain("changing the http contract");
    expect(prepared).toContain("## API versioning");
    expect(prepared).toContain("## Deprecation policy");
    expect(prepared).toContain("## Run DTO shapes");
    expect(prepared).not.toContain("OpenApiContractSnapshotTests");
  });
  it("strips OpenAPI snapshot, runbook, and TB leakage from governance API contracts (TB-1388)", () => {
    const source = [
      "Spine: START_HERE.md",
      "",
      "Wired in ArchLucid.Api/Startup/MvcExtensions.cs (TB-286).",
      "",
      "Runbook: docs/runbooks/TROUBLESHOOTING.md",
      "",
      "Bruno: contracts/bruno/",
      "",
      "CI: scripts/ci/check_v1_integration_starter_contracts.py",
    ].join("\n");

    const prepared = stripGovernanceApiContractsContributorLeakage(source);

    expect(prepared).not.toMatch(/\bTB-\d+\b/i);
    expect(prepared).not.toContain("START_HERE.md");
    expect(prepared).not.toContain("ArchLucid.Api/");
    expect(prepared).not.toContain("docs/runbooks/");
    expect(prepared).not.toContain("contracts/bruno");
    expect(prepared).not.toContain("scripts/ci/");
    expect(prepared).toContain("API host configuration");
    expect(prepared).not.toContain("Runbook:");
    expect(prepared).not.toContain("TROUBLESHOOTING");
  });
  it("strips contributor spine and eng doc leakage from pilot ROI measurement (TB-1390)", () => {
    const source = [
      "Spine: START_HERE.md",
      "",
      "Related: V1_SCOPE.md, CORE_PILOT.md, OPERATOR_DECISION_GUIDE.md",
      "",
      "Archive: archive/gtm-internal/pmf-tracker.md",
      "",
      "Alias for product formatters, CLI copy, and CI strings that cite bare PILOT_ROI_MODEL.md.",
    ].join("\n");

    const prepared = stripPilotRoiModelContributorLeakage(source);

    expect(prepared).not.toMatch(/\bTB-\d+\b/i);
    expect(prepared).not.toContain("START_HERE.md");
    expect(prepared).not.toContain("V1_SCOPE.md");
    expect(prepared).not.toContain("CORE_PILOT.md");
    expect(prepared).not.toContain("REPOSITORY_README");
    expect(prepared).not.toContain("archive/gtm-internal");
    expect(prepared).not.toContain("CLI copy");
    expect(prepared).not.toContain("CI strings");
  });
  it("rewrites pilot ROI model scorecard links to in-app help (TB-1390)", () => {
    const source = [
      "Scorecard: [Pilot success scorecard](../go-to-market/PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement).",
      "",
      "TCO: [ROI model](../go-to-market/ROI_MODEL.md).",
    ].join("\n");

    const prepared = prepareHelpMarkdownForPresentation(source, "docs/library/PILOT_ROI_MODEL.md");

    expect(prepared).toContain("/help/executive-summary#pilot-roi-measurement");
    expect(prepared.toLowerCase()).not.toContain("docs/go-to-market");
  });
  it("omits habit-loop validation and recommended-loop prose from repeat-review help (TB-1396 / TB-1398)", () => {
    const source = [
      "## Recommended loop (after first finalize)",
      "",
      "Compare two packages.",
      "",
      "## Second-review habit loop validation",
      "",
      "collect-first-pilot-proof.ps1 and fixtures/second-review",
      "",
      "## Related help",
      "",
      "See comparison replay.",
    ].join("\n");

    const prepared = stripRepeatReviewLoopContributorSections(source);

    expect(prepared.toLowerCase()).not.toContain("second-review habit loop validation");
    expect(prepared.toLowerCase()).not.toContain("recommended loop");
    expect(prepared.toLowerCase()).not.toContain("## related help");
    expect(prepared).not.toContain("collect-first-pilot-proof");
  });
  it("strips CLI proof scripts and eng doc leakage from repeat-review help (TB-1396)", () => {
    const source = [
      "**Prerequisite:** [Core pilot](../CORE_PILOT.md)",
      "",
      "<details>",
      "<summary>Administrator details — API and CLI surfaces</summary>",
      "",
      "| Compare | API_CONTRACTS.md |",
      "",
      "```powershell",
      "./scripts/collect-first-pilot-proof.ps1 -RunNumber 2",
      "```",
      "",
      "</details>",
      "",
      "Also see PRODUCT_LEARNING.md and TB-227.",
    ].join("\n");

    const prepared = stripRepeatReviewLoopContributorLeakage(source);

    expect(prepared).not.toMatch(/\bTB-\d+\b/i);
    expect(prepared).not.toContain("collect-first-pilot-proof");
    expect(prepared).not.toContain("API_CONTRACTS.md");
    expect(prepared).not.toContain("CORE_PILOT.md");
    expect(prepared).not.toContain("PRODUCT_LEARNING");
    expect(prepared).not.toContain("<details>");
  });
  it("rewrites repeat-review policy and scorecard links to in-app help (TB-1396)", () => {
    const source = [
      "Dry-run: [`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md).",
      "",
      "Scorecard: [`PILOT_SUCCESS_SCORECARD.md`](../go-to-market/PILOT_SUCCESS_SCORECARD.md).",
    ].join("\n");

    const prepared = prepareHelpMarkdownForPresentation(source, "docs/library/REPEAT_REVIEW_LOOP.md");

    expect(prepared).toContain("/help/governance-approval");
    expect(prepared).toContain("/help/pilot-guide");
    expect(prepared.toLowerCase()).not.toContain("docs/go-to-market");
  });
  it("omits policy-pack and canonical reference sections from accelerator chooser help (TB-1606)", () => {
    const source = [
      "## How to start in the architect workspace",
      "",
      "Pick one row from the table.",
      "",
      "## Policy packs (governance templates)",
      "",
      "POLICY_PACK_DRY_RUN_INDEX.md and DEFAULT_POLICY_PACKS_V1.md",
      "",
      "## Canonical references",
      "",
      "templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md",
      "",
      "**Out of scope for all V1-ready packs:** live Stripe checkout.",
    ].join("\n");

    const prepared = stripAcceleratorChooserContributorSections(source);

    expect(prepared.toLowerCase()).not.toContain("## policy packs");
    expect(prepared.toLowerCase()).not.toContain("## canonical references");
    expect(prepared).toContain("## How to start in the architect workspace");
    expect(prepared).not.toContain("**Out of scope for all V1-ready packs:**");
    expect(prepared).not.toContain("POLICY_PACK_DRY_RUN_INDEX");
  });
  it("omits GTM out-of-scope roadmap copy from accelerator chooser help presentation", () => {
    const source = [
      "## Canonical references",
      "",
      "templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md",
      "",
      "**Out of scope for all V1-ready packs:** live Stripe checkout.",
    ].join("\n");

    const prepared = stripAcceleratorChooserContributorSections(source);

    expect(prepared).not.toContain("**Out of scope for all V1-ready packs:**");
    expect(prepared).not.toContain("live Stripe checkout");
    expect(prepared).not.toContain("STARTER_PROOF_PACK_CHOOSER");
  });
});
