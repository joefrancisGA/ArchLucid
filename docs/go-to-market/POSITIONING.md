> **Scope:** ArchLucid positioning - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid positioning

**Audience:** Anyone who needs to explain what ArchLucid is and why it matters — in a sentence, a paragraph, or a two-minute conversation.

**Last reviewed:** 2026-05-17 (service-led GTM companion lines)

**Grounding rule:** Every claim maps to a shipped V1 capability. See [V1_SCOPE.md](../library/V1_SCOPE.md) and [COMPETITIVE_LANDSCAPE.md](COMPETITIVE_LANDSCAPE.md) for evidence.

**Relationship to the sponsor brief:** [EXECUTIVE_SPONSOR_BRIEF.md](EXECUTIVE_SPONSOR_BRIEF.md) is the **dominant outward-facing buyer narrative**. This page supports **short explanations and proof-backed pillars** for conversations and datasheets; it must **not contradict** the brief. If wording here drifts broader than the brief, **tighten here** or promote a deliberate product change into the brief first, then realign.

**Platform:** First-party and reference deployments are **Azure-native**; see [ADR 0020](../architecture/adrs/0020-azure-primary-platform-permanent.md).

---

## 1. Positioning statement

**One-sentence tagline:** ***Defensible architecture, on demand.***

> For **enterprise architects and the CTOs who sponsor their work**, ArchLucid turns scattered architecture evidence into a **prioritized, evidence-linked risk review** — complete with recommended actions, confidence ratings, explicit limits where the system does not conclude, and an exportable executive summary. Unlike **manual architecture review** which is slow, inconsistent, and undocumented, or **ad-hoc AI tools** which produce prose without accountability, ArchLucid delivers a **proof-oriented package**: every risk traced to evidence, every recommendation actionable, every decision auditable — obvious without a founder narrating it.

**Category:** Architecture Proof Engine — sits between traditional Enterprise Architecture Management (which catalogs but does not analyze) and ad-hoc AI assistance (which analyzes but lacks governance and traceability). **Lead promise:** *Defensible architecture, on demand.*

**GTM companion lines (founder-led / consulting-enabled motion):**

- **Pain-led one-liner:** *ArchLucid turns architecture review from scattered opinion into evidence-backed decisions.*
- **Founder-led service line (outreach / LinkedIn):** *I use ArchLucid to deliver evidence-backed AI and cloud architecture reviews for teams that need defensible decisions, not just diagrams.*

