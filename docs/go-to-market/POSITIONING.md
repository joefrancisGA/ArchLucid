> **Reviewed:** 2026-07-25

> **Scope:** ArchLucid positioning - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid positioning

**Audience:** Anyone who needs to explain what ArchLucid is and why it matters — in a sentence, a paragraph, or a two-minute conversation.

**Last reviewed:** 2026-07-25 — evidence-package-first alignment (**TB-746**); engineering canonical copy in §0–§1; **owner external-publish sign-off** still required before treating §1 as frozen for paid media.

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
| **Trust ladder** | **Review-led** first (sample, intake, evidence-backed review), then a **creation bridge** on the same outputs ([TB-739](GTM_BACKLOG.md) home copy, [TB-742](../library/TECH_BACKLOG.md) created sample, [TB-745](DEMO_VIDEO_SCRIPT.md) demo scripts). |

Canonical in-product labels: [`buyer-surface-vocabulary.ts`](../../archlucid-ui/src/lib/buyer-surface-vocabulary.ts). Brand voice: [`BRAND_SYSTEM.md`](../brand/BRAND_SYSTEM.md) §1.

---

## 1. Positioning statement

**One-sentence tagline:** ***Defensible architecture, on demand.***

> For **enterprise architects and the CTOs who sponsor their work**, ArchLucid turns scattered architecture evidence into **governed architecture packages** — evidence-linked findings, stated confidence limits, explicit non-conclusions where proof is missing, and exportable sponsor summaries backed by a signed manifest and audit chain. Unlike **manual architecture review**, which is slow, inconsistent, and undocumented, or **ad-hoc AI tools**, which produce prose without accountability, ArchLucid delivers a **proof-oriented package**: every risk traced to evidence, every recommendation actionable, every decision auditable — obvious from a **finished package** without a founder narrating generation.

**Category:** Architecture Proof Engine — sits between traditional Enterprise Architecture Management (which catalogs but does not analyze) and ad-hoc AI assistance (which analyzes but lacks governance and traceability). **Lead promise:** *Defensible architecture, on demand.*

**GTM companion lines (founder-led / consulting-enabled motion):**

- **Pain-led one-liner:** *ArchLucid turns architecture evidence into governed architecture packages your sponsors can defend — review-led first, creation on the same pipeline.*
- **Founder-led service line (outreach / LinkedIn):** *I use ArchLucid to deliver evidence-backed architecture packages for teams that need defensible decisions, not just diagrams.*

