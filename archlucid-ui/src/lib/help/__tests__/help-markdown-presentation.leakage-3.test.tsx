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

describe("help-markdown-presentation (leakage 3)", () => {
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
      "| **Azure Container Apps** (or equivalent compute), **Azure SQL** | Host application | Customer architecture content, run metadata, manifests, findings, audit events, blobs, secrets by reference | Primary Azure region | Microsoft Product Terms and DPA | 2026-07-25 |",
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
    expect(prepared).not.toContain("run metadata");
    expect(prepared).not.toContain("secrets by reference");
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
      "",
      "Contact your account team during procurement if you need confirmation of the current register.",
    ].join("\n");

    const prepared = alignSubprocessorsResidencyHonesty(source).toLowerCase();

    expect(prepared).not.toContain("update this table");
    expect(prepared).not.toContain("product codebase");
    expect(prepared).not.toContain("before production use");
    expect(prepared).not.toContain("contact your account team");
    expect(prepared).toContain("hosted archlucid saas");
    expect(prepared).toContain("/help/security-trust");
    expect(prepared).toContain("security diligence pack");
    expect(prepared).toContain("current as of 2026-07-25");
  });
  it("aligns subprocessors register product language (TB-1756)", () => {
    const source =
      "Customer architecture content, run metadata, manifests, findings, audit events, blobs, secrets by reference";

    const prepared = alignSubprocessorsRegisterProductLanguage(source).toLowerCase();

    expect(prepared).not.toContain("run metadata");
    expect(prepared).not.toContain("secrets by reference");
    expect(prepared).not.toMatch(/\bblobs\b/);
    expect(prepared).not.toMatch(/\bmanifests\b/);
    expect(prepared).toContain("architecture package data");
    expect(prepared).toContain("stored evidence artifacts");
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
});
