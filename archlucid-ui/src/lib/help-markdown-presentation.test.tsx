import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { HELP_DOC_SEARCH_RECORDS } from "@/lib/help-index.generated";
import {
  humanizeMarkdownFileReference,
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
} from "@/lib/help-markdown-presentation";
import { HELP_TOPIC_BANNED_COPY_PATTERNS } from "@/lib/help-product-language";
import { tryLoadFoldedInternalRunbook, tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { HELP_TOPICS } from "@/lib/help-topics";

describe("help-markdown-presentation", () => {
  it("humanizes repo filenames without extensions", () => {
    expect(humanizeMarkdownFileReference("OPERATOR_ATLAS.md")).toBe("Workspace route map");
    expect(humanizeMarkdownFileReference("../runbooks/FIRST_PILOT_OPERATOR_PATH.md")).toBe(
      "First-pilot workspace runbook",
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

  it("omits habit-loop validation section from repeat-review help (TB-1396)", () => {
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
    expect(prepared).toContain("## Recommended loop");
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

  it("strips templates-tree and policy-pack contributor leakage from accelerator chooser help (TB-1606)", () => {
    const source = [
      "Starter packs live under `templates/starter-proof-packs/`.",
      "",
      "Index: POLICY_PACK_METADATA_CONTRACT.md (TB-176)",
      "",
      "Walkthrough: walkthroughs/GOLDEN_ACCELERATOR_WALKTHROUGH.md",
      "",
      "Each pack folder includes `starter-pack.json` with scope notes.",
    ].join("\n");

    const prepared = stripAcceleratorChooserContributorLeakage(source);

    expect(prepared).not.toMatch(/\bTB-\d+\b/i);
    expect(prepared).not.toContain("templates/starter-proof-packs");
    expect(prepared).not.toContain("POLICY_PACK_");
    expect(prepared).not.toContain("walkthroughs/");
    expect(prepared).not.toContain("starter-pack.json");
    expect(prepared).toContain("in-product accelerator packs");
    expect(prepared).toContain("pack manifest");
  });

  it("drops starter-pack markdown tables from accelerator chooser presentation (specialty grid owns packs)", () => {
    const source = [
      "| Buyer job | Starter pack |",
      "| --- | --- |",
      "| Regulated SaaS | [`regulated-saas-soc-procurement`](../../templates/starter-proof-packs/regulated-saas-soc-procurement/) |",
      "",
      "### How to start in the architect workspace",
      "",
      "1. Confirm a Core Pilot finalize exists.",
    ].join("\n");

    const prepared = prepareHelpMarkdownForPresentation(source, "docs/library/ACCELERATOR_CHOOSER.md", {
      helpTopicSlug: "accelerator-chooser",
    });

    expect(prepared).toContain("Confirm a Core Pilot finalize exists");
    expect(prepared).not.toContain("Regulated SaaS");
    expect(prepared.toLowerCase()).not.toContain("templates/starter-proof-packs");
  });

  it("keeps presented accelerator chooser help free of contributor paths and TB IDs (TB-1606)", () => {
    const source = [
      "### How to start in the architect workspace",
      "",
      "See [Your first architecture review](/help/first-architecture-review).",
      "",
      "## Policy packs (governance templates)",
      "",
      "POLICY_PACK_DRY_RUN_INDEX.md and DEFAULT_POLICY_PACKS_V1.md",
      "",
      "**Out of scope for all V1-ready packs:** live Stripe checkout.",
    ].join("\n");

    const prepared = prepareHelpMarkdownForPresentation(source, "docs/library/ACCELERATOR_CHOOSER.md", {
      helpTopicSlug: "accelerator-chooser",
    });

    expect(prepared).not.toMatch(/\bTB-\d+\b/i);
    expect(prepared.toLowerCase()).not.toContain("templates/starter-proof-packs");
    expect(prepared).not.toContain("POLICY_PACK_");
    expect(prepared).not.toContain("DEFAULT_POLICY_PACKS_V1");
    expect(prepared.toLowerCase()).not.toContain("walkthroughs/");
    expect(prepared.toLowerCase()).not.toContain("## policy packs");
    expect(prepared).toContain("/help/first-architecture-review");
    expect(prepared).not.toContain("**Out of scope for all V1-ready packs:**");
    expect(prepared.toLowerCase()).not.toContain("live stripe");
    expect(prepared.toLowerCase()).not.toContain("v1.1 unless separately promoted");
    expect(prepared.toLowerCase()).not.toContain("marketplace checkout");
  });

  it("drops administrator smoke-validation disclosure from Azure Boards help (TB-1621)", () => {
    const source = [
      "## Related",
      "",
      "- [Integration readiness](/help/integration-readiness)",
      "",
      "<details>",
      "<summary>Administrator details — smoke validation</summary>",
      "",
      "For connector smoke validation, see `docs/integrations/smoke/CONNECTOR_SMOKE_AZURE_BOARDS.md`.",
      "",
      "</details>",
    ].join("\n");

    const prepared = stripAzureBoardsContributorLeakage(source);

    expect(prepared).toContain("## Related");
    expect(prepared).toContain("/help/integration-readiness");
    expect(prepared).not.toContain("<details>");
    expect(prepared).not.toContain("CONNECTOR_SMOKE");
    expect(prepared.toLowerCase()).not.toContain("docs/integrations/smoke");
  });

  it("keeps presented Azure Boards help free of connector smoke repo paths (TB-1621)", () => {
    const loaded = tryLoadProductDocumentation("azure-boards");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath);

    expect(prepared).not.toContain("CONNECTOR_SMOKE");
    expect(prepared.toLowerCase()).not.toContain("docs/integrations/smoke");
    expect(prepared).not.toContain("<details>");
    expect(prepared).toContain("/help/findings");
  });

  it("replaces contributor repo-tree framing in CAIQ/SIG help (TB-1632)", () => {
    const source = [
      "| Theme | Response (summary) | Evidence in repo |",
      "|-------|----------------------|------------------|",
      "| Vulnerability management | Partial | `.github/workflows/ci.yml` |",
      "| Encryption at rest | Yes | Terraform modules under `infra/` |",
      "| Risk assessments | Partial | [`pen-test-summaries/2026-Q2-SOW.md`](pen-test-summaries/2026-Q2-SOW.md) |",
      "| Security policies | Yes | [`SECURITY.md`](../library/contributor-reference/SECURITY.md) |",
      "| Data classification | Partial | narrative cross-check [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) |",
    ].join("\n");

    const prepared = stripCaiqSigContributorLeakage(source);

    expect(prepared).not.toMatch(/Evidence in repo/i);
    expect(prepared).not.toContain(".github/");
    expect(prepared).not.toContain("infra/");
    expect(prepared).not.toContain("PENDING_QUESTIONS.md");
    expect(prepared).not.toContain("pen-test-summaries/");
    expect(prepared).not.toContain("contributor-reference/SECURITY.md");
    expect(prepared).toContain("automated security testing in CI");
    expect(prepared).toContain("hosted infrastructure");
    expect(prepared).toContain("penetration test program documentation");
    expect(prepared).toContain("security documentation");
    expect(prepared).toContain("owner diligence notes");
  });

  it("keeps presented CAIQ/SIG help free of contributor repo paths (TB-1632)", () => {
    const loaded = tryLoadProductDocumentation("caiq-sig-response");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath);

    expect(prepared).not.toMatch(/Evidence in repo/i);
    expect(prepared).not.toContain(".github/");
    expect(prepared).not.toContain("infra/");
    expect(prepared).not.toContain("PENDING_QUESTIONS.md");
    expect(prepared).not.toContain("pen-test-summaries/");
    expect(prepared).not.toContain("contributor-reference/");
    expect(prepared).toContain("/help/security-trust");
  });

  it("aligns CAIQ/SIG pen-test and SOC wording to assurance honesty ladder (TB-1633)", () => {
    const source = [
      "**Dry-run note (procurement):** Status values (**Strong**, **Partial**, **In flight**, **Inherited**)",
      "",
      "| Control intent | Status | Evidence |",
      "| Third-party pen test | In flight | SoW template |",
      "| SOC program | Partial | SOC 2 ready narrative |",
    ].join("\n");

    const prepared = alignCaiqSigAssuranceHonesty(source);

    expect(prepared).not.toMatch(/pen test in flight/i);
    expect(prepared).not.toMatch(/\|\s*Third-party pen test\s*\|\s*In flight\s*\|/i);
    expect(prepared).not.toContain("SOC 2 ready");
    expect(prepared).not.toContain("**In flight**");
    expect(prepared).toContain("Planned, not yet scheduled");
    expect(prepared).toContain("SOC 2 self-assessment (not CPA attestation)");
  });

  it("keeps presented CAIQ/SIG help free of pen-test-in-flight and SOC overclaims (TB-1633)", () => {
    const loaded = tryLoadProductDocumentation("caiq-sig-response");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath).toLowerCase();

    expect(prepared).not.toMatch(/pen test in flight/);
    expect(prepared).not.toMatch(/pen-test in flight/);
    expect(prepared).not.toContain("soc 2 ready");
    expect(prepared).not.toContain("soc 2 certified");
    expect(prepared).not.toMatch(/\|\s*third-party pen test\s*\|\s*in flight\s*\|/);
    expect(prepared).toContain("planned, not yet scheduled");
    expect(prepared).not.toContain("not labeled in flight are explained");
  });

  it("aligns data-handling isolation copy to honesty ladder (TB-1653)", () => {
    const source = [
      "## Isolation",
      "",
      "Each customer tenant uses a dedicated database. Cross-tenant data access is not part of the product design. Append-only audit logging records every governed action within your tenant.",
    ].join("\n");

    const prepared = alignDataHandlingIsolationHonesty(source);

    expect(prepared).not.toMatch(/not part of the product design/i);
    expect(prepared).toContain("standard customer path");
    expect(prepared).toContain("/help/security-trust");
    // Presentation rewriter still emits the legacy twin path; alias resolves to data-handling.
    expect(prepared).toMatch(/\/help\/data-handling(-tenant-isolation)?/);
    expect(prepared).toContain("Append-only audit logging");
  });

  it("keeps presented data-handling help free of absolute cross-tenant isolation claims (TB-1653)", () => {
    const loaded = tryLoadProductDocumentation("data-handling");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath).toLowerCase();

    expect(prepared).not.toMatch(/cross-tenant data access is not part of the product design/);
    expect(prepared).toContain("standard customer path");
    expect(prepared).toContain("/help/security-trust");
    expect(prepared).toContain("three layers");
  });

  it("strips tenant-isolation pack-alias and repo-path leakage (TB-1659)", () => {
    const source = [
      "**Canonical buyer overview:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview).",
      "",
      "## Three layers {#three-layers}",
      "",
      "Three-layer isolation (identity, application, database-per-tenant catalogs), encryption/network notes, non-claims (no SQL RLS production boundary; ADR 0037), verification-pack generation, and deep-dive links live only in the buyer security packet.",
      "",
      "```bash",
      "python scripts/generate_tenant_isolation_verification_pack.py",
      "```",
    ].join("\n");

    const prepared = stripTenantIsolationContributorLeakage(source);

    expect(prepared).not.toContain("BUYER_SECURITY_PROCUREMENT_PACKET");
    expect(prepared).not.toContain("scripts/");
    expect(prepared).not.toContain("generate_tenant_isolation");
    expect(prepared).not.toContain("ADR 0037");
    expect(prepared).toContain("SQL row-level security is not the production isolation boundary");
    expect(prepared).toContain("/help/security-trust");
    expect(prepared).toContain("/help/procurement");
  });

  it("keeps presented data-handling help buyer-safe after isolation fold (TB-1659)", () => {
    const loaded = tryLoadProductDocumentation("data-handling");

    expect(loaded).not.toBeNull();
    // Retired data-handling-tenant-isolation bookmarks redirect to the canonical data-handling entry.

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "data-handling",
    }).toLowerCase();

    expect(prepared).not.toContain("buyer_security_procurement_packet");
    expect(prepared).not.toContain("multi_tenant_rls");
    expect(prepared).not.toContain("generate_tenant_isolation");
    expect(prepared).not.toContain("scripts/");
    expect(prepared).toContain("sql row-level security is not the production isolation boundary");
    expect(prepared).toContain("/help/security-trust");
    expect(prepared).toContain("three layers");
  });

  it("strips DPA template contributor .md and pack-path leakage (TB-1677)", () => {
    const source = [
      "> **Spine doc:** [`START_HERE.md`](../START_HERE.md).",
      "",
      "See [SECURITY.md](../library/contributor-reference/SECURITY.md) and [PII_RETENTION_CONVERSATIONS.md](../security/PII_RETENTION_CONVERSATIONS.md).",
      "",
      "[BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview)",
      "",
      "content is submitted to architecture runs.",
    ].join("\n");

    const prepared = stripDpaTemplateContributorLeakage(source);

    expect(prepared).not.toContain("START_HERE");
    expect(prepared).not.toContain("SECURITY.md");
    expect(prepared).not.toContain("PII_RETENTION_CONVERSATIONS");
    expect(prepared).not.toContain("BUYER_SECURITY_PROCUREMENT_PACKET");
    expect(prepared).not.toContain("architecture runs");
    expect(prepared).toContain("architecture reviews");
    expect(prepared).toContain("/help/procurement");
  });

  it("keeps presented DPA template help buyer-safe (TB-1677 / TB-1680)", () => {
    const loaded = tryLoadProductDocumentation("dpa-template");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath).toLowerCase();

    expect(prepared).not.toContain("start_here");
    expect(prepared).not.toContain("security.md");
    expect(prepared).not.toContain("pii_retention_conversations");
    expect(prepared).not.toContain("buyer_security_procurement_packet");
    expect(prepared).not.toContain("incident_communications_policy.md");
    expect(prepared).not.toContain("architecture runs");
    expect(prepared).toContain("architecture reviews");
    expect(prepared).toContain("/help/security-trust");
    expect(prepared).toContain("/help/subprocessors");
  });

  it("strips executive-summary contributor FAQ and eng-path leakage (TB-1688)", () => {
    const source = [
      "**How do I try it locally?**",
      "Follow **day-one-developer.md** — run **ArchLucid.Api** and **archlucid-ui**.",
      "",
      "Contracts live under **`ArchLucid.Contracts`**.",
      "",
      "OAuth upgrades (**TB-600**) — see **INTEGRATION_CATALOG.md**.",
    ].join("\n");

    const prepared = stripExecutiveSummaryContributorLeakage(source);

    expect(prepared).not.toContain("day-one-developer");
    expect(prepared).not.toContain("ArchLucid.Contracts");
    expect(prepared).not.toMatch(/\bTB-\d+\b/i);
    expect(prepared).not.toContain("INTEGRATION_CATALOG");
    expect(prepared).toContain("/help/first-architecture-review");
  });

  it("keeps presented executive-summary help buyer-safe (TB-1688)", () => {
    const loaded = tryLoadProductDocumentation("executive-summary");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "executive-summary",
    }).toLowerCase();

    expect(prepared).not.toContain("day-one-developer");
    expect(prepared).not.toContain("security.md");
    expect(prepared).not.toContain("multi_tenant_rls");
    expect(prepared).not.toContain("archlucid.contracts");
    expect(prepared).not.toMatch(/\btb-\d+\b/i);
    expect(prepared).not.toContain("trust-center.md");
    expect(prepared).toContain("what pilot proves");
  });

  it("strips executive-summary sponsor-brief section ordinals and normalizes humanized link labels (EXE P0-2, P0-3)", () => {
    const source = [
      "## 5. What Pilot proves {#what-pilot-proves}",
      "",
      "See [Api Contracts](/help/api-contracts) and [Pilot Roi Model](/help/pilot-roi-model).",
      "",
      "## 6. ROI framing {#roi-framing}",
      "",
      "Also [Roi Model](/help/pilot-roi-model).",
    ].join("\n");

    const prepared = stripExecutiveSummarySponsorBriefLeakage(source);

    expect(prepared).toContain("## What Pilot proves {#what-pilot-proves}");
    expect(prepared).toContain("## ROI framing {#roi-framing}");
    expect(prepared).not.toMatch(/^##\s+\d+\./m);
    expect(prepared).toContain("[API contracts](/help/api-contracts)");
    expect(prepared).toContain("[Pilot ROI measurement](/help/executive-summary#pilot-roi-measurement)");
    expect(prepared).not.toMatch(/\bApi\b/);
    expect(prepared).not.toMatch(/\bRoi\b/);
  });

  it("strips first-value-20 CLI/dotnet and runbook-path leakage (TB-1693)", () => {
    const source = [
      "## First value in 20 minutes (time-boxed) {#first-value-in-20-minutes}",
      "",
      "`dotnet run --project ArchLucid.Cli -- doctor`",
      "",
      "`archlucid pilot proof-packet <runId> --out artifacts/proof-packet/<runId>`",
      "",
      "See [`ROLE_INDEX.md`](ROLE_INDEX.md) and [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md).",
      "",
      "## Phase A — Platform ready",
      "",
      "More eng content.",
    ].join("\n");

    const prepared = stripFirstValue20ContributorLeakage(source);

    expect(prepared).not.toContain("dotnet run --project");
    expect(prepared).not.toContain("ROLE_INDEX");
    expect(prepared).not.toContain("TROUBLESHOOTING.md");
    expect(prepared).not.toContain("Phase A");
    expect(prepared).not.toContain("proof output folder");
    expect(prepared).not.toContain("admin automation script");
    expect(prepared).toContain("archlucid doctor");
    expect(prepared).toContain("--out <output-folder>");
    expect(prepared).toContain("/help/troubleshooting");
  });

  it("keeps first-value-20 inline CLI commands copy-pasteable with placeholders (HEF P0-2)", () => {
    const source = [
      "## First value in 20 minutes (time-boxed) {#first-value-in-20-minutes}",
      "",
      "`dotnet run --project ArchLucid.Cli -- try --sponsor-packet --out artifacts/proof`",
      "",
      "`archlucid buyer-proof-pack <runId> --out artifacts/buyer-proof.zip`",
      "",
      "Before handoff run ./scripts/collect-first-pilot-proof.ps1 with a finalized run id.",
    ].join("\n");

    const prepared = stripFirstValue20ContributorLeakage(source);
    const inlineCodeMatches = prepared.match(/`[^`]+`/g) ?? [];

    for (const span of inlineCodeMatches) {
      expect(span).not.toMatch(/--out\s+proof output folder/i);
      expect(span).not.toMatch(/admin automation script/i);
    }

    expect(prepared).toContain("archlucid try --sponsor-packet --out <output-folder>");
    expect(prepared).toContain("archlucid buyer-proof-pack <runId> --out <output-folder>");
    expect(prepared).toContain("<admin-automation-script>");
  });

  it("keeps presented first-value-20 help buyer-safe (TB-1691 / TB-1693)", () => {
    const loaded = tryLoadFoldedInternalRunbook("first-value-20-minutes");

    expect(loaded).not.toBeNull();
    expect(loaded!.entry.sectionAnchors).toEqual(["first-value-in-20-minutes"]);

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "first-value-20-minutes",
    }).toLowerCase();

    expect(prepared).not.toContain("dotnet run --project");
    expect(prepared).not.toContain("role_index");
    expect(prepared).not.toContain("canonical_first_run_path");
    expect(prepared).not.toContain("phase a — platform ready");
    expect(prepared).not.toContain("phase a");
    expect(prepared).not.toContain("â");
    expect(prepared).not.toContain("first value in 20 minutes (time-boxed)");
    expect(prepared).toContain("archlucid doctor");
  });

  it("strips path-chooser GTM/runbook .md and artifacts leakage (TB-1712)", () => {
    const source = [
      "**Start operators here:** [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) · [`FIRST_EVALUATOR_DECISION.md`](../runbooks/FIRST_EVALUATOR_DECISION.md).",
      "",
      "See [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) and `artifacts/first-pilot-proof/`.",
      "",
      "Deferred: [`V1_DEFERRED.md`](../library/V1_DEFERRED.md).",
    ].join("\n");

    const prepared = stripPathChooserContributorLeakage(source);

    expect(prepared).not.toContain("FIRST_PILOT_OPERATOR_PATH");
    expect(prepared).not.toContain("FIRST_EVALUATOR_DECISION");
    expect(prepared).not.toContain("Start operators here");
    expect(prepared).not.toContain("EXECUTIVE_SPONSOR_BRIEF");
    expect(prepared).not.toContain("artifacts/");
    expect(prepared).not.toContain("V1_DEFERRED");
    expect(prepared).toContain("/help/executive-summary");
  });

  it("keeps presented path-chooser help buyer-safe (TB-1712)", () => {
    const loaded = tryLoadProductDocumentation("choose-your-next-step");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "choose-your-next-step",
    }).toLowerCase();

    expect(prepared).not.toContain("first_pilot_operator_path");
    expect(prepared).not.toContain("differentiation_proof_packet");
    expect(prepared).not.toContain("procurement_pack_index.md");
    expect(prepared).not.toContain("v1_deferred");
    expect(prepared).not.toContain("artifacts/");
    expect(prepared).not.toContain("choose your next step");
    expect(prepared).toContain("/help/security-trust");
    expect(prepared).toContain("two layers");
  });

  it("strips pilot-feedback API/SQL/StorageProvider leakage (TB-1717)", () => {
    const source = [
      "- Rows are stored in **`ProductLearningPilotSignals`** (SQL when `ArchLucid:StorageProvider` is **`Sql`**).",
      "",
      "<details>",
      "<summary>Administrator details — API and storage</summary>",
      "",
      "UI controls call **`POST /v1/product-learning/signals`**. See Swagger.",
      "</details>",
      "",
      "**API:** `GET /v1/product-learning/report?format=markdown`",
    ].join("\n");

    const prepared = stripPilotFeedbackContributorLeakage(source);

    expect(prepared).not.toContain("ProductLearningPilotSignals");
    expect(prepared).not.toContain("StorageProvider");
    expect(prepared).not.toContain("/v1/");
    expect(prepared).not.toContain("Swagger");
    expect(prepared).toContain("tenant");
    expect(prepared).toContain("workspace");
  });

  it("keeps presented pilot-feedback help UI-first (TB-1717)", () => {
    const loaded = tryLoadProductDocumentation("pilot-feedback");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "pilot-feedback",
    }).toLowerCase();

    expect(prepared).not.toContain("productlearningpilotsignals");
    expect(prepared).not.toContain("storageprovider");
    expect(prepared).not.toContain("/v1/product-learning");
    expect(prepared).not.toContain("swagger");
    expect(prepared).not.toContain("x-tenant-id");
    expect(prepared).toContain("trusted");
    expect(prepared).toContain("/internal/product-learning");
    expect(prepared).toContain("planning bridge");
  });

  it("strips policy-pack-delta HTTP/config/script/GUID leakage (TB-1727)", () => {
    const source = [
      "**Automation:** [`scripts/demo-policy-pack-delta.ps1`](../../scripts/demo-policy-pack-delta.ps1).",
      "",
      "Enable **`ArchLucid:Governance:PreCommitGateEnabled=true`** on the host.",
      "",
      "Example run: `eb81dd4972ad429e8d4e214f9934bfc0`.",
      "",
      "### API",
      "",
      "```http",
      "GET /v1/policy-packs/effective",
      "```",
    ].join("\n");

    const prepared = stripPolicyPackDeltaContributorLeakage(source);

    expect(prepared).not.toContain("demo-policy-pack-delta");
    expect(prepared).not.toContain("PreCommitGateEnabled");
    expect(prepared).not.toContain("/v1/");
    expect(prepared).not.toContain("eb81dd4972ad429e8d4e214f9934bfc0");
  });

  it("keeps presented policy-pack-delta help UI-first (TB-1727)", () => {
    const loaded = tryLoadProductDocumentation("policy-pack-delta-demo");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "policy-pack-delta-demo",
    }).toLowerCase();

    expect(prepared).not.toContain("demo-policy-pack-delta");
    expect(prepared).not.toContain("precommitgateenabled");
    expect(prepared).not.toContain("/v1/");
    expect(prepared).not.toContain("readauthority");
    expect(prepared).not.toContain("eb81dd4972ad429e8d4e214f9934bfc0");
    expect(prepared).toContain("policy packs");
    expect(prepared).toContain("/policy-packs");
  });

  it("strips prior-manifest host config key leakage (TB-1733)", () => {
    const source = [
      "- **Priors from other packages** — up to the configured limit of **other finalized architecture packages** (see limits below).",
      "",
      "<details>",
      "<summary>Administrator details — indexing limits</summary>",
      "",
      "Cross-package prior attachment at index time is capped by `Retrieval:PriorManifest:MaxPriorManifestsPerIndex` (default **5**).",
      "</details>",
    ].join("\n");

    const prepared = stripPriorManifestRetrievalContributorLeakage(source);

    expect(prepared).not.toContain("Retrieval:PriorManifest");
    expect(prepared).not.toContain("MaxPriorManifestsPerIndex");
    expect(prepared).toContain("five");
    expect(prepared).toContain("most recent");
  });

  it("keeps presented prior-manifest help operator-safe (TB-1733)", () => {
    const loaded = tryLoadProductDocumentation("prior-manifest-retrieval");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "prior-manifest-retrieval",
    }).toLowerCase();

    expect(prepared).not.toContain("retrieval:priormanifest");
    expect(prepared).not.toContain("maxpriormanifestsperindex");
    expect(prepared).not.toContain("deployment configuration");
    expect(prepared).toContain("five");
    expect(prepared).toContain("finalize");
  });

  it("strips product-overview eng/GTM path and type leakage (TB-1738)", () => {
    const source = [
      "The `ExplainabilityTrace` on every finding records what was examined.",
      "",
      "Injected as JSON/YAML rules with 78 typed audit events.",
      "",
      "See [`POSITIONING.md`](POSITIONING.md) and [`V1_DEFERRED.md`](../library/V1_DEFERRED.md).",
      "",
      "Do not claim calendar wins (open **M-245**).",
    ].join("\n");

    const prepared = stripProductOverviewContributorLeakage(source);

    expect(prepared).not.toContain("ExplainabilityTrace");
    expect(prepared).not.toContain("JSON/YAML");
    expect(prepared).not.toContain("78 typed audit");
    expect(prepared).not.toContain("POSITIONING.md");
    expect(prepared).not.toContain("V1_DEFERRED");
    expect(prepared).not.toContain("M-245");
  });

  it("keeps presented executive-summary help buyer-safe (TB-1738)", () => {
    const loaded = tryLoadProductDocumentation("executive-summary");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "executive-summary",
    }).toLowerCase();

    expect(prepared).not.toContain("explainabilitytrace");
    expect(prepared).not.toContain("json/yaml");
    expect(prepared).not.toContain("78 typed audit");
    expect(prepared).not.toContain("positioning.md");
    expect(prepared).not.toContain("v1_deferred");
    expect(prepared).not.toContain("m-245");
    expect(prepared).not.toContain("elevator_pitch.md");
    expect(prepared).toContain("what pilot proves");
    expect(prepared).toContain("architecture package");
  });

  it("strips SOC2 self-assessment contributor repo paths (TB-1747)", () => {
    const source = [
      "> **Spine doc:** [`START_HERE.md`](../START_HERE.md).",
      "",
      "| Security — logical access | Entra; `AuthSafetyGuard`; [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md) | Partial |",
      "",
      "| G-002 | pen test | Security | V2 | **Open** — [`pen-test-summaries/2026-Q2-SOW.md`](pen-test-summaries/2026-Q2-SOW.md) |",
      "",
      "## Related",
      "",
      "- [`COMPLIANCE_MATRIX.md`](COMPLIANCE_MATRIX.md)",
    ].join("\n");

    const prepared = stripSoc2SelfAssessmentContributorLeakage(source);

    expect(prepared).not.toContain("START_HERE");
    expect(prepared).not.toContain("AuthSafetyGuard");
    expect(prepared).not.toContain("AUDIT_COVERAGE_MATRIX");
    expect(prepared).not.toContain("pen-test-summaries");
    expect(prepared).not.toContain("COMPLIANCE_MATRIX");
    expect(prepared).toContain("product audit trail");
    expect(prepared).toContain("/help/security-trust");
  });

  it("keeps presented SOC2 self-assessment help buyer-safe (TB-1747)", () => {
    const loaded = tryLoadProductDocumentation("soc2-self-assessment");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "soc2-self-assessment",
    }).toLowerCase();

    expect(prepared).not.toContain("start_here");
    expect(prepared).not.toContain("authsafetyguard");
    expect(prepared).not.toContain("codeql");
    expect(prepared).not.toContain("audit_coverage_matrix");
    expect(prepared).not.toContain("v1_deferred");
    expect(prepared).not.toContain("pen-test-summaries");
    expect(prepared).not.toContain("compliance_matrix");
    expect(prepared).toContain("self-assessment");
    expect(prepared).toContain("/help/caiq-sig-response");
    expect(prepared).toContain("/help/security-trust");
    expect(prepared).toContain("/help/data-handling");
  });

  it("frames SOC2 Type I roadmap as illustrative, not committed dates (TB-1748)", () => {
    const source = [
      "| G-001 | No CPA SOC 2 report | CFO / Security | Fund external readiness consultant + CPA firm; Type I observation window | **Open** — requires external readiness consultant shortlist and budget line (see Pending Questions) |",
      "",
      "## SOC 2 Type I — readiness planning (Q2–Q3 2026)",
      "",
      "| Readiness consultant engaged | Illustrative — owner/budget gated | Shortlist 3 CPA-aligned boutiques |",
      "| Control baseline freeze for observation | Illustrative — owner/budget gated | Align with owner-conducted testing closure |",
      "| Type I observation period start | 2026-09-01 | Illustrative — confirm with selected CPA |",
      "| Type I report (stretch) | 2026-Q4 | Requires executed attestation agreement |",
    ].join("\n");

    const prepared = stripSoc2SelfAssessmentContributorLeakage(source).toLowerCase();

    expect(prepared).not.toContain("2026-09-01");
    expect(prepared).not.toContain("2026-q4");
    expect(prepared).not.toContain("q2–q3 2026");
    expect(prepared).not.toContain("pending questions");
    expect(prepared).not.toContain("cfo / security");
    expect(prepared).toContain("illustrative");
    expect(prepared).toContain("not a product commitment");
    expect(prepared).toContain("when budget approves external consultant");
    expect(prepared).toContain("after funded readiness workshop");
    expect(prepared).toContain("per selected cpa scope (not committed)");
    expect(prepared).toContain("requires executed attestation agreement");
  });

  it("keeps presented SOC2 Type I help free of calendar commitments (TB-1748)", () => {
    const loaded = tryLoadProductDocumentation("soc2-self-assessment");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "soc2-self-assessment",
    }).toLowerCase();

    expect(prepared).not.toContain("2026-09-01");
    expect(prepared).not.toContain("2026-q4");
    expect(prepared).not.toContain("pending questions");
    expect(prepared).toContain("illustrative");
    expect(prepared).toContain("not a commitment");
    expect(prepared).toContain("when budget approves external consultant");
    expect(prepared).toContain("after funded readiness workshop");
    expect(prepared).toContain("per selected cpa scope (not committed)");
    expect(prepared).toContain("requires executed attestation agreement");
  });

  it("strips subprocessors contributor repo paths (TB-1752)", () => {
    const source = [
      "> **Spine doc:** [`START_HERE.md`](../START_HERE.md).",
      "",
      "ArchLucid uses the following **subprocessors** to deliver the hosted service. The list is derived from the **Azure-first** architecture described in [../CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md), [../security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md), and repository `infra/` modules.",
      "",
      "| **Microsoft Corporation** | **Azure Container Apps** (or equivalent compute), **Azure SQL**, **Azure Blob Storage**, **Azure Key Vault**, optional **Azure Service Bus**, **Azure Cache for Redis** (or compatible), **Azure Front Door**, optional **Azure API Management**, monitoring integrations | Customer architecture content, run metadata, manifests, findings, audit events, blobs (including optional agent traces), secrets by reference | **Primary Azure region(s)** chosen at deploy time via Terraform (see **Data residency** below) | Host application, store and encrypt data at rest, edge routing, optional queue/cache |",
      "",
      "Production deployments are **Azure-region scoped**; the **primary region** is selected when infrastructure is provisioned (see `infra/` Terraform variables and [../terraform-azure-variables.md](../library/terraform-azure-variables.md)).",
      "",
      "**Roadmap:** Document **multi-region** active/active or failover when offered; see [../runbooks/GEO_FAILOVER_DRILL.md](../runbooks/GEO_FAILOVER_DRILL.md) for operational drill context (internal).",
      "",
      "- **Material change:** Updated DPA schedule or subprocessors exhibit available on request; see [DPA_TEMPLATE.md](DPA_TEMPLATE.md).",
      "",
      "## Related documents",
      "",
      "| [trust-center.md](trust-center.md) | Trust index |",
    ].join("\n");

    const prepared = stripSubprocessorsContributorLeakage(source).toLowerCase();

    expect(prepared).not.toContain("start_here");
    expect(prepared).not.toContain(".md");
    expect(prepared).not.toContain("infra/");
    expect(prepared).not.toContain("terraform-azure");
    expect(prepared).not.toContain("geo_failover");
    expect(prepared).not.toContain("customer_trust_and_access");
    expect(prepared).not.toContain("system_threat_model");
    expect(prepared).not.toContain("related documents");
    expect(prepared).toContain("/help/security-trust");
    expect(prepared).toContain("/help/dpa-template");
    expect(prepared).toContain("azure-region scoped");
    expect(prepared).toContain("multi-region");
  });

  it("keeps presented subprocessors help buyer-safe (TB-1752)", () => {
    const loaded = tryLoadProductDocumentation("subprocessors");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "subprocessors",
    }).toLowerCase();

    expect(prepared).not.toContain("start_here");
    expect(prepared).not.toContain("infra/");
    expect(prepared).not.toContain("terraform-azure");
    expect(prepared).not.toContain("geo_failover");
    expect(prepared).not.toContain("customer_trust_and_access");
    expect(prepared).not.toContain("system_threat_model");
    expect(prepared).not.toContain("related documents");
    expect(prepared).toContain("/help/security-trust");
    expect(prepared).toContain("/help/dpa-template");
    expect(prepared).toContain("microsoft corporation");
  });

  it("aligns subprocessors residency and drops contributor to-do voice (TB-1755)", () => {
    const source = [
      "**Non-Microsoft:** The product codebase does not require a separate non-Microsoft **runtime** subprocessor for core API functionality beyond Microsoft Azure services above. If you add third-party observability, CRM, or support tools that touch customer data, **update this table** before production use.",
      "",
      "Until a single public **primary production region** is published for the ArchLucid SaaS offering, treat the region as **“per deployment / subscription — confirm in order form or security pack.”**",
    ].join("\n");

    const prepared = alignSubprocessorsResidencyHonesty(source).toLowerCase();

    expect(prepared).not.toContain("update this table");
    expect(prepared).not.toContain("product codebase");
    expect(prepared).not.toContain("before production use");
    expect(prepared).toContain("hosted archlucid saas");
    expect(prepared).toContain("/help/security-trust");
    expect(prepared).toContain("security diligence pack");
  });

  it("keeps presented subprocessors help residency buyer-safe (TB-1755)", () => {
    const loaded = tryLoadProductDocumentation("subprocessors");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "subprocessors",
    }).toLowerCase();

    expect(prepared).not.toContain("update this table");
    expect(prepared).not.toContain("product codebase");
    expect(prepared).not.toContain("before production use");
    expect(prepared).toContain("hosted archlucid saas");
    expect(prepared).toContain("/help/security-trust");
    expect(prepared).toContain("security diligence pack");
  });

  it("strips eng CLI, Evidence tier, and JwtBearer from enterprise onboarding (TB-1339)", () => {
    const source = [
      "Choose **OIDC JwtBearer**.",
      "",
      "Persist mapping in **`ClaimMappingJson`**.",
      "",
      "**Evidence tier:** cloud-connected (optional).",
      "",
      "<details>",
      "<summary>Advanced: configuration keys (admin reference)</summary>",
      "",
      "**SAML helpers:** `archlucid auth sso-preflight` (appsettings)",
      "",
      "</details>",
      "",
      "Keep going.",
    ].join("\n");

    const prepared = stripEnterpriseOnboardingContributorLeakage(source);

    expect(prepared).not.toContain("JwtBearer");
    expect(prepared).toContain("OpenID Connect");
    expect(prepared).not.toContain("ClaimMappingJson");
    expect(prepared).toContain("role claim mapping");
    expect(prepared).not.toContain("Evidence tier");
    expect(prepared).not.toContain("archlucid auth");
    expect(prepared).not.toContain("appsettings");
    expect(prepared).not.toContain("configuration keys");
    expect(prepared).toContain("Keep going.");
  });

  it("strips TB IDs, RC scripts, and contributor security anchors from configuration reference (TB-1327)", () => {
    const source = [
      "Prefer managed identity (TB-080).",
      "",
      "**Release-candidate gates (mandatory):** `scripts/ci/Invoke-ConfigLintProofStep.ps1` and `fixtures/release-candidate/appsettings.json`.",
      "",
      "See [SECURITY.md](contributor-reference/SECURITY.md) and [V1_SCOPE.md](V1_SCOPE.md).",
      "",
      "| ArchLucid | `ArchLucid:Persistence:AllowRlsBypass` | false | Dev-only |",
      "| ArchLucid | `ArchLucid:InternalCrossTenantAnalytics:RollupJobEnabled` | true | Worker |",
      "",
      "Key Vault + managed identity ([ADR 0038](../architecture/adrs/0038-run-durability-multi-store-outbox-production-secrets.md)).",
    ].join("\n");

    const prepared = stripConfigurationReferenceContributorLeakage(source);

    expect(prepared).not.toMatch(/\bTB-\d+\b/i);
    expect(prepared).not.toContain("Invoke-ConfigLintProofStep");
    expect(prepared).not.toContain("fixtures/release-candidate");
    expect(prepared).not.toContain("scripts/ci/");
    expect(prepared).not.toContain("contributor-reference");
    expect(prepared).not.toContain("SECURITY.md");
    expect(prepared).not.toContain("V1_SCOPE");
    expect(prepared).not.toContain("AllowRlsBypass");
    expect(prepared).not.toContain("InternalCrossTenantAnalytics");
    expect(prepared).not.toContain("ADR 0038");
    expect(prepared).toContain("production secrets guidance");
  });

  it("detects documentation maintenance metadata lines", () => {
    expect(isDocumentationMaintenanceMetadataLine("**Last reviewed:** 2026-06-06")).toBe(true);
    expect(isDocumentationMaintenanceMetadataLine("**Last reviewed (UTC):** 2026-07-31")).toBe(true);
    expect(isDocumentationMaintenanceMetadataLine("- **Last updated:** 2026-04-25")).toBe(true);
    expect(isDocumentationMaintenanceMetadataLine("| Control | Last reviewed |")).toBe(false);
    expect(isDocumentationMaintenanceMetadataLine("Note: illustrative dates only.")).toBe(false);
  });

  it("hides maintenance metadata from default help presentation", () => {
    const source = [
      "## Prepare",
      "",
      "**Last reviewed:** 2026-06-06",
      "",
      "Pilot body copy.",
    ].join("\n");

    const prepared = prepareHelpMarkdownForPresentation(source, "docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md");

    expect(prepared.toLowerCase()).not.toContain("last reviewed");
    expect(prepared).toContain("Pilot body copy.");
  });

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