Use these where the buyer is evaluating **a review and report**, not self-serve platform signup. Category tagline and sponsor brief remain authoritative for **product** framing. Named service SKUs and bands: [`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md). Execution tasks: [`GTM_BACKLOG.md`](GTM_BACKLOG.md).

---

## 2. Three value pillars

*The core value pillars (AI-native architecture analysis, Auditable decision trail, Enterprise governance) have been consolidated into the [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md#3-core-value-pillars). Use the brief as the single source of truth for value claims.*

**Pillar 3 proof points on this page:** The narrative for Enterprise governance lives in the brief; the **bullet list under §2 / Pillar 3 below** remains here as a **ship-backed proof reference** for datasheets and sales engineering (implementation anchors, not duplicate buyer story).

**Differentiator language — "audit chain / signed manifest":** These are the two terms to use verbatim with skeptical buyers (sponsors, auditors, procurement) when a prospect asks "what stops this from being just AI output." They are shorthand for two shipped, distinct proof points and should not be blended into one claim:

- **Audit chain** — the evidence → finding → decision → manifest linkage: `ExplainabilityTrace` (what was examined, which rules applied, what was concluded) plus the append-only `dbo.AuditEvents` trail (78 typed events, `DENY UPDATE/DELETE`). This is the **replayable reasoning and decision trail**, not a cryptographic ledger claim.
- **Signed architecture package** — the finalized **architecture package** (API: golden manifest) is content-hash-anchored (`ManifestHash` via `IManifestHashService`), versioned, and immutable once finalized. "Signed" here means **hash-verified and tamper-evident at the package/manifest level**, not a PKI/digital-signature certificate — do not imply the latter to a security-diligence buyer.

Use both terms together ("a signed manifest backed by a full audit chain") when the buyer's objection is "how do I know this wasn't just made up" — see [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) for the comparison table and [`M-08` in `GTM_BACKLOG.md`](GTM_BACKLOG.md) for the copy-alignment task this section satisfies.

**Live deep link in the staging funnel:**

The unauthenticated proof route **`/demo/explain`** (architect workspace / marketing surface) renders the **provenance graph and the citations-bound aggregate explanation side-by-side**, sourced from the seeded Contoso Retail Modernization **review**. When **`Demo:Enabled`** is false, hosts return **`404`** for this route (demo surfaces do not leak to production). Sponsors and pilot evaluators can hit the staging URL directly:

- Staging deep link: `https://staging.archlucid.example.com/demo/explain` (replace host with the active staging deployment)
- Backing API: **`GET /v1/demo/explain`** — same demo-tenant scope as other anonymous demo reads; response includes **`IsDemoData=true`** and a **demo tenant — replace before publishing** banner so screenshots are not quoted as production telemetry
- Wiring, rate limits, and feature gates: **[`SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md)** · demo payload patterns: **[`DEMO_PREVIEW.md`](../library/DEMO_PREVIEW.md)**

### Pillar 3: Enterprise governance

*See the [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md#3-core-value-pillars) for details on Enterprise governance.*

**Proof points:**
- Pre-finalize governance gate with configurable severity thresholds and warning-only mode
- Approval workflow with segregation of duties (self-approval blocked, ordinal case-insensitive)
- Approval SLA tracking with `SlaDeadlineUtc` and webhook escalation on breach
- 78 typed audit event constants with CI guard, append-only enforcement (`DENY UPDATE/DELETE`)
- Policy packs with versioning, scope assignments, effective governance resolution
- Compliance drift trend tracking with architect workspace chart

---

## 3. Elevator pitches

*The elevator pitches have been consolidated into the [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md#4-elevator-pitches). Use the brief as the single source of truth for narrative.*

---

## 4. Key proof points from the codebase

These are factual claims grounded in what the repository ships today.

> **See it live, not on a slide:** the architect workspace ships a built-in proof page at **`/why-archlucid`** (Core Pilot tier, no extra authority required). It calls `GET /v1/pilots/why-archlucid-snapshot`, `GET /v1/pilots/runs/{runId}/first-value-report`, and `GET /v1/explain/runs/{runId}/aggregate` against the seeded **Contoso Retail Modernization** demo tenant and renders live `ArchLucidInstrumentation` counters, the sponsor first-value report, and the **review** explanation + citations. Every claim in the table below should reconcile against what shows on that page after `pilot up` (or `POST /v1/demo/seed`).

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

Used as the homepage H1, lead promise, and one-sentence positioning tagline across all GTM surfaces. Aligns with the [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md) §1 category line and the §7 messaging guidance below (buyer-outcome-first, no jargon).

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
| Highlight the **executive summary export** — this is what gets budget approved | Position governance workflow as the first selling point (it is the second sale) |
| Position as **complementary** to existing EA tools (LeanIX, Ardoq), not a replacement | Position as a **replacement** for existing EA tools — different category |
| Be honest about V1 limitations (Azure-only, no import connectors yet) | Imply multi-cloud support or integrations that do not exist |
| Reference the **audit chain / signed architecture package** for skeptical buyers: "every finding traces to evidence, and the finalized package is hash-verified" | Lead with "AI" alone — every tool claims AI now; do not call the package "cryptographically signed" or imply a PKI certificate |
| Frame **architecture evidence and review governance** (decisions, risks, traceability) | Headline as **standalone "AI governance platform"** — crowded category; we complement GRC, not replace it |
| Describe default packs as **inputs to architecture review** (mapping / findings) | Imply **certification** or full EU AI Act / ISO 42001 program coverage from starter packs |

---

## 8. Related documents

| Doc | Use |
|-----|-----|
| [COMPETITIVE_LANDSCAPE.md](COMPETITIVE_LANDSCAPE.md) | Competitor-by-competitor analysis and differentiation |
| [BUYER_PERSONAS.md](BUYER_PERSONAS.md) | Who buys, why, and how to demo to them |
| [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) | **Locked list prices (2026)**, pilot pricing, re-rate gates, and sensitivity playbook — single source of truth for all price numbers |
| [../V1_SCOPE.md](../library/V1_SCOPE.md) | What V1 actually ships (grounding for all claims) |
| [../GLOSSARY.md](../library/GLOSSARY.md) | Domain terminology for consistent messaging |
| [../archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md](../archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Full marketability quality assessment (archived series)
| [trust-center.md](trust-center.md) | Trust center — security overview, DPA template, subprocessors, incident comms, SOC 2 roadmap |
| [BUYER_PERSONAS.md](BUYER_PERSONAS.md#ideal-customer-profile-icp) | ICP definition, scoring matrix, disqualifiers |
| [INTEGRATION_CATALOG.md](INTEGRATION_CATALOG.md) | Available and planned integrations |
| [REFERENCE_NARRATIVE_TEMPLATE.md](REFERENCE_NARRATIVE_TEMPLATE.md) | Case study templates (3 fictional narratives) |
| [SEO_AND_PAID_ACQUISITION.md](SEO_AND_PAID_ACQUISITION.md) | Organic SEO + disciplined web-paid acquisition playbook (apex, ICP-aligned channels, measurement stance) |
| [GTM_BACKLOG.md](GTM_BACKLOG.md) | Internal service-led sequencing, outreach, and monetization tasks |
| [SERVICE_LED_OFFERS.md](SERVICE_LED_OFFERS.md) | Named productized consulting SKUs and indicative private bands |
