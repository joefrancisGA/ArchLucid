/**
 * Five benchmarked differentiation rows for the public `/why` page and the
 * `GET /v1/marketing/why-archlucid-pack.pdf` Markdown table. **Keep in lockstep**
 * with `ArchLucid.Application/Pilots/WhyArchLucidPackBuilder.cs` (`BuildDifferentiationMarkdownTable`)
 * — CI enforces byte-for-row equality via `scripts/ci/check_why_archlucid_comparison_sync.py`.
 *
 * Each row is grounded in a capability that exists in this repository today; `citation` is either a
 * public HTTPS URL or the explicit phrase `first-party assertion (no external citation yet)` where we
 * state category baselines without a third-party study.
 */
export type WhyArchLucidComparisonRow = {
  /** One-sentence ArchLucid-only capability (buyer-safe, no pejorative vendor names). */
  claim: string;
  /** Repo path, HTTP route, test class, or runbook anchor a reviewer can open. */
  archlucidEvidence: string;
  /** Neutral category + concrete cost or pattern (hours or “post-hoc only”, etc.). */
  competitorBaseline: string;
  /** External URL **or** the exact first-party disclaimer phrase (see module header). */
  citation: string;
  /** Short narrative (≤4 sentences) rendered under the table row in the PDF pack. */
  narrativeParagraph: string;
};

/**
 * Exactly five rows — marketing page, PDF Markdown, and Vitest all depend on this count.
 */
export const WHY_ARCHLUCID_COMPARISON_ROWS: readonly WhyArchLucidComparisonRow[] = [
  {
    claim:
      "ArchLucid records **typed audit events** in SQL for mutating API work and returns **scope-filtered** listings over `GET /v1/audit` and `GET /v1/audit/search`, so reviewers can anchor evidence to the same tenant/workspace/project slice the operator UI uses.",
    archlucidEvidence:
      "`ArchLucid.Api/Controllers/Admin/AuditController.cs` · `ArchLucid.Persistence.Audit` · `docs/library/AUDIT_COVERAGE_MATRIX.md` · `ArchLucid.Core/Audit/AuditEventTypes.cs`",
    competitorBaseline:
      "Incumbent diagram-and-doc stacks typically scatter decisions across wikis, tickets, and decks; **reconstructing one architecture review cycle** for a single initiative is often a multi-hour manual assembly exercise (**illustrative, not benchmarked** — category pattern, not a cited hours study).",
    citation: "Illustrative category comparison (no external hours study cited)",
    narrativeParagraph:
      "The audit controller is rate-limited and `ReadAuthority`-gated like other list surfaces, but the payload is **append-only rows** keyed to scope, not a free-form page history. The matrix doc lists the **78** event constants so procurement can map controls to rows. Together they mean \"prove what happened on this run\" is a **query**, not an archaeology sprint. Export and CSV tiers remain documented separately from this read surface.",
  },
  {
    claim:
      "ArchLucid isolates **hosted tenant product data in dedicated SQL catalogs** (`SystemWithPerTenantCatalogs`) with scoped repositories and route-tenant HTTP guards — not shared-database RLS.",
    archlucidEvidence:
      "`docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md` · `docs/security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md` · `ProductionSafetyRules.CollectSingleCatalogDisallowedInProductionLike` · `ArchLucid.Api.Tests/Security/TenantIsolationSmokeTests.cs`",
    competitorBaseline:
      "Multi-tenant products that rely on **per-customer schemas** or ad-hoc database splits often add **8–20 DBA/engineering hours** per new tenant for provisioning, migration, and backup policy (**first-party assertion (no external citation yet)**).",
    citation:
      "https://learn.microsoft.com/en-us/azure/azure-sql/database/elastic-pools-overview",
    narrativeParagraph:
      "Each production tenant gets its own product catalog on the elastic pool; bindings and startup validation block the unsafe SingleCatalog mode. Repositories and integration tests enforce scope within the catalog. ADR 0037 records the explicit decision not to rely on SQL RLS so reviewers do not chase a control that was removed in migration 148.",
  },
  {
    claim:
      "Architects can enable **`ArchLucid:Governance:PreCommitGateEnabled`** so **architecture review finalization** consults governance findings and policy assignments **before** the commit succeeds, returning a structured problem response when blocked.",
    archlucidEvidence:
      "`docs/library/PRE_COMMIT_GOVERNANCE_GATE.md` · `ArchLucid.Application/Governance/PreCommitGovernanceGate.cs` · `ArchLucid.Application.Tests/ArchitectureRunCommitPipelineIntegrationTests.cs` (gate exercised)",
    competitorBaseline:
      "Teams that depend on **post-merge pull-request review only** discover policy violations **after** the manifest is already treated as canonical — rework lands in **ITSM-only tools** as incident debt (**first-party assertion (no external citation yet)**).",
    citation: "https://csrc.nist.gov/projects/ssdf",
    narrativeParagraph:
      "The gate is opt-in because some pilots need speed first; when flipped on, the commit path calls the same governance evaluation code paths the docs describe. Integration tests prove the blocked branch emits durable audit semantics. That is a different class of safety than a comment thread checkbox.",
  },
  {
    claim:
      "CI **locks golden-cohort expected manifest fingerprints** via `GoldenCohortBaselineConstants` and `scripts/ci/assert_golden_cohort_baseline_locked.py`, and the **golden-cohort nightly workflow** exercises the cohort on a schedule separate from product unit tests.",
    archlucidEvidence:
      "`ArchLucid.Application/GoldenCohort/GoldenCohortBaselineConstants.cs` · `scripts/ci/assert_golden_cohort_baseline_locked.py` · `.github/workflows/golden-cohort-nightly.yml` · `tests/golden-cohort/cohort.json`",
    competitorBaseline:
      "Manual **prompt regression review** for each model or policy change is a common substitute when no locked cohort exists (**illustrative, not benchmarked** — unstructured diff review, not a cited release cadence study).",
    citation: "first-party assertion (no external citation yet)",
    narrativeParagraph:
      "**(baseline lock pending)** The placeholder SHA constant exists so CI can fail loudly until an owner-approved baseline lock run replaces zeros with real fingerprints. The assert script is the merge-blocking guardrail; the nightly workflow is where longer cohort work runs. Together they document **deterministic drift detection** instead of vibes-based \"the model feels fine.\"",
  },
  {
    claim:
      "After commit, **`IFindingEvidenceChainService`** reconstructs explainability links for findings, and **`GET /v1/authority/reviews/{runId}/provenance`** returns a **decision provenance graph** tying manifest, graph snapshot, findings snapshot, authority trace, and artifacts when the authority pipeline is complete.",
    archlucidEvidence:
      "`ArchLucid.Application/Explanation/IFindingEvidenceChainService.cs` · `ArchLucid.Api/Controllers/Authority/AuthorityQueryController.cs` (provenance action) · `docs/library/KNOWLEDGE_GRAPH.md`",
    competitorBaseline:
      "Static architecture decision logs **without traversable evidence linkage** often require readers to open many attachments per finding (**illustrative, not benchmarked** — category pattern, not a cited attachment-count study).",
    citation: "https://en.wikipedia.org/wiki/Data_provenance",
    narrativeParagraph:
      "The provenance endpoint deliberately returns **422** until the sealed review record, graph snapshot, findings snapshot, and trace exist — that honesty avoids marketing a graph that is not there. The evidence-chain service is what feeds richer explanations and pilot deltas when data is present. The knowledge-graph doc is the operator-facing map of how to read the UI graph modes.",
  },
];
