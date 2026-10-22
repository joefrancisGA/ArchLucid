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

describe("help-markdown-presentation (leakage 2)", () => {
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
  it("rewrites legacy Phase 1 limitations headings for Azure Boards help (TB-1622)", () => {
    const prepared = prepareHelpMarkdownForPresentation(
      "## Known limitations (Phase 1)\n\n- No inbound status sync",
      "docs/library/customer-facing/AZURE_BOARDS_INTEGRATION.md",
    );

    expect(prepared).toContain("## Known limitations in this release");
    expect(prepared).not.toMatch(/phase\s*1/i);
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
      "Each customer tenant uses a dedicated database. Cross-tenant data access is not part of the product design. Append-only audit logging records every approved action within your tenant.",
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
  it("strips sponsor-report contributor FAQ and eng-path leakage (TB-1688)", () => {
    const source = [
      "**How do I try it locally?**",
      "Follow **day-one-developer.md** — run **ArchLucid.Api** and **archlucid-ui**.",
      "",
      "Contracts live under **`ArchLucid.Contracts`**.",
      "",
      "OAuth upgrades (**TB-600**) — see **INTEGRATION_CATALOG.md**.",
    ].join("\n");

    const prepared = stripSponsorReportContributorLeakage(source);

    expect(prepared).not.toContain("day-one-developer");
    expect(prepared).not.toContain("ArchLucid.Contracts");
    expect(prepared).not.toMatch(/\bTB-\d+\b/i);
    expect(prepared).not.toContain("INTEGRATION_CATALOG");
    expect(prepared).toContain("/help/first-architecture-review");
  });
  it("keeps presented sponsor-report help buyer-safe (TB-1688)", () => {
    const loaded = tryLoadProductDocumentation("sponsor-report");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: "sponsor-report",
    }).toLowerCase();

    expect(prepared).not.toContain("day-one-developer");
    expect(prepared).not.toContain("security.md");
    expect(prepared).not.toContain("multi_tenant_rls");
    expect(prepared).not.toContain("archlucid.contracts");
    expect(prepared).not.toMatch(/\btb-\d+\b/i);
    expect(prepared).not.toContain("trust-center.md");
    expect(prepared).toContain("what pilot proves");
  });
  it("strips sponsor-report sponsor-brief section ordinals and normalizes humanized link labels (EXE P0-2, P0-3)", () => {
    const source = [
      "## 5. What Pilot proves {#what-pilot-proves}",
      "",
      "See [Api Contracts](/help/api-contracts) and [Pilot Roi Model](/help/pilot-roi-model).",
      "",
      "## 6. ROI framing {#roi-framing}",
      "",
      "Also [Roi Model](/help/pilot-roi-model).",
    ].join("\n");

    const prepared = stripSponsorReportSponsorBriefLeakage(source);

    expect(prepared).toContain("## What Pilot proves {#what-pilot-proves}");
    expect(prepared).toContain("## ROI framing {#roi-framing}");
    expect(prepared).not.toMatch(/^##\s+\d+\./m);
    expect(prepared).toContain("[API contracts](/help/api-contracts)");
    expect(prepared).toContain("[Pilot ROI measurement](/help/sponsor-report#pilot-roi-measurement)");
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
      "See [`SPONSOR_SPONSOR_BRIEF.md`](SPONSOR_SPONSOR_BRIEF.md) and `artifacts/first-pilot-proof/`.",
      "",
      "Deferred: [`V1_DEFERRED.md`](../library/V1_DEFERRED.md).",
    ].join("\n");

    const prepared = stripPathChooserContributorLeakage(source);

    expect(prepared).not.toContain("FIRST_PILOT_OPERATOR_PATH");
    expect(prepared).not.toContain("FIRST_EVALUATOR_DECISION");
    expect(prepared).not.toContain("Start operators here");
    expect(prepared).not.toContain("SPONSOR_SPONSOR_BRIEF");
    expect(prepared).not.toContain("artifacts/");
    expect(prepared).not.toContain("V1_DEFERRED");
    expect(prepared).toContain("/help/sponsor-report");
  });
});