Use these where the buyer is evaluating **a review and report**, not self-serve platform signup. Category tagline and sponsor brief remain authoritative for **product** framing. Named service SKUs and bands: [`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md). Execution tasks: [`GTM_BACKLOG.md`](GTM_BACKLOG.md).

---

## 2. Three value pillars

*The core value pillars (AI-native architecture analysis, Auditable decision trail, Enterprise governance) have been consolidated into the [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md#3-core-value-pillars). Use the brief as the single source of truth for value claims.*

**Live deep link in the staging funnel:**

The unauthenticated proof route **`/demo/explain`** (operator shell) renders the **provenance graph and the citations-bound aggregate explanation side-by-side**, sourced from the seeded Contoso Retail Modernization run. The route is hard-blocked from non-`Demo:Enabled=true` deployments by the `[FeatureGate(FeatureGateKey.DemoEnabled)]` filter — production hosts return `404` so the demo surface cannot leak. Sponsors and pilot evaluators can hit the staging URL directly:

- Staging deep link: `https://staging.archlucid.example.com/demo/explain` (replace host with the active staging deployment)
- Backing API: `GET /v1/demo/explain` — server-side `DemoReadModelClient` composes the same application services as `/v1/explain` and `/v1/provenance`, but **hard-pinned to the demo tenant scope** (the underlying authenticated routes are unchanged)
- Always returns `IsDemoData=true` and a "demo tenant — replace before publishing" status banner so screenshots cannot be quoted as production telemetry

### Pillar 3: Enterprise governance

*See the [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md#3-core-value-pillars) for details on Enterprise governance.*

**Proof points:**
- Pre-commit governance gate with configurable severity thresholds and warning-only mode
- Approval workflow with segregation of duties (self-approval blocked, ordinal case-insensitive)
- Approval SLA tracking with `SlaDeadlineUtc` and webhook escalation on breach
- 78 typed audit event constants with CI guard, append-only enforcement (`DENY UPDATE/DELETE`)
- Policy packs with versioning, scope assignments, effective governance resolution
- Compliance drift trend tracking with operator UI chart

---

## 3. Elevator pitches

*The elevator pitches have been consolidated into the [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md#4-elevator-pitches). Use the brief as the single source of truth for narrative.*

---

## 4. Key proof points from the codebase

These are factual claims grounded in what the repository ships today.

> **See it live, not on a slide:** the operator shell ships a built-in proof page at **`/why-archlucid`** (Core Pilot tier, no extra authority required). It calls `GET /v1/pilots/why-archlucid-snapshot`, `GET /v1/pilots/runs/{runId}/first-value-report`, and `GET /v1/explain/runs/{runId}/aggregate` against the seeded **Contoso Retail Modernization** demo tenant and renders live `ArchLucidInstrumentation` counters, the sponsor first-value report, and the run explanation + citations. Every claim in the table below should reconcile against what shows on that page after `pilot up` (or `POST /v1/demo/seed`).

> **Anonymous buyer self-qualification:** the public marketing site page **`/why`** links to **`GET /v1/marketing/why-archlucid-pack.pdf`** (via Next.js `/api/proxy/...`), which returns a single PDF sourced only from the same cached anonymous demo bundle as `GET /v1/demo/preview` — deterministic, no tenant data, and **404** (not 403) when `Demo:Enabled` is false. The PDF repeats the incumbent comparison with every competitive cell tied to `docs/go-to-market/COMPETITIVE_LANDSCAPE.md` §2.1.

| Claim | Evidence |
|-------|----------|
| Multi-agent AI pipeline with 4 agent types | `IAuthorityRunOrchestrator`, agent types: Topology, Cost, Compliance, Critic |
| 10 finding engine types | `RequirementFindingEngine`, `ComplianceFindingEngine`, `SecurityBaselineFindingEngine`, `CostConstraintFindingEngine`, `TopologyCoverageFindingEngine`, `SecurityCoverageFindingEngine`, `PolicyApplicabilityFindingEngine`, `PolicyCoverageFindingEngine`, `RequirementCoverageFindingEngine`, topology gap findings via `FindingFactory` |
| Explainability trace on every finding | `ExplainabilityTrace`: `GraphNodeIdsExamined`, `RulesApplied`, `DecisionsTaken`, `AlternativePathsConsidered`, `Notes` |
| 78 typed audit event constants | `dbo.AuditEvents`, CI guard on count, append-only enforcement |
| Governance workflow with segregation of duties | `GovernanceApprovalRequests`, self-approval blocked with `GovernanceSelfApprovalException` |
| Pre-commit governance gate | `PreCommitGovernanceGate` with `BlockCommitMinimumSeverity` and warning-only mode |
| Approval SLA with escalation | `ApprovalSlaMonitor`, `SlaDeadlineUtc`, HMAC-signed webhook notifications |
| Provenance graph | `ProvenanceBuilder`, `ProvenanceNode`, `ProvenanceEdge`, `ProvenanceCompletenessAnalyzer` |
| Two-run comparison with drift detection | Structured golden-manifest deltas, comparison replay with verify mode (422 on drift) |
| Multi-vendor LLM with fallback | `ILlmProvider`, `LlmProviderDescriptor`, `FallbackAgentCompletionClient` |
| 30+ custom OTel metrics | `ArchLucidInstrumentation`, histograms/counters/gauges |
| Grafana dashboards committed in repo | Authority, SLO, LLM usage, container apps, run lifecycle dashboards |
| Policy packs with effective governance | `PolicyPackContentDocument`, scope assignments, `IEffectiveGovernanceResolver` |
| Compliance drift trend | `ComplianceDriftTrendService`, `ComplianceDriftChart` in operator UI |
| DOCX export with embedded diagrams | Consulting-grade report via `IDocxExportService`, Mermaid → PNG rendering |
| CLI for automation | `archlucid new`, `run`, `status`, `commit`, `artifacts`, `doctor`, `support-bundle`, `trace` |
| Enterprise auth (Entra ID + RBAC) | JwtBearer, API key, Admin/Operator/Reader/Auditor roles, `AuthSafetyGuard` |
| SQL RLS for multi-tenant isolation | `SESSION_CONTEXT`, scope columns, ADR 0003 |
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
| Lead with the **buyer outcome**: "architecture risk review in minutes, findings your CTO can act on" | Lead with implementation: "multi-agent pipeline" or "10 finding engines" |
| Use buyer vocabulary: **risk, finding, recommended action, evidence, confidence, readiness** | Use internal vocabulary as first-impression words: "manifest", "run", "commit", "coordinator" |
| Say "**Architecture Proof Engine**" when explaining the **category** | Say "AI-powered" as the headline — every tool says this now |
| Emphasize **evidence linkage**: every finding cites what it used | Claim "fully autonomous architecture design" — agents are orchestrated, not autonomous |
| Lead with **architecture review** — AI is the engine, not the promise | Over-promise on AI accuracy — frame findings as decision support, not legal attestation |
| Highlight the **executive summary export** — this is what gets budget approved | Position governance workflow as the first selling point (it is the second sale) |
| Position as **complementary** to existing EA tools (LeanIX, Ardoq), not a replacement | Position as a **replacement** for existing EA tools — different category |
| Be honest about V1 limitations (Azure-only, no import connectors yet) | Imply multi-cloud support or integrations that do not exist |
| Reference the **audit trail** for skeptical buyers: "every finding traces to evidence" | Lead with "AI" alone — every tool claims AI now |
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
| [../MARKETABILITY_ASSESSMENT_2026_04_15.md](../library/MARKETABILITY_ASSESSMENT_2026_04_15.md) | Full marketability quality assessment |
| [TRUST_CENTER.md](TRUST_CENTER.md) | Trust center — security overview, DPA template, subprocessors, incident comms, SOC 2 roadmap |
| [IDEAL_CUSTOMER_PROFILE.md](IDEAL_CUSTOMER_PROFILE.md) | ICP definition, scoring matrix, disqualifiers |
| [INTEGRATION_CATALOG.md](INTEGRATION_CATALOG.md) | Available and planned integrations |
| [REFERENCE_NARRATIVE_TEMPLATE.md](REFERENCE_NARRATIVE_TEMPLATE.md) | Case study templates (3 fictional narratives) |
| [SEO_AND_PAID_ACQUISITION.md](SEO_AND_PAID_ACQUISITION.md) | Organic SEO + disciplined web-paid acquisition playbook (apex, ICP-aligned channels, measurement stance) |
| [GTM_BACKLOG.md](GTM_BACKLOG.md) | Internal service-led sequencing, outreach, and monetization tasks |
| [SERVICE_LED_OFFERS.md](SERVICE_LED_OFFERS.md) | Named productized consulting SKUs and indicative private bands |
