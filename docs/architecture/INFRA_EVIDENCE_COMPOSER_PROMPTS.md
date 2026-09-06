> **Scope:** Copy-paste Composer/Cloud Agent prompts for the infrastructure-evidence plane. Internal engineering only.
> **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) · **V1:** [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.16–2.17 · **ARC-AMPE pack (not this plane):** [`../library/POLICY_PACK_ARC_AMPE_DESIGN.md`](../library/POLICY_PACK_ARC_AMPE_DESIGN.md)

# Infrastructure-evidence Composer prompts

**Created:** 2026-09-04 · **Revised:** 2026-09-04 (full spec: snapshot spine, remediation, ARC-AMPE as snapshot consumer, lineage, branding).

**Status:** ready to run — **one prompt per chat**.

Canonical design: [`INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md). If a prompt and the plane conflict, **the plane wins**.

## Prompt files

| File | IDs |
|------|-----|
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IE01_IE08.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_IE01_IE08.md) | **IE-01–IE-08** shared Azure observation (the only collector) |
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IE09_IE15.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_IE09_IE15.md) | **IE-09–IE-15** operational findings + remediation factory |
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IE16_IE22.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_IE16_IE22.md) | **IE-16–IE-22** Mermaid, diagrams, resource hub, Ask |
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_AE.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_AE.md) | **AE-01–AE-10** ARC-AMPE audit evidence (**no second collector**) + **CW-01** crosswalk |
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_BR.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_BR.md) | **BR-01–BR-09** tenant white-label branding |
| [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IEUX.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_IEUX.md) | **IE-UX-00–IE-UX-05** operator workbenches + Infrastructure nav spine |

## Why this set exists

Owner briefs described four products (remediation factory, subscription capture, ARC-AMPE GRC, white-label). ArchLucid already has extractor ZIPs, hosted Reader polling, `CanonicalObject` / `GraphSnapshot`, aztfexport wrap, `DiagramAst` → Mermaid, review compare, evidence-graph HTTP, Ask, pack #24 ARC-AMPE **architecture themes**, `RiskExceptionRecord`, first-value report branding, and a sealed architecture-finding stream.

Naive implementation would add a second Azure collector, a second finding type named `Finding`, and a second logo store. These prompts **force one observation spine** and **rename collisions**.

## Do not implement from this set

| Item | Why |
|------|-----|
| Second ARC-AMPE ARM/ZIP collector | Plane §1 — selectors over `AzureInventorySnapshot` |
| Inventing ARC-AMPE control text | Import versioned spec only |
| Calling automated eval an auditor conclusion or “compliance score” | Plane §2 |
| AI as evidence (ExactMatch, org docs, authoritative crosswalks, green checkboxes) | **AI explains evidence; it is not the evidence** |
| `terraform apply` / ARM writes / Entra Global Reader | [`V1_SCOPE.md`](../library/V1_SCOPE.md) §3 |
| Replacing aztfexport | §2.17 |
| Merging scanner findings into `FindingsSnapshot` | [`FINDING_STREAM_PRODUCT_OF_RECORD.md`](../library/FINDING_STREAM_PRODUCT_OF_RECORD.md) |
| New coverage `IFindingEngine` | [`HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md) |
| FIT-01–05 re-run; diagram OCR as default-on V1 claim | Archives / IE-20 gated |
| GTM M-90 / M-44 / M-91 / M-92; SOC 2 CPA; third-party pen test | Owner/GTM |
| Desktop review tab collapse | workspace rule |

## Sequencing

Run **IE-01 → IE-04 → IE-02 → IE-03** before audit selectors or Mermaid-from-snapshot. Branding (**BR-***) can start in parallel (no Azure dependency) but **BR-05/BR-06** should follow IE-16 and AE-08 so wrappers have artifacts to brand.

| ID | Title | Depends on |
|----|-------|------------|
| **IE-01** | Inventory snapshot domain + SQL | plane |
| **IE-04** | Stable `CloudResourceId` | IE-01 |
| **IE-02** | **The** Azure collector fidelity (script + hosted) | IE-01 |
| **IE-03** | Materialize snapshot → graph | IE-02, IE-04 |
| **IE-05** | Advisory Terraform representation | IE-03 |
| **IE-06** | Semantic diff (+ evidence-invalidation hooks) | IE-03 |
| **IE-07** | Infrastructure baselines + drift approval | IE-06 |
| **IE-08** | Diff narrative / trends (AI cites rows only) | IE-06 |
| **IE-10** | Pattern registry | plane (parallel) |
| **IE-09** | Operational finding ingest | IE-04 |
| **IE-11** | Deterministic matcher | IE-09, IE-10 |
| **IE-12** | Operational exceptions | IE-09 |
| **IE-13** | Remediation workflow (no apply) | IE-11, IE-12 |
| **IE-14** | Pattern UI | IE-10 |
| **IE-15** | Waves + metrics | IE-13 |
| **IE-16** | Mermaid via `DiagramAst` | IE-03 |
| **IE-17** | Render validate / repair / fallback | IE-16 |
| **IE-18** | Structured diagram ingest | IE-04 |
| **IE-19** | Diagram ↔ snapshot reconciliation | IE-03, IE-18 |
| **IE-20** | Vision ingest (default off) | IE-18 |
| **AE-01** | Audit framework/control ingest (no invented controls) | plane |
| **AE-02** | Evidence requirements + **selectors** (not collectors) | AE-01, IE-03 |
| **AE-03** | Control→evidence mapping + deterministic eval | AE-02 |
| **AE-04** | Immutable `AuditEvidenceSnapshot` (references inventory snapshot) | AE-02, IE-03 |
| **AE-05** | Freshness gate | AE-04 |
| **AE-06** | Readiness vs compliance dashboards | AE-03, AE-05 |
| **AE-07** | Manual/hybrid evidence (no LLM-minted docs) | AE-01 |
| **AE-08** | Auditor package export | AE-04, AE-07, BR-03 if branding landed |
| **AE-09** | Continuous re-eval on inventory diff + remediation handoff | IE-06, IE-13, AE-04 |
| **AE-10** | Evidence lineage API/UI (chain of custody) | AE-03, IE-04 |
| **CW-01** | Security crosswalk engine | AE-01, IE-10 |
| **IE-21** | Resource evidence hub | IE-05, IE-06, IE-09, IE-16, IE-19, AE-10 |
| **IE-22** | Ask grounding | IE-21 |
| **BR-01–BR-04** | Branding domain, assets, resolver, display rules | plane (parallel with IE-01) |
| **BR-05–BR-07** | Graphics, reports, UI tokens | BR-03, IE-16, AE-08 for wrappers |
| **BR-08** | Admin Settings UI | BR-02, BR-03 |
| **BR-09** | Isolation/a11y/fallback tests | BR-07, BR-08 |
| **IE-UX-00** | Infrastructure nav spine + route stubs | IE-01–IE-22, AE-01–AE-10, BR-01–BR-09 |
| **IE-UX-01** | Terraform advisory + drift workbench | IE-UX-00, IE-05–IE-08 |
| **IE-UX-02** | Large Mermaid viewer + server PNG export | IE-UX-00, IE-16, IE-17, BR-05 |
| **IE-UX-03** | Diagram reconciliation workbench | IE-UX-00, IE-18, IE-19 |
| **IE-UX-04** | Cloud resource hub + Infrastructure Ask | IE-UX-00, IE-21, IE-22, AE-10 |
| **IE-UX-05** | Remediation factory operator UI | IE-UX-00, IE-09–IE-15, IE-UX-04 |

Run **IE-UX-00 first** after backend batches land; then IE-UX-01–IE-UX-05 in order (or parallel only when stubs from IE-UX-00 already exist). Nav contract: [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IEUX.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_IEUX.md).

**Run one prompt per chat.** Feature branch per prompt (`cursor/<short-name>-9cc3`). Name the branch in any commit/push request.

## Global constraints (every prompt)

- Read the plane doc first. **One Azure collector family.** Audit code must not new up ARM clients.
- **AI explains evidence; AI is not the evidence.**
- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. Blank line before `if` / `foreach` unless first in method. Check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests.**
- ADR 0037: `TenantId` on every new table. Isolation test modeled on `SqlAzureExtractorPackageRepositoryScopeIsolationSqlIntegrationTests`.
- DbUp next unused number **and** `ArchLucid.sql` **and** `Migrations/Rollback/Rnnn_*.sql` ([`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md)).
- HTTP: [`OPENAPI_CONTRACT_DRIFT.md`](../library/OPENAPI_CONTRACT_DRIFT.md); `python scripts/ci/assert_route_tier_policy_nav.py --sync`; mutating routes in [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md).
- Audit event constants: `ArchLucid.Core/Audit/AuditEventTypes.InfraEvidence.cs` and `.Branding.cs` as needed (`AuditEventTypes_DoNotCollideAcrossPipelinesTests`).
- Working-tree check before editing tracked files. Stage only this prompt’s paths. **No `git add -A`.**
- One scoped compile; one retry on exit 1. No new NuGet unless called out.
- UI: Carbon, `EnterpriseTable`, Operate disclosure, no desktop tab collapse, mermaid dynamic import policy.
- Do not start G-REAL-06 live spend, SOC 2 CPA, or third-party pen test.

## Suggested compile scopes

| IDs | `-ProjectPath` |
|-----|----------------|
| IE-01, IE-04, IE-06, IE-07, IE-09, IE-12, AE-01, AE-04, AE-05, BR-01 | `ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj` |
| IE-02 | `ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj` |
| IE-03, IE-16 | `ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj` |
| IE-05 | `ArchLucid.Cli.Tests/ArchLucid.Cli.Tests.csproj` |
| IE-08, IE-11, IE-13, IE-15, IE-19, IE-21, IE-22, AE-03, AE-06, AE-09, AE-10, CW-01 | `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` |
| IE-10, IE-14, AE-02, AE-08, BR-08 | `ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj` |
| IE-17, BR-05 | `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` |
| IE-18, IE-20, AE-07 | `ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj` |
| BR-02, BR-03, BR-09 | `ArchLucid.Application.Tests` + `archlucid-ui` Vitest as specified in the prompt |
| IE-UX-00 | `archlucid-ui` typecheck + nav Vitest guards |
| IE-UX-01, IE-UX-03, IE-UX-04 | `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` |
| IE-UX-02 | `ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj` |
| IE-UX-05 | `ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj` |
