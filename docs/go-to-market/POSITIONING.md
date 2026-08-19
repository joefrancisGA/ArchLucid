> **Reviewed:** 2026-08-03

> **Scope:** ArchLucid positioning — full detail, tables, and links below — plus the closed create/review adversarial evaluation (formerly `CREATE_REVIEW_POSITIONING_ADVERSARIAL_EVALUATION.md`; Done **TB-738**–**TB-747**) and the product datasheet (formerly the body of `PRODUCT_DATASHEET.md`; that filename remains a path-stable alias for PDF/CI callers).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid positioning

**Audience:** Anyone who needs to explain what ArchLucid is and why it matters — in a sentence, a paragraph, or a two-minute conversation.

**Last reviewed:** 2026-07-27 — evidence-package-first alignment (**TB-746**); engineering canonical copy in §0–§1; **owner external-publish sign-off** still required before treating §1 as frozen for paid media.

**Grounding rule:** Every claim maps to a shipped V1 capability. See [V1_SCOPE.md](../library/V1_SCOPE.md) and [COMPETITIVE_LANDSCAPE.md](COMPETITIVE_LANDSCAPE.md) for evidence.

**Relationship to the sponsor brief:** [EXECUTIVE_SPONSOR_BRIEF.md](EXECUTIVE_SPONSOR_BRIEF.md) is the **dominant outward-facing buyer narrative**. This page supports **short explanations and proof-backed pillars** for conversations and datasheets; it must **not contradict** the brief. The brief uses **architecture proof package**; this page standardizes the shorter **architecture package** noun (same governed artifact). If wording here drifts broader than the brief, **tighten here** or promote a deliberate product change into the brief first, then realign.

**Platform:** First-party and reference deployments are **Azure-native**; see [ADR 0020](../architecture/adrs/0020-azure-primary-platform-permanent.md).

---

## 0. Evidence-package-first vocabulary (TB-738 / TB-746)

**Written rule (owner decision 2026-07-10; engineering alignment 2026-07-18):**

