> **Scope:** Architecture Decision Records (ADR) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).


# Architecture Decision Records (ADR)

**Last reviewed:** 2026-08-02

Short, durable decisions for ArchLucid. Each file is **immutable** once accepted; supersede with a new ADR rather than rewriting history. Historical ADRs removed 2026-08-02 are listed in [`redirects.md`](../../redirects.md#historical-adrs-removed-2026-08-02). **Completed decisions roll-up:** [`completed_adrs.md`](completed_adrs.md).

| ADR | Title |
|-----|--------|
| [0001](0001-hosting-roles-api-worker-combined.md) | Hosting roles: Api, Worker, Combined |
| [0004](0004-transactional-outbox-retrieval-indexing.md) | Transactional outbox for retrieval indexing |
| [0005](0005-llm-completion-pipeline.md) | LLM completion pipeline, cache, quota, metrics |
| [0006](0006-url-path-api-versioning.md) | URL-path API versioning (`/v1`) |
| [0007](0007-effective-governance-merge.md) | Effective governance merge (policy pack resolution) |
| [0008](0008-alert-dedupe-scopes.md) | Alert deduplication scopes |
| [0009](0009-digest-delivery-failure-semantics.md) | Digest delivery failure semantics |
| [0011](0011-inmemory-vs-sql-storage-provider.md) | `ArchLucid:StorageProvider` — InMemory vs Sql |
| [0013](0013-api-versioning-and-json-schema-versioning.md) | API versioning (Asp.Versioning) + JSON **`schemaVersion`** on aggregates |
| [0014](0014-trial-enforcement-boundary.md) | Trial enforcement — server-side gate, run UoW increment, idempotent seats |
| [0015](0015-trial-tier-authentication-model.md) | Trial-tier authentication — External ID (MSA/Google) + optional local email/password |
| [0016](0016-billing-provider-abstraction.md) | Billing provider abstraction — Stripe + Azure Marketplace + SQL idempotency |
| [0017](0017-azure-app-configuration-deferred.md) | Azure App Configuration — **deferred** for v1 on cost grounds (companion: [`AZURE_APP_CONFIGURATION_FUTURE_ADOPTION.md`](../../library/AZURE_APP_CONFIGURATION_FUTURE_ADOPTION.md)) |
| [0018](0018-background-workloads-container-apps-jobs.md) | Background workloads — **Container Apps Jobs** + `ArchLucid.Jobs.Cli` (not Functions); offload manifest + first job `advisory-scan` |
| [0019](0019-logic-apps-standard-edge-orchestration.md) | Azure Logic Apps (Standard) — narrow edge orchestration + human-in-the-loop; complements ADR 0016 / 0018 |
| [0020](0020-azure-primary-platform-permanent.md) | **Azure** as primary and permanent platform — narrative + ops alignment (not multi-cloud hedge) |
| [0024](0024-azure-devops-pipeline-task-parity-with-github-action.md) | Azure DevOps pipeline YAML parity with GitHub Actions — manifest delta job summary + sticky PR thread + PR status (**Status: Accepted**) |
| [0027](0027-demo-preview-cached-anonymous-commit-page.md) | Cached anonymous marketing **`GET /v1/demo/preview`** + **`/demo/preview`** page (**Status: Accepted**) |
| [0030](0030-coordinator-authority-pipeline-unification.md) | Coordinator → Authority pipeline unification (golden manifest / PR sequencing; supersedes removed ADRs 0010, 0021–0022, 0028–0029) |
| [0031](0031-cross-tenant-pattern-library.md) | Cross-tenant pattern library — anonymised vertical guidance (**Status: Accepted** 2026-05-03) |
| [0032](0032-scim-v2-service-provider.md) | SCIM 2.0 inbound provisioning (Enterprise automation) |
| [0033](0033-first-real-value-single-env-var-flip.md) | First real value — `archlucid try --real` + **`ARCHLUCID_REAL_AOAI`** gate |
| [0034](0034-segregation-of-duties-entra-oid-actor-keys.md) | Segregation of duties — Entra JWT `tid`/`oid` canonical actor keys + additive DB columns (**Status: Accepted**) |
| [0035](0035-architecture-invariant-catalog.md) | Architecture invariant catalog — `INV-*` registry + enforcement waves via `TECH_BACKLOG` (**Status: Proposed**) |
| [0037](0037-tenant-isolation-without-rls-defense-in-depth.md) | Tenant isolation without SQL RLS — catalog boundary + layered controls (**Status: Accepted**; supersedes removed ADR 0003) |
| [0038](0038-run-durability-multi-store-outbox-production-secrets.md) | Run durability — async SQL default, transactional authority outbox, unified create UoW, Cosmos graph outbox, production-like Key Vault + SQL MI (**Status: Accepted**) |
| [0039](0039-commit-sealed-evidence-immutability.md) | Commit-sealed evidence immutability — DENY on sealed tables, agent-result enrichments overlay, startup probe (**Status: Accepted**) |
| [0040](0040-tamper-evident-lineage-without-worm-storage.md) | Tamper-evident proof lineage in application layer; **WORM storage tier out of scope** (**Status: Accepted**) |
| [0041](0041-fail-closed-scope-derivation.md) | Fail-closed tenant/workspace/project scope derivation on production-like hosts (**Status: Accepted**) |
| [0042](0042-canonical-run-write-surface.md) | Canonical run-lifecycle write surface — `v1/architecture/*` canonical, `/result` append-only; `v1/runs/*` + `v1/requests` aliases deprecated then **deleted** (TB-919, 2026-07-20) (**Status: Accepted**) |
| [0043](0043-durable-run-export-blob-push-outbox.md) | Durable run-export blob push outbox — replaces fire-and-forget `Task.Run` with `dbo.RunExportBlobPushOutbox` (**Status: Accepted**) |
| [0044](0044-durable-post-commit-projection-outbox.md) | Durable post-commit projection outbox — replaces five commit-path `Task.Run` side effects with `dbo.PostCommitProjectionOutbox` (**Status: Accepted**) |
| [0045](0045-committed-run-header-immutability.md) | Committed run header evidence-anchor immutability — `TR_Runs_SealCommittedHeader` on anchor columns when `GoldenManifestId` is set (**Status: Accepted**) |
| [0046](0046-committed-run-header-fk-repoint-detection.md) | Committed run header FK repoint detection — dangling/cross-run child links on evidence pointers (**Status: Accepted**) |
| [0047](0047-tenant-scoped-query-roslyn-guard.md) | Tenant-scoped persistence SQL Roslyn guard (ARCH006) — compile-time scope binding without RLS (**Status: Accepted**) |
| [0048](0048-socratic-intake-mutable-draft-lifecycle.md) | Socratic intake — mutable **draft-request lifecycle** in front of the single-shot run create (**Status: Accepted**; debate R3/R7/R11, SAQ-013) |
| [0049](0049-actor-descriptor-model.md) | Actor descriptor model — inferred-then-confirmed **set** of `(kind × trust-origin × contract)` triples (**Status: Accepted**; debate R1/R11) |
| [0050](0050-feasibility-classification-transparency-trail.md) | Feasibility classification (hard vs soft; hard is citation-gated) + **mandatory transparency trail** (**Status: Accepted**; debate R4/R5/R6) |
| [0051](0051-question-selection-engine.md) | Question selection engine — deterministic-first, LLM as **bounded selector**, packs own questions, k-anon learning (**Status: Accepted**; L0/L1 shipped, L2/VoI OPEN per O1-remainder; debate R7–R10) |
| [0052](0052-monetization-posture-decision-as-product.md) | Monetization posture — **decision-as-product**, seat license for the expert operator (**Status: Accepted**; debate R6/R13) |
| [0053](0053-enterprise-diagnostic-logging-observability-posture.md) | Enterprise diagnostic logging and observability posture — near-perfect structured, correlated, privacy-safe telemetry for V1 supportability (**Status: Accepted**; enforcement **TB-329–TB-336**) |
| [0054](0054-warm-standby-pool-sizing-sufficient.md) | Warm standby catalog pool sizing sufficient for V1 (**Status: Accepted**) |
| [0055](0055-pre-run-socratic-intake-loop.md) | Pre-run Socratic intake loop — absolute V1 requirement (**Status: Accepted**) |
| [0056](0056-manifest-online-fine-tuning-governance.md) | Manifest online fine-tuning governance (RAG-V2-003 / TB-594) (**Status: Accepted**) |
| [0057](0057-graph-rag-community-summarization-scope-decision.md) | Graph-RAG community summarization (RAG-V2-001 remainder) scope decision — options record; recommends keeping deferred pending G-REAL-06 pilot signal (**Status: Accepted** — decision-only, no feature code authorized) |
| [0058](0058-bounded-generative-question-tier.md) | Bounded generative question tier (L2g) + retrospective question mining (**Status: Proposed**) |
| [0059](0059-spa-bff-http-only-session-plan.md) | SPA BFF / HttpOnly session plan for GA (XSS residual H-10) (**Status: Proposed**) |
| [0060](0060-ai-model-chooser-provider-scope.md) | AI model chooser — provider scope, BYO Azure OpenAI, activation gates (**Status: Accepted** 2026-07-18) |
| [0061](0061-ddos-protection-posture-v1.md) | DDoS protection posture for V1 — Front Door platform DDoS; defer Network Protection (~$2,944/mo) until revisit triggers (**Status: Accepted** 2026-07-21; TB-908) |
| [0064](0064-buyer-vocabulary-api-and-schema-alignment.md) | Buyer-vocabulary API + spine SQL rename on **v1** (no v2) — review/finalize/signed-review-record (**Status: Accepted** 2026-08-05) |
| [0065](0065-curated-multi-engine-model-catalog.md) | Multi-engine model catalog — informed user choice with evaluation evidence **attached not gating**, fail-closed capability ladder + data boundary, two-tier selection authority; **supersedes ADR 0060 D1** (**Status: Accepted** 2026-08-07; TB-2103–TB-2110) |
| [0067](0067-create-architecture-and-review-co-equal-entry-points.md) | **Create architecture** and **Review** as co-equal entry points — no ordinal/funnel framing on the pair, symmetric CTA-inventory guard coverage; parity of entry points **not** of artifacts (**Status: Accepted** 2026-08-12) |
| [0068](0068-architecture-synthesis-and-review-evaluation-kernels.md) | Architecture synthesis and review evaluation are **two kernels** (Option K) — synthesis is not `IAgentExecutor` execute; review remains `AuthorityPipelineStagesExecutor`; amends ADR 0067 implementation standing only (**Status: Accepted** 2026-08-17) |
| [0069](0069-working-desk-one-work-object.md) | Working desk is **one resumable work object** — supersedes ADR 0067 peer start CTAs for Working only; Guided keeps co-equal Create + Review (**Status: Proposed** 2026-09-05) |
| [0070](0070-insight-density-controls-typed-engines.md) | Insight-density score **controls** typed-engine `FindingClassification` — demotion to checklist when predicate fails; R5 category-protect unchanged (**Status: Proposed** 2026-09-05) |
| [**Template (strict sections)**](template.md) | **MUST** include Trade-offs, Constraints, Expected |
| [**Template (full skeleton)**](adr-template-full.md) | Longer skeleton for new numbered ADRs *(not an ADR)* |

**When to add an ADR:** Cross-cutting choice affecting security, data, or ops; multiple valid alternatives; cost of reversal is high.

**Numbering rule:** Next ADR gets the next sequential number. Never reuse a number; never share a number between two files.
