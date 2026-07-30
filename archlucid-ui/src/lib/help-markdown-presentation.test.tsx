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
  stripAcceleratorChooserContributorLeakage,
  stripAcceleratorChooserContributorSections,
  stripAzureBoardsContributorLeakage,
  stripConfigurationReferenceContributorLeakage,
  stripConfigurationReferenceContributorSections,
  stripDocumentationMaintenanceMetadata,
  stripEnterpriseOnboardingContributorLeakage,
  stripEnterpriseOnboardingContributorSections,
  stripEvaluatorWorkbookContributorLeakage,
  stripGovernanceApiContractsContributorLeakage,
  stripGovernanceApiContractsContributorSections,
  stripPilotRoiModelContributorLeakage,
  stripPilotRoiModelContributorSections,
  stripRepeatReviewLoopContributorLeakage,
  stripRepeatReviewLoopContributorSections,
} from "@/lib/help-markdown-presentation";
import { HELP_TOPIC_BANNED_COPY_PATTERNS } from "@/lib/help-product-language";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
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
    expect(prepared).toContain("[Workspace route map](/help/pilot-nav-profile)");
    expect(prepared).toMatch(/\[Your first architecture review\]\(\/help\/core-pilot\)/);
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
    expect(prepared).toContain("pilot host integrity");
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

  it("omits Spine and Related sections from pilot ROI model presentation (TB-1390)", () => {
    const source = [
      "## Measurement overview",
      "",
      "Use buyer-provided baselines.",
      "",
      "## Spine",
      "",
      "START_HERE.md and CORE_PILOT.md",
      "",
      "## Related guides",
      "",
      "REPOSITORY_README and archive/gtm-internal/PMF tracker",
      "",
      "## Scorecard inputs",
      "",
      "Label every figure.",
    ].join("\n");

    const prepared = stripPilotRoiModelContributorSections(source);

    expect(prepared.toLowerCase()).not.toContain("## spine");
    expect(prepared.toLowerCase()).not.toContain("## related guides");
    expect(prepared).toContain("## Measurement overview");
    expect(prepared).toContain("## Scorecard inputs");
    expect(prepared).not.toContain("START_HERE");
  });

  it("strips contributor spine and eng doc leakage from pilot ROI model (TB-1390)", () => {
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

    expect(prepared).toContain("/help/pilot-guide");
    expect(prepared).toContain("/help/executive-summary");
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
    expect(prepared).toContain("## Related help");
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
    expect(prepared).toContain("**Out of scope for all V1-ready packs:**");
    expect(prepared).not.toContain("POLICY_PACK_DRY_RUN_INDEX");
  });

  it("preserves out-of-scope copy after canonical reference section omission (TB-1606)", () => {
    const source = [
      "## Canonical references",
      "",
      "templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md",
      "",
      "**Out of scope for all V1-ready packs:** live Stripe checkout.",
    ].join("\n");

    const prepared = stripAcceleratorChooserContributorSections(source);

    expect(prepared).toContain("**Out of scope for all V1-ready packs:**");
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
    expect(prepared).toContain("in-product starter proof packs");
    expect(prepared).toContain("pack manifest");
  });

  it("keeps starter-pack table rows while redacting template paths (TB-1606)", () => {
    const source = [
      "| Buyer job | Starter pack |",
      "| --- | --- |",
      "| Regulated SaaS | [`regulated-saas-soc-procurement`](../../templates/starter-proof-packs/regulated-saas-soc-procurement/) |",
    ].join("\n");

    const prepared = prepareHelpMarkdownForPresentation(source, "docs/library/ACCELERATOR_CHOOSER.md");

    expect(prepared).toContain("Regulated SaaS");
    expect(prepared).toContain("regulated-saas-soc-procurement");
    expect(prepared.toLowerCase()).not.toContain("templates/starter-proof-packs");
  });

  it("keeps presented accelerator chooser help free of contributor paths and TB IDs (TB-1606)", () => {
    const loaded = tryLoadProductDocumentation("accelerator-chooser");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath);

    expect(prepared).not.toMatch(/\bTB-\d+\b/i);
    expect(prepared.toLowerCase()).not.toContain("templates/starter-proof-packs");
    expect(prepared).not.toContain("POLICY_PACK_");
    expect(prepared).not.toContain("STARTER_PROOF_PACK_CHOOSER");
    expect(prepared).not.toContain("DEFAULT_POLICY_PACKS_V1");
    expect(prepared.toLowerCase()).not.toContain("walkthroughs/");
    expect(prepared.toLowerCase()).not.toContain("## policy packs");
    expect(prepared.toLowerCase()).not.toContain("## canonical references");
    expect(prepared).toContain("/help/core-pilot");
    expect(prepared).toContain("regulated-saas-soc-procurement");
    expect(prepared).toContain("**Out of scope for all V1-ready packs:**");
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
    expect(prepared).toContain("/help/integration-readiness");
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
    });

    expect(prepared).toContain("**Last reviewed:** 2026-06-06");
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
    expect(prepared).toContain("](/reviews/new)");
    expect(prepared.includes("manifest exists")).toBe(false);
    expect(prepared.includes("/runs/")).toBe(false);
  });

  it("rewrites legacy manifest/run jargon during help presentation", () => {
    const source =
      "manifest exists for that manifest; golden manifest summary; RunId=abc; run not ready for commit; open /runs/abc.";
    const prepared = prepareHelpMarkdownForPresentation(source, "docs/runbooks/TROUBLESHOOTING.md").toLowerCase();

    expect(prepared).toContain("reviewid=abc");
    expect(prepared).toContain("/reviews/abc");
    expect(prepared).toContain("signed review record");
    expect(prepared).toContain("review not ready to finalize");
    for (const pattern of HELP_TOPIC_BANNED_COPY_PATTERNS) {
      expect(prepared, `should not contain "${pattern}"`).not.toContain(pattern);
    }
  });
});

describe("help topic product-language drift guards", () => {
  const SCOPED_ARCHITECT_HELP_SLUGS = [
    "pilot-nav-profile",
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

  it("renders same-page anchor links in onboarding hub bullets", () => {
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

    expect(screen.getByRole("link", { name: "Configure SSO" })).toHaveAttribute("href", "#workforce-sso");
    expect(screen.getByRole("link", { name: "Assign policy packs" })).toHaveAttribute("href", "#default-policy-packs");
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
});