| Rule | Guidance |
|------|----------|
| **One noun** | **Architecture package** — the governed unit buyers receive: findings, confidence limits, signed manifest, exports. Reviewed and created packages share the same pipeline outputs. |
| **Two verbs** | **Create** and **review** — symmetric **workflows**, not symmetric **headline** positioning. |
| **Verbs never in the hero** | Marketing heroes, demo openers, and homepage cards lead with **package outcomes** (evidence-backed, defensible, exportable), not "create architecture," generation speed, or "beats ChatGPT" framing. |
| **Trust ladder** | **Review-led** first (sample, intake, evidence-backed review), then a **creation bridge** on the same outputs ([TB-739](GTM_BACKLOG.md) home copy, [TB-742](../library/TECH_BACKLOG.md) created sample, [TB-745](DEMO_QUICKSTART.md#demo-scripts) demo scripts). |

Canonical in-product labels: [`buyer-surface-vocabulary.ts`](../../archlucid-ui/src/lib/vocabulary/buyer-surface-vocabulary.ts). Brand voice: [`BRAND_SYSTEM.md`](../brand/BRAND_SYSTEM.md) §1.

### Create vs review — adversarial evaluation (closed) {#create-vs-review--adversarial-evaluation-closed}

**Status:** Closed — findings shipped as **TB-738**–**TB-747** (all **Done**). Implement detail lives in [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) (`## TB-738` through `## TB-747`). This subsection is the durable assessment pointer for product, UI, and GTM authors updating `/architecture/reviews/new`, home dual-path cards, billing meter nouns, and marketing CTAs.

| Question | Answer |
| --- | --- |
| Symmetric **create** / **review** as **workflows**? | **Yes** — both paths produce the same governed architecture package shape. |
| Symmetric **create** / **review** as **headline positioning**? | **No** — do not pitch two equal product nouns. Subordinate both verbs to the **architecture package** noun (evidence-package-first, review-led trust ladder). |

**One-sentence positioning rule:** Create and review are verbs; the artifact buyers hire ArchLucid for is an **architecture package** with findings, evidence, and a decision record — not “AI creates your architecture” as the lead claim.

**Guardrails for `/architecture/reviews/new`, wizard intake, and marketing CTAs:**

- Do **not** over-promise automated approval or production deployment.
- Do **not** lead create-path copy with commodity “generate from goals” without a born-governed follow-on (findings, risks, evidence, explicit limits).
- Prefer the **review / sample** path as **Recommended first** on first-run home surfaces.

| Theme (evaluation) | Backlog | Outcome (summary) |
| --- | --- | --- |
| List noun + empty states + drift guards | **TB-738** | **Architecture packages** vocabulary; hub/home/nav; Vitest drift guards |
| Home tagline + dual-path trust ladder | **TB-739** | Born-governed create promise; review/sample **Recommended first** |
| Created / Reviewed origin badges | **TB-740** | Package origin on list rows |
| Creation output parity with review | **TB-741** | Same agent pipeline / governance surfaces; create ≠ second-class |
| Inspectable created sample | **TB-742** | Demo seed + showcase created sample |
| Billing meter noun | **TB-743** | Packages/month (buyer-facing); internal keys may remain `review*` |
| Scorecard nav label | **TB-744** | **Architecture scorecard** |
| Demo scripts package-first | **TB-745** | `DEMO_QUICKSTART` / video script realigned |
| Positioning one-noun-two-verbs | **TB-746** | This document’s §0 alignment |
| Create intake feels like drafting | **TB-747** | Create wizard differentiated from evidence-only review intake |

Related: [`CONCEPT_VOCABULARY.md#ui-glossary-v1`](../library/CONCEPT_VOCABULARY.md#ui-glossary-v1) (**Architecture package**) · [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise).

---

## 1. Positioning statement

**One-sentence tagline:** ***Defensible architecture, on demand.***

> For **enterprise architects and the CTOs who sponsor their work**, ArchLucid turns scattered architecture evidence into **governed architecture packages** — evidence-linked findings, stated confidence limits, explicit non-conclusions where proof is missing, and exportable sponsor summaries backed by a signed manifest and audit chain. Unlike **manual architecture review**, which is slow, inconsistent, and undocumented, or **ad-hoc AI tools**, which produce prose without accountability, ArchLucid delivers a **proof-oriented package**: every risk traced to evidence, every recommendation actionable, every decision auditable — obvious from a **finished package** without a founder narrating generation.

**Category:** Architecture Proof Engine — sits between traditional Enterprise Architecture Management (which catalogs but does not analyze) and ad-hoc AI assistance (which analyzes but lacks governance and traceability). **Lead promise:** *Defensible architecture, on demand.*

**GTM companion lines (founder-led / consulting-enabled motion):**

- **Pain-led one-liner:** *ArchLucid turns architecture evidence into governed architecture packages your sponsors can defend — review-led first, creation on the same pipeline.*
- **Founder-led service line (outreach / LinkedIn):** *I use ArchLucid to deliver evidence-backed architecture packages for teams that need defensible decisions, not just diagrams.*

Use these where the buyer is evaluating **a review and report**, not self-serve platform signup. Category tagline and sponsor brief remain authoritative for **product** framing. Named service SKUs and bands: [`QUOTE_TO_PROOF_PACKET.md#productized-service-offers`](QUOTE_TO_PROOF_PACKET.md#productized-service-offers) (`SERVICE_LED_OFFERS.md` alias). Execution tasks: [`GTM_BACKLOG.md`](GTM_BACKLOG.md).

---

## 2. Three value pillars

*The core value pillars (AI-native architecture analysis, Auditable decision trail, Enterprise governance) have been consolidated into the [Sponsor Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md#3-core-value-pillars). Use the brief as the single source of truth for value claims.*

**Pillar 3 proof points on this page:** The narrative for Enterprise governance lives in the brief; the **bullet list under §2 / Pillar 3 below** remains here as a **ship-backed proof reference** for datasheets and sales engineering (implementation anchors, not duplicate buyer story).

**Differentiator language — "audit chain / signed manifest":** These are the two terms to use verbatim with skeptical buyers (sponsors, auditors, procurement) when a prospect asks "what stops this from being just AI output." They are shorthand for two shipped, distinct proof points and should not be blended into one claim:

- **Audit chain** — the evidence → finding → decision → manifest linkage: `ExplainabilityTrace` (what was examined, which rules applied, what was concluded) plus the append-only `dbo.AuditEvents` trail (78 typed events, `DENY UPDATE/DELETE`). This is the **replayable reasoning and decision trail**, not a cryptographic ledger claim.
- **Signed architecture package** — the finalized **architecture package** (API: golden manifest) is content-hash-anchored (`ManifestHash` via `IManifestHashService`), versioned, and immutable once finalized. "Signed" here means **hash-verified and tamper-evident at the package/manifest level**, not a PKI/digital-signature certificate — do not imply the latter to a security-diligence buyer.

Use both terms together ("a signed manifest backed by a full audit chain") when the buyer's objection is "how do I know this wasn't just made up" — see [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) for the comparison table and [`M-08` in `GTM_BACKLOG.md`](GTM_BACKLOG.md) for the copy-alignment task this section satisfies.

**Live deep link in the staging funnel:**

The unauthenticated proof route **`/demo/explain`** (architect workspace / marketing surface) renders the **provenance graph and the citations-bound aggregate explanation side-by-side**, sourced from the seeded Contoso Retail Modernization **review**. When **`Demo:Enabled`** is false, hosts return **`404`** for this route (demo surfaces do not leak to production). Sponsors and pilot evaluators can hit the staging URL directly:

- Staging deep link: `https://staging.archlucid.example.com/demo/explain` (replace host with the active staging deployment)
- Backing API: **`GET /v1/demo/explain`** — same demo-tenant scope as other anonymous demo reads; response includes **`IsDemoData=true`** and a **demo tenant — replace before publishing** banner so screenshots are not quoted as production telemetry
- Wiring, rate limits, and feature gates: **[`SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md)** · demo payload patterns: **[`DEMO_QUICKSTART.md#demo-preview-route-contract-and-safety`](DEMO_QUICKSTART.md#demo-preview-route-contract-and-safety)** (`DEMO_PREVIEW.md` alias)

### Pillar 3: Enterprise governance

*See the [Sponsor Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md#3-core-value-pillars) for details on Enterprise governance.*

**Proof points:**
- Pre-finalize governance gate with configurable severity thresholds and warning-only mode
- Approval workflow with segregation of duties (self-approval blocked, ordinal case-insensitive)
- Approval SLA tracking with `SlaDeadlineUtc` and webhook escalation on breach
- 78 typed audit event constants with CI guard, append-only enforcement (`DENY UPDATE/DELETE`)
- Policy packs with versioning, scope assignments, effective governance resolution
- Compliance drift trend tracking with architect workspace chart

---

## 3. Elevator pitches

*The elevator pitches (including M-18 outreach templates) live in the [Sponsor Sponsor Brief §4](EXECUTIVE_SPONSOR_BRIEF.md#elevator-pitches). Use the brief as the single source of truth for narrative and talk-track.*

---

## 4. Key proof points from the codebase

These are factual claims grounded in what the repository ships today.

> **See it live, not on a slide:** the architect workspace ships a built-in proof page at **`/why-archlucid`** (Core Pilot tier, no extra authority required). It calls `GET /v1/pilots/why-archlucid-snapshot`, `GET /v1/pilots/architecture/reviews/{runId}/first-value-report`, and `GET /v1/explain/architecture/reviews/{runId}/aggregate` against the seeded **Contoso Retail Modernization** demo tenant and renders live `ArchLucidInstrumentation` counters, the sponsor first-value report, and the **review** explanation + citations. Every claim in the table below should reconcile against what shows on that page after `pilot up` (or `POST /v1/demo/seed`).

> **Anonymous buyer self-qualification:** the public marketing site page **`/why`** links to **`GET /v1/marketing/why-archlucid-pack.pdf`** (via Next.js `/api/proxy/...`), which returns a single PDF sourced only from the same cached anonymous demo bundle as `GET /v1/demo/preview` — deterministic, no tenant data, and **404** (not 403) when `Demo:Enabled` is false. The PDF repeats the incumbent comparison with every competitive cell tied to `docs/go-to-market/COMPETITIVE_LANDSCAPE.md` §2.1.

| Claim | Evidence |
|-------|----------|
| Multi-agent AI pipeline with 4 agent types | `IAuthorityRunOrchestrator`, agent types: Topology, Cost, Compliance, Critic |
| 10 finding engine types | `RequirementFindingEngine`, `ComplianceFindingEngine`, `SecurityBaselineFindingEngine`, `CostConstraintFindingEngine`, `TopologyCoverageFindingEngine`, `SecurityCoverageFindingEngine`, `PolicyApplicabilityFindingEngine`, `PolicyCoverageFindingEngine`, `RequirementCoverageFindingEngine`, topology gap findings via `FindingFactory` |
| Explainability trace on every finding | `ExplainabilityTrace`: `GraphNodeIdsExamined`, `RulesApplied`, `DecisionsTaken`, `AlternativePathsConsidered`, `Notes` |
| 78 typed audit event constants | `dbo.AuditEvents`, CI guard on count, append-only enforcement |
| Governance workflow with segregation of duties | `GovernanceApprovalRequests`, self-approval blocked with `GovernanceSelfApprovalException` |
| Pre-finalize governance gate | `PreCommitGovernanceGate` with `BlockCommitMinimumSeverity` and warning-only mode (API still says pre-commit) |
| Approval SLA with escalation | `ApprovalSlaMonitor`, `SlaDeadlineUtc`, HMAC-signed webhook notifications |
| Provenance graph | `ProvenanceBuilder`, `ProvenanceNode`, `ProvenanceEdge`, `ProvenanceCompletenessAnalyzer` |
| Signed, hash-verified architecture package | `IManifestHashService`, `ManifestHash` computed and persisted on finalize/`commit` ([`SqlGoldenManifestRepository`](../../ArchLucid.Persistence/Repositories/SqlGoldenManifestRepository.cs)); immutable once finalized |
| Two-**review** comparison with drift detection | Structured golden-manifest deltas, comparison replay with verify mode (422 on drift) |
| Multi-vendor LLM with fallback | `ILlmProvider`, `LlmProviderDescriptor`, `FallbackAgentCompletionClient` |
| 30+ custom OTel metrics | `ArchLucidInstrumentation`, histograms/counters/gauges |
| Grafana dashboards committed in repo | Authority, SLO, LLM usage, container apps, **review** lifecycle dashboards |
| Policy packs with effective governance | `PolicyPackContentDocument`, scope assignments, `IEffectiveGovernanceResolver` |
| Compliance drift trend | `ComplianceDriftTrendService`, `ComplianceDriftChart` in architect workspace |
| DOCX export with embedded diagrams | Consulting-grade report via `IDocxExportService`, Mermaid → PNG rendering |
| CLI for automation | `archlucid new`, `run`, `status`, `commit`, `artifacts`, `doctor`, `support-bundle`, `trace` |
| Enterprise auth (Entra ID + RBAC) | JwtBearer, API key, Admin/Operator/Reader/Auditor roles, `AuthSafetyGuard` |
| Database-per-tenant catalog isolation | `TenantDatabaseBindings`, scope predicates, [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) |
| Private endpoints + WAF | Terraform modules for SQL/blob private endpoints, Front Door + WAF |
| Agent output quality scoring | Structural completeness + semantic quality, configurable quality gate |
| Prompt versioning | SHA-256 prompt catalog, prompt regression detection in CI |

---

## 5. Category definition

**Architecture Proof Engine** names a product category that combines:

1. **AI-driven analysis** of system designs (topology, cost, compliance, quality)
2. **Enterprise governance** (policy enforcement, approval workflows, compliance gates)
3. **Auditable decision trails** (explainability traces, provenance graphs, durable audit)

### What proof means here {#what-proof-means-here}

> ArchLucid proves that a rigorous, evidence-linked architecture review happened — who reviewed what, against which policy packs, with which findings, confidence limits, and explicit non-conclusions where evidence was missing. It does not prove the architecture will perform under load, in an audit, or in an incident. It proves the decision can be defended with evidence.

This is the canonical answer to the skeptical-buyer question "proof of what, exactly?" — quote it verbatim in datasheets, sponsor conversations, and design-authority meetings. The claim is **proof of diligence and provenance** (audit chain, signed manifest), never proof of runtime soundness. See [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md) for the enforced boundary.

This category sits between traditional **Enterprise Architecture Management** (which catalogs and models but does not analyze) and **ad-hoc AI assistance** (which analyzes but lacks governance and traceability).

```
┌──────────────────────────────────────────────────────────────────┐
│                    Enterprise Architecture                       │
│                                                                  │
│  ┌─────────────┐    ┌──────────────────────┐    ┌─────────────┐ │
│  │ EA Mgmt     │    │ Architecture Proof   │    │ Ad-hoc AI   │ │
│  │ (LeanIX,    │    │ Engine (ArchLucid)   │    │ (ChatGPT,   │ │
│  │  Ardoq)     │    │                      │    │  Copilot)   │ │
│  │             │    │ Analyzes + Governs   │    │             │ │
│  │ Catalogs    │    │ Traces + Audits      │    │ Advises     │ │
│  │ Models      │    │ Enforces + Exports   │    │ (ephemeral) │ │
│  │ Documents   │    │                      │    │             │ │
│  │             │    │                      │    │             │ │
│  │ No AI       │    │ AI + Governance      │    │ AI only     │ │
│  │ Manual      │    │ Automated            │    │ No govern.  │ │
│  └─────────────┘    └──────────────────────┘    └─────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Tagline

**Finalized (2026-05-17):** ***Defensible architecture, on demand.***

Used as the homepage H1, lead promise, and one-sentence positioning tagline across all GTM surfaces. Aligns with the [Sponsor Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md) §1 category line and the §7 messaging guidance below (buyer-outcome-first, no jargon).

<details><summary>Considered alternatives (retained for reference)</summary>

| Tagline | Angle | Why not chosen |
|---------|-------|----------------|
| "Architecture proof engine — evidence, limits, and value without narration." | Proof-machine framing | "Without narration" is internal language; violates §7 "don't lead with implementation" |
| "Architecture decisions you can explain, govern, and audit." | Accountability focus | Longer; lists features rather than a buyer outcome |
| "AI-driven architecture review. Enterprise-grade governance." | Capability + trust | Leads with "AI-driven," which §7 discourages as a headline |
| "From design to decision trail — in minutes, not weeks." | Speed + auditability | Good supporting copy but emphasizes speed over defensibility |
| "Every recommendation traced. Every decision governed." | Transparency + control | Strong secondary line; kept as candidate subhead |

</details>

---

## 7. Messaging "do" and "don't"

| Do | Don't |
|----|-------|
| Lead with the **buyer outcome**: governed **architecture packages** with findings your CTO can act on | Lead with implementation: "multi-agent pipeline" or "10 finding engines" |
| Use buyer vocabulary: **architecture package**, risk, finding, recommended action, evidence, confidence, readiness | Use internal vocabulary as first-impression words: "manifest", "run" (CLI/API noun only), "commit", "coordinator" |
| Say "**Architecture Proof Engine**" when explaining the **category** | Say "AI-powered" as the headline — every tool says this now |
| Emphasize **evidence linkage**: every finding cites what it used | Claim "fully autonomous architecture design" — agents are orchestrated, not autonomous |
| Lead with **review-led trust ladder** — finished packages and evidence-backed review before creation headlines | Lead heroes with **create** or generation speed — symmetric workflows, not symmetric positioning |
| Highlight the **sponsor summary export** — this is what gets budget approved | Position governance workflow as the first selling point (it is the second sale) |
| Position as **complementary** to existing EA tools (LeanIX, Ardoq), not a replacement | Position as a **replacement** for existing EA tools — different category |
| Be honest about V1 limitations (Azure-only, no import connectors yet) | Imply multi-cloud support or integrations that do not exist |
| Reference the **audit chain / signed architecture package** for skeptical buyers: "every finding traces to evidence, and the finalized package is hash-verified" | Lead with "AI" alone — every tool claims AI now; do not call the package "cryptographically signed" or imply a PKI certificate |
| Frame **architecture evidence and review governance** (decisions, risks, traceability) | Headline as **standalone "AI governance platform"** — crowded category; we complement GRC, not replace it |
| Answer "proof of what?" with the canonical proof-scope statement ([§5](#what-proof-means-here)) — proof of diligence and provenance | Imply the package proves runtime soundness, load behavior, security posture of the reviewed system, or incident resilience |
| Describe default packs as **inputs to architecture review** (mapping / findings) | Imply **certification** or full EU AI Act / ISO 42001 program coverage from starter packs |

---

## Product datasheet {#product-datasheet}

Former standalone body: `docs/go-to-market/PRODUCT_DATASHEET.md` → this section (`PRODUCT_DATASHEET.md` remains a path-stable alias for PDF export / CI callers).

<!-- Layout: designed for PDF export at US Letter or A4. Keep under 2 pages rendered. -->

**ArchLucid** | Architecture Proof Engine

*Defensible architecture, on demand — evidence-linked reviews your architects can defend and your CTO can act on.*

### The problem

Architecture review in most enterprises is **slow, inconsistent, and undocumented**.

Reviews depend on a small team of senior architects who apply different standards across projects. Decisions happen in meetings and emails with no durable record. Compliance gaps surface in production — or during audits — long after the design was approved. When regulators ask "who reviewed this design and what did they find?", the answer is often "we are not sure."

### The solution

ArchLucid turns scattered architecture evidence into **prioritized architecture risks with evidence-linked findings you can show without narration** — complete with recommended actions, confidence ratings, limits where the model did not conclude, and an exportable sponsor summary.

Upload your architecture materials. ArchLucid's multi-agent analysis covers topology, cost, compliance, and design quality — and surfaces a findings board where every risk is ranked by severity, traced to evidence, and accompanied by a concrete recommended action. Architects get a defensible architecture package. CTOs get a clear sponsor summary. What used to take weeks now takes minutes, with a full audit trail.

ArchLucid proves the review happened and is defensible — not that the design will perform in production.

### Key capabilities

| Capability | What it does |
|-----------|-------------|
| **AI Architecture Analysis** | Four specialized agents (Topology, Cost, Compliance, Critic) analyze architecture requests through a structured pipeline. 10 finding engines run in parallel. Multi-vendor LLM with automatic fallback. |
| **Explainable Decisions** | Every finding includes a structured `ExplainabilityTrace` — what was examined, what rules applied, what decisions were taken, and why. Provenance graph links evidence to decisions to artifacts. |
| **Enterprise Governance** | Policy packs define compliance rules. Pre-finalize gates block architecture packages when findings exceed severity thresholds. Approval workflows enforce segregation of duties. SLA tracking with escalation. |
| **Architecture Drift Detection** | Compare two architecture iterations with structured deltas. Replay and verify mode detects drift between stored and regenerated outputs. Compliance drift trending over time. |
| **Export and Reporting** | Consulting-grade DOCX reports with embedded architecture diagrams. Markdown export. ZIP artifact bundles. Comparison replay in multiple formats. Sanitized **architecture review board** DOCX/PDF samples: [`docs/go-to-market/samples/`](samples/) — see [`DEMO_QUICKSTART.md#architecture-review-board-export`](DEMO_QUICKSTART.md#architecture-review-board-export) (`samples/README.md` alias). |
| **Durable Audit Trail** | 78 typed audit event types in an append-only SQL store. Paginated search, filtered export (JSON/CSV). CI-enforced event count guard. |

### Architecture (datasheet)

```
┌──────────┐     ┌──────────────┐     ┌─────────────────────────────────┐
│ Architect│────▶│ ArchLucid    │────▶│ AI Agent Pipeline               │
│ (UI/CLI/ │     │ API          │     │                                 │
│  CI/CD)  │◀────│ (.NET 10)    │     │ Context ─▶ Graph ─▶ Findings   │
└──────────┘     └──────┬───────┘     │ ─▶ Decisioning ─▶ Artifacts   │
                        │             └─────────────────────────────────┘
                        │
                 ┌──────┴───────┐
                 │ Azure SQL    │     ┌─────────────────┐
                 │ (per-tenant  │     │ Azure OpenAI    │
                 │  catalogs)   │     │ (multi-vendor)  │
                 └──────────────┘     └─────────────────┘
```

**Architect workspace** — Next.js console for the **architecture review** lifecycle (reviews and legacy **runs** routes, architecture packages, governance, graph, audit), aligned with [CORE_PILOT.md](../CORE_PILOT.md).
**CLI** — `archlucid new`, **`run`** (CLI verb; creates a **review** session — APIs still use `run` / `runId`), `commit` (finalize), `artifacts`, `doctor`, `support-bundle`, `trace`.

### Deployment options

| Option | Best for |
|--------|---------|
| **Vendor-hosted SaaS (Azure)** | Production for customers — service operated by ArchLucid on Azure (Entra, private endpoints, **database-per-tenant** catalog isolation per [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md)); customers integrate via **web**, **CLI**, and **API clients** |
| **Azure Container Apps** | How **we** run the service — Terraform modules for API, worker, SQL, blob, and identity in **our** subscriptions |
| **Docker Compose** | **Optional** local development and evaluation on a prospect’s or engineer’s machine — full-stack profile with SQL, Redis, Azurite (**not** a standard customer deliverable) |

**Not offered as a V1 customer deliverable:** shipping **production** Docker images, customer-managed Kubernetes/Helm bundles, or “install ArchLucid from containers in your data center” packages. See **`docs/PENDING_QUESTIONS.md`** (Resolved, 2026-04-21) and **`docs/CONTAINERIZATION.md`**.

### Security and compliance (datasheet)

| Area | Capability |
|------|-----------|
| **Identity** | Microsoft Entra ID (JWT), API key, RBAC (Admin / Operator / Reader / Auditor) |
| **Data isolation** | **Database-per-tenant** SQL catalogs (`SystemWithPerTenantCatalogs`) plus application-layer scope predicates — **SQL RLS is not the production isolation boundary** ([ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md), [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview)) |
| **Network** | Private endpoints for SQL and blob storage; Azure Front Door with WAF |
| **Audit** | Append-only event store with `DENY UPDATE/DELETE`; export for compliance evidence |
| **Scanning** | OWASP ZAP baseline in CI, Schemathesis API fuzzing, CodeQL, Gitleaks, Trivy |
| **Threat model** | STRIDE threat model documented (`SYSTEM_THREAT_MODEL.md`) |

### Integration points

| Channel | Details |
|---------|---------|
| **REST API** | OpenAPI v1 spec with versioned routes (`/v1/...`), rate limiting, correlation ID |
| **CLI** | .NET global tool or `dotnet run` — full **review** lifecycle (`run` CLI verb; APIs retain `runId`) and diagnostics |
| **Webhooks** | HMAC-signed delivery with optional CloudEvents envelope |
| **Service Bus** | Azure Service Bus with transactional outbox for lifecycle events |
| **Events** | `com.archlucid.*` canonical event types with JSON Schema |
| **API Client** | .NET client library (`ArchLucid.Api.Client`) — SDKs for other languages on roadmap |

### Observability (datasheet)

30+ custom OpenTelemetry metrics, 8 activity sources, W3C trace propagation. Grafana dashboards committed in the repo (authority pipeline, SLO, LLM usage, run lifecycle). Business KPI metrics: runs created, findings by severity, agent quality scores, explanation cache effectiveness.

### Get started (datasheet)

1. **Quickest local evaluation (Docker on your machine):** Run `.\scripts\demo-start.ps1` (Windows) or `./scripts/demo-start.sh` (macOS/Linux), or `docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile full-stack up -d --build` — see [DEMO_QUICKSTART.md](DEMO_QUICKSTART.md) for a five-minute walkthrough. This path is an **optional engineering / seller-led demo** artifact, not something ArchLucid **ships to customers** as the product.
2. **Full-stack without demo overlay:** `docker compose --profile full-stack up -d --build` — same stack without automatic Contoso demo seed (see [CONTAINERIZATION.md](../engineering/CONTAINERIZATION.md)).
3. **First run:** Open `http://localhost:3000/architecture/reviews/new` — seven-step guided wizard (retired bookmark).
4. **See it live, not on a slide:** open `http://localhost:3000/why-archlucid` — the in-product proof page renders live `ArchLucidInstrumentation` counters, the sponsor first-value report, and the run explanation + citations against the seeded Contoso Retail demo tenant.
5. **Record a buyer demo video:** follow [`DEMO_QUICKSTART.md#two-minute--under-3-minute-video-storyboard`](DEMO_QUICKSTART.md#two-minute--under-3-minute-video-storyboard) (live-call scripts + shot table).
6. **Pilot:** Follow the [Pilot Guide](../library/customer-facing/PILOT_GUIDE.md) for production-style deployment.
7. **Learn more:** [COMPETITIVE_LANDSCAPE.md](COMPETITIVE_LANDSCAPE.md) · this positioning page.

**ArchLucid** — *Defensible architecture, on demand. Every recommendation traced. Every decision governed.*

**Get started:** [archlucid.net](https://archlucid.net) · [Request a demo or quote](https://archlucid.net/contact)

---

## 8. Related documents

| Doc | Use |
|-----|-----|
| [`#product-datasheet`](#product-datasheet) · [`PRODUCT_DATASHEET.md`](PRODUCT_DATASHEET.md) (alias) | Two-page datasheet narrative (body lives here) |
| [COMPETITIVE_LANDSCAPE.md](COMPETITIVE_LANDSCAPE.md) | Competitor-by-competitor analysis and differentiation |
| [BUYER_PERSONAS.md](BUYER_PERSONAS.md) | Who buys, why, and how to demo to them |
| [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) | **Locked list prices (2026)**, pilot pricing, re-rate gates, and sensitivity playbook — single source of truth for all price numbers |
| [../V1_SCOPE.md](../library/V1_SCOPE.md) | What V1 actually ships (grounding for all claims) |
| [../GLOSSARY.md](../library/GLOSSARY.md) | Domain terminology for consistent messaging |
| [../archive/../assessments/LATEST_GPT55.md](../archive/../assessments/LATEST_GPT55.md) | Full marketability quality assessment (archived series)
| [trust-center.md](trust-center.md) | Trust center — security overview, DPA template, subprocessors, incident comms, SOC 2 roadmap |
| [BUYER_PERSONAS.md](BUYER_PERSONAS.md#ideal-customer-profile-icp) | ICP definition, scoring matrix, disqualifiers |
| [INTEGRATION_CATALOG.md](INTEGRATION_CATALOG.md) | Available and planned integrations |
| [REFERENCE_NARRATIVE_TEMPLATE.md](REFERENCE_NARRATIVE_TEMPLATE.md) | Case study templates (3 fictional narratives) |
| [`../library/PUBLIC_MARKETING_SITE_TOPOLOGY.md#seo-and-paid-web-acquisition`](../library/PUBLIC_MARKETING_SITE_TOPOLOGY.md#seo-and-paid-web-acquisition) · [SEO_AND_PAID_ACQUISITION.md](SEO_AND_PAID_ACQUISITION.md) (alias) | Organic SEO + disciplined web-paid acquisition playbook (apex, ICP-aligned channels, measurement stance) |
| [GTM_BACKLOG.md](GTM_BACKLOG.md) | Internal service-led sequencing, outreach, and monetization tasks |
| [QUOTE_TO_PROOF_PACKET.md#productized-service-offers](QUOTE_TO_PROOF_PACKET.md#productized-service-offers) · [SERVICE_LED_OFFERS.md](SERVICE_LED_OFFERS.md) (alias) | Named productized consulting SKUs and indicative private bands |
