> **Scope:** Historical navigation-only synthesis from a docs inventory ZIP pass — **not authoritative** over source markdown. For routing use **[`START_HERE.md`](START_HERE.md)** and **[`library/REPO_DIGEST.md`](library/REPO_DIGEST.md)**. For assessment workflow (rolling pass under **`docs/assessments/`**), use **[`library/ASSESSMENT_INPUTS.md`](library/ASSESSMENT_INPUTS.md)** — **do not cite this file or a single assessment filename as durable product truth.**
>
> **Status:** deprecated — superseded by the spine docs above.

# ArchLucid Internal Documentation Review and Master Summary

**Do not treat this file as current product truth.** It is a **navigation and inventory aid** from a point-in-time ZIP review. For authoritative entry and routing, use **[`START_HERE.md`](START_HERE.md)**; for engineering skim and anchors, **[`library/REPO_DIGEST.md`](library/REPO_DIGEST.md)**; for weighted readiness **workflow**, **[`library/ASSESSMENT_INPUTS.md`](library/ASSESSMENT_INPUTS.md)**.

Generated: 2026-05-17

Source inspected: `docs.zip` extracted under `docs/`. This file is a synthesized internal working document intended to help organize and navigate the documentation set; it is not a substitute for authoritative source files.

---

## Part 1 — Executive assessment

ArchLucid has an unusually rich internal documentation corpus for a young product. The strength of the corpus is that nearly every major concern has been written down somewhere: architecture, API contracts, authority projection, review packages, governance, buyer narrative, security posture, deployment, operations, testing, and go-to-market collateral. The weakness is that the corpus has grown by accretion: many documents are useful, but the reader must infer what is canonical, what is historical, what is buyer-facing, what is operator-facing, and what is only a working note.

The most important organizational problem is not missing content. It is **authority management**. The repository needs fewer primary entry points, stronger status metadata, a stricter folder taxonomy, and a clearer distinction between current source-of-truth documents and archived working history.

### High-level document inventory

- Markdown files: **716**
- Non-archive Markdown files: **553**
- Archive Markdown files: **163**
- Total Markdown size: **49.7 MB**
- README files: **23**

### Folder distribution

| Folder | Markdown files | Comment |
|---|---:|---|
| `library` | 217 | Deep reference library; needs stronger index and canonical/secondary separation. |
| `archive` | 163 | Large historical mass; should be excluded from normal navigation and search by default. |
| `go-to-market` | 91 | Strong commercial corpus; should separate public, buyer, procurement, and internal sales enablement. |
| `runbooks` | 64 | Operational depth; should be task indexed and linked from operator atlas. |
| `architecture` | 44 | Contains ADRs and architecture spine; should remain one of the primary authority areas. |
| `security` | 40 | Important trust evidence; needs strict status metadata and public/internal split. |
| `integrations` | 31 |  |
| `quality` | 9 |  |
| `engineering` | 8 |  |
| `deployment` | 6 |  |
| `onboarding` | 6 |  |
| `demo` | 3 |  |
| `evidence` | 3 |  |
| `templates` | 3 |  |
| `artifacts` | 2 |  |
| `compliance` | 2 |  |
| `operations` | 2 |  |
| `ui` | 2 |  |
| `ARCHITECTURE_ON_ONE_PAGE.md` | 1 |  |
| `BUYER_FIRST_30_MINUTES.md` | 1 |  |
| `CHANGELOG.md` | 1 |  |
| `CONTRIBUTOR_ON_ONE_PAGE.md` | 1 |  |
| `CORE_PILOT.md` | 1 |  |
| `PENDING_QUESTIONS.md` | 1 |  |
| `READ_THIS_FIRST.md` | 1 |  |
| `START_HERE.md` | 1 |  |
| `TROUBLESHOOTING.md` | 1 |  |
| `assessments` | 1 |  |
| `brand` | 1 |  |
| `data-consistency` | 1 |  |
| `diagrams` | 1 |  |
| `explainability` | 1 |  |
| `performance` | 1 |  |
| `samples` | 1 |  |
| `support` | 1 |  |
| `testing` | 1 |  |
| `trust-center.md` | 1 |  |
| `whitepapers` | 1 |  |

### Immediate organization problems

1. There are too many plausible starting points: `START_HERE.md`, `READ_THIS_FIRST.md`, `ARCHITECTURE_ON_ONE_PAGE.md`, `CORE_PILOT.md`, `CONTRIBUTOR_ON_ONE_PAGE.md`, `BUYER_FIRST_30_MINUTES.md`, and multiple README files. `START_HERE.md` should remain the only primary entry point; the others should be clearly marked as role-specific or reference documents.
2. The `archive/` folder is enormous and contains many files with names similar to current documents. It is valuable history, but it should not be part of normal reader flow. Archive content should be explicitly excluded from generated indexes, search results, and onboarding docs unless the user asks for history.
3. Many documents contain useful scope banners, which is good, but the metadata is not yet normalized enough for automated navigation. Every current document should have a small standard header: Status, Audience, Owner, Last reviewed, Source of truth, Replaces, Replaced by, Related docs.
4. The distinction between buyer-facing, internal, operator, developer, security/GRC, and archive material needs to become visible at the folder and document-title level.
5. The documentation reflects a product in transition from ArchiForge to ArchLucid and from run/pipeline language to review/package/governance language. Remaining terminology drift should be cleaned aggressively.
6. The corpus contains many assessment reports and prompts. These are useful working assets, but they should live in a dated research/assessment archive, not beside source-of-truth architecture or go-to-market docs.
7. Some topics appear in multiple places: trust center, procurement pack, SOC 2 status, buyer journey, pilot guidance, architecture overview, API contracts, operator quickstart. The solution is not deletion first; it is assigning authority and using include-style summaries or references elsewhere.

### Recommended target information architecture

```text
docs/
  START_HERE.md                         # only primary entry point
  product/
    PRODUCT_OVERVIEW.md                 # what ArchLucid is
    V1_SCOPE.md                         # what is in/out
    GLOSSARY.md                         # canonical nouns
    ROADMAP.md                          # near/future
  architecture/
    README.md                           # architecture spine
    ARCHITECTURE_ON_ONE_PAGE.md
    adrs/
    api/
  engineering/
    BUILD.md
    CONTRIBUTING.md
    CODE_MAP.md
    TESTING.md
  operations/
    OPERATOR_ATLAS.md
    runbooks/
    deployment/
    incident-response/
  security/
    SECURITY_OVERVIEW.md
    TENANT_ISOLATION.md
    DATA_HANDLING.md
    ASSURANCE_STATUS.md
  go-to-market/
    buyer/
    procurement/
    pricing/
    sales-enablement/
  demo/
    GOLDEN_PATH.md
    SCREENSHOT_REVIEW_LOG.md
  templates/
  archive/
    README.md                            # history only; not normal navigation
```

### Recommended document header

```yaml
---
title: <Human title>
status: canonical | supporting | draft | archived | superseded
audience: buyer | architect | developer | operator | security | sales | internal
owner: <role or person>
last_reviewed: YYYY-MM-DD
source_of_truth: true | false
replaces: []
replaced_by: []
related: []
---
```

---

## Part 2 — ArchLucid master summary

### 2.1 Product thesis

ArchLucid is best understood as a governed architecture-review and evidence-packaging system. It turns architecture inputs, review decisions, findings, controls, and governance approvals into a durable review package. The product thesis is that enterprise architecture work is not just design; it is decision provenance, evidence quality, risk disposition, governance sign-off, auditability, and repeatable delivery artifacts.

The core buyer problem is that architecture reviews in regulated enterprises are often scattered across meetings, diagrams, chat history, documents, tickets, and manual sign-off processes. ArchLucid attempts to create a review package that can answer: what was decided, what evidence supported it, what risks remain, who approved it, what deliverables were produced, and what audit trail proves the lifecycle.

### 2.2 Canonical product nouns

| Term | Recommended meaning |
|---|---|
| Architecture Review | The primary work object: a review of a proposed or existing architecture, with input context, analysis, findings, decisions, evidence, deliverables, and audit events. |
| Review Package | The complete packaged output of a finalized architecture review. |
| Signed Manifest | The authoritative decision record tying decisions, monitored risks, deliverables, and evidence to the finalized package. |
| Finding | A review observation requiring disposition. Findings should not be used for ordinary positive architecture decisions. |
| Risk | Potential exposure identified during review. A risk may be open, mitigated, accepted with monitoring, or closed. |
| Control | A safeguard, mitigation, or validated condition that reduces risk or demonstrates governance posture. |
| Decision | An approved architecture choice recorded as part of the review package. |
| Evidence Trail | The trace from source context through analysis, findings, decisions, manifest, deliverables, and audit trail. |
| Governance Approval | The recorded governance disposition for a review package. |
| Audit Trail | The lifecycle event record showing human and automatic actions from review creation through package finalization and deliverable generation. |

### 2.3 Golden path narrative

The buyer-polished golden path should be:

1. **Home** — establish that this is an example workspace and direct the buyer into one finalized review package.
2. **Reviews list** — show the available finalized architecture review packages without exposing internal run identifiers.
3. **Review detail / Executive view** — lead with the business decision, remaining monitored risk, evidence status, and next artifact.
4. **Manifest summary** — show the signed decision record and what it proves.
5. **Evidence graph** — prove traceability from source context to finding, decision, manifest, deliverable, and audit trail.
6. **Governance** — show who reviewed and approved the package and what monitoring remains.
7. **Audit** — show lifecycle evidence from creation to package finalization and deliverable generation.

Secondary paths such as finding detail, Ask, compare, advanced technical traceability, and admin health should be hidden, de-emphasized, or clearly separated from the buyer path unless they are intentionally part of a specialized demo.

---

## Part 3 — Canonical and high-value document summaries

### `START_HERE.md`
- **Scope:** Single onboarding hub — buyer, contributor, and security routing.
- Title: **Start here — ArchLucid**
- Summary: Use this page to pick **one** door based on your role.
- Main headings:
  - Start here — ArchLucid

### `ARCHITECTURE_ON_ONE_PAGE.md`
- **Scope:** Canonical architecture poster — C4-style map, ownership, and happy-path trace; defers playbooks to linked library docs.
- Title: **Architecture on one page**
- Summary: **Audience:** Evaluators, operators, and engineers who need the **system boundary, main containers, and trust edges** before opening ADRs or runbooks. **Pair with:** [`library/OPERATOR_ATLAS.md`](library/OPERATOR_ATLAS.md) (route → API → CLI map) · [`library/V1_SCOPE.md`](library/V1_SCOPE.md) (product boundary) Provide a **single page** that can be redrawn as C4 context/container views or a sequence diagram **without** re-walking the whole repository. - **Azure-first** hosting (Container Apps, SQL, private networking) unless a pilot explicitly diverges. - **Incomplete requirements** and **imperfect rollout** are normal; backlogs stay **observable** (outboxes, health, metrics) instead of failing silently. - **No public SMB (port 445)**; storage and queues use private endpoints and managed identity where possible. - **Single DDL source per database** — master SQL script plus forward-only m
- Main headings:
  - Architecture on one page
  -   1. Objective
  -   2. Assumptions
  -   3. Constraints
  -   4. Architecture overview
  -     4.1 System context (who touches what)
  -     4.2 Containers (internal responsibilities)
  -   5. Component breakdown
  -   6. Data flow
  -   7. Security model
  -   8. Operational considerations
  -   Happy path (read left to right)
  -   Further reading

### `CORE_PILOT.md`
- **Scope:** Core Pilot spine — shortest path from “new review” to committed manifest + review package; defers playbook depth to the evaluation guide and operator quickstart.
- Title: **Core Pilot**
- Summary: Use this page when you need the **four-step Core Pilot** narrative without scrolling the full evaluator guide. **Buyer / hosted path** (no install) stays in **Part 1** of **`[onboarding/EVALUATION_GUIDE.md`](onboarding/EVALUATION_GUIDE.md)**; Core Pilot specifics are expanded in **Part 2** of that guide. Do not mistake the Core Pilot checklist for full product scope — advanced Operate lanes, entitlement-specific depth, and GA-gated paths live under **[`library/V1_SCOPE.md`](library/V1_SCOPE.md)** and linked runbooks. Use Core Pilot to prove **request → execute → commit → review package** once on **your** inputs. | Need | Doc | |------|-----| | Step-by-step UI + “what good looks like” | [`onboarding/EVALUATION_GUIDE.md`](onboarding/EVALUATION_GUIDE.md) (**Part 2 — Core Pilot**) | | CLI / curl spine (repository root) | [`library/OPERATOR_QUICKSTART.md`](library/OPERATOR_QUICKSTART.md) | |
- Main headings:
  - Core Pilot
  -   1. What stays secondary (scope boundary)
  -   2. Canonical depth and commands
  -   First session checklist

### `PENDING_QUESTIONS.md`
- **Scope:** Product and operations decisions the repo cannot resolve alone — consolidated pending list (supersedes scattered assessment §9 lists).
- Title: **Pending questions (product and operations)**
- Summary: > **Updated 2026-05-06:** **ITSM bidirectional sync** — **both** Jira (Jira → ArchLucid finding state) and **ServiceNow** (ServiceNow → ArchLucid finding state) **confirmed in scope for V1 GA**. Supersedes "not committed unless owner adds" for ServiceNow and "may fast-follow" qualification for Jira. *Resolved 2026-05-06 (ITSM bidirectional sync — both connectors)* below. > **Updated 2026-05-05 (k):** **Live commerce cutover sequence** (**item 22**): **Stripe production first**, then **Marketplace go-live**. **Rollback owner:** **Joseph Francis** (same path for both stages). Dates + comms remain open until un-held. *Resolved 2026-05-05 (commerce cutover sequencing — item 22 partial)* below. > **Updated 2026-05-05 (j):** **Next workflow-breadth bet** (after GitHub + ADO anchors) — **deeper Microsoft-native** (Teams / Logic Apps / [ADR 0019](architecture/adrs/0019-logic-apps-standard-edge-o
- Main headings:
  - Pending questions (product and operations)
  -   Resolved 2026-05-06 (ITSM bidirectional sync — both connectors)
  -   Resolved 2026-05-05 (Commerce cutover sequencing — item 22 partial)
  -   Resolved 2026-05-05 (Next workflow breadth — item 4)
  -   Resolved 2026-05-05 (VPAT posture — item 26)
  -   Resolved 2026-05-05 (Public pricing surface — item 13)
  -   Resolved 2026-05-05 (Reference publication owner — items 7 / 19)
  -   Resolved 2026-05-05 (SOC 2 ARR trigger — item 6)
  -   Resolved 2026-05-05 (Quote CRM routing — Decision Velocity)
  -   Resolved 2026-05-05 (H1 GTM motion — Decision Velocity)
  -   Resolved 2026-05-05 (Paid proposal readiness bar — Decision Velocity)
  -   Resolved 2026-05-05 (SIEM + guided sandbox — product posture)
  -   Resolved 2026-05-05 (Jira + ServiceNow — promoted to V1 scope)
  -   Resolved 2026-05-05 (Confluence — promoted to V1 GA)
  -   Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)
  -   Resolved 2026-05-03 (Design partner vs V1 headline assessments)
  -   Resolved 2026-04-27 (Post-Assessment Q&A)
  -     Resolved 2026-04-27 (ITSM V1.1 first-party implementation priority)

### `architecture/README.md`
- **Scope:** Canonical architecture index, poster (C4 + ownership), and workspace documentation.
- Title: **ArchLucid Architecture**
- Summary: **Purpose:** One screen to redraw **ArchLucid** as C4, know **who owns each box**, and find the **documentation index** for deeper dives.
- Main headings:
  - ArchLucid Architecture
  -   1. System context (C4)
  -     Context nodes → ownership
  -   2. Containers (C4)
  -   3. C4 workspace (Structurizr DSL)
  -   4. Documentation Index
  -     Orientation
  -     Operator shell (front end)
  -     Decisions and onboarding
  -     API and contracts
  -     Build, CLI, and operations
  -     Contributing and process

### `library/ARCHITECTURE_CONTEXT.md`
- **Scope:** ArchLucid architecture (Context) - full detail, tables, and links in the sections below.
- Title: **Architecture Context**
- Summary: **Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) **Product name:** **ArchLucid**. Legacy identifiers may still read **ArchLucid** in code and configuration (incremental rename; see `docs/library/V1_DEFERRED.md`). Project and namespace names below use **`ArchLucid.*`** until bulk rename phases in V1_DEFERRED §3 complete. ArchLucid is a .NET API that orchestrates AI-assisted architecture design. It accepts an `ArchitectureRequest`, coordinates agent tasks/results, merges results into a versioned manifest, and produces exports, comparisons, and replayable artifacts. This document is written for **internal engineers** and is intentionally pragmatic: it prioritizes “how the system actually behaves” over strict diagram formalism. - **Run lifecycle** - Create a run from an `ArchitectureRequest` - Generate agent
- Main headings:
  -   ArchLucid architecture (Context)
  -     Purpose
  -     Primary capabilities
  -     System boundary and actors
  -     External dependencies (runtime)
  -     Key quality attributes (what we optimize for)
  -     Context ingestion
  -     Where to go next

### `library/ARCHITECTURE_COMPONENTS.md`
- **Scope:** ArchLucid architecture (Components) - full detail, tables, and links in the sections below.
- Title: **Architecture Components**
- Summary: **Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) **Product name:** **ArchLucid**. Solution/projects use **`ArchLucid.*`**; configuration may still show legacy **`ArchLucid:*`** / **`ArchLucidAuth`** keys until Phase 7 (`docs/library/V1_DEFERRED.md`). This document zooms into the most important components inside each container/library. It is not exhaustive; it focuses on the pieces engineers tend to touch when extending “run → export → compare → replay”. | Area | Role | Typical types | |------|------|----------------| | **`ArchLucid.Persistence.Data.*`** | ADO.NET/Dapper for the **run/commit/agent** workflow: repositories used by `ArchLucid.Application` and HTTP services for requests, runs, tasks, evidence, governance entities, background jobs, `IDbConnectionFactory`, DbUp **`DatabaseMig
- Main headings:
  -   ArchLucid architecture (Components)
  -     Workflow data access vs authority persistence (both in `ArchLucid.Persistence`)
  -     `ArchLucid.Api` components
  -       Connection bridging (SQL)
  -       Dual manifest / trace repository interfaces
  -       Governance persistence
  -       Rate limiting on controllers
  -       Production configuration safety
  -       `ArchitectureController`
  -       AuthN/AuthZ
  -       Observability
  -     `ArchLucid.Application` components
  -       Run + replay services (core orchestrators)
  -       End-to-end replay comparison formatting/export
  -       Export-record diff formatting/export
  -       Architecture review board packet (`architecture-review-board`)
  -     `ArchLucid.Decisioning.Merge` — manifest merge
  -       `IDecisionEngineService` / `DecisionEngineService`

### `library/ARCHITECTURE_CONTAINERS.md`
- **Scope:** ArchLucid architecture (Containers) - full detail, tables, and links in the sections below.
- Title: **Architecture Containers**
- Summary: **Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) **Product name:** **ArchLucid**. **`ArchLucid.*`** below refers to deployable projects and libraries until the bulk rename phases in `docs/library/V1_DEFERRED.md`. This is a pragmatic C4 “containers” view: **deployable processes** and major libraries, with their responsibilities and relationships. **Responsibility** - HTTP surface for all run/execution/export/compare/replay workflows. - API versioning (`/v1/...`), rate limiting, and API-key auth. - Wires up DI for Application, Persistence (workflow `Data.*` + authority SQL), Decisioning (merge + validation + governance), Retrieval, ContextIngestion, and related services. - Provides Swagger/OpenAPI docs (with small operation filters for replay examples). **Key concerns** - Authentication:
- Main headings:
  -   ArchLucid architecture (Containers)
  -     Container: `ArchLucid.Api` (ASP.NET Core Web API)
  -     Container: `ArchLucid.Cli` (dotnet tool / CLI)
  -     Library: `ArchLucid.Application` (application services)
  -     Library: `ArchLucid.Decisioning` (governance, advisory, merge, domain models)
  -     Library: `ArchLucid.Persistence` (SQL Server authority + operational data)
  -     Library: `ArchLucid.KnowledgeGraph` (graph snapshots)
  -     Library: `ArchLucid.ContextIngestion` (context pipeline)
  -     Library: `ArchLucid.Retrieval` (RAG / indexing)
  -     Library: `ArchLucid.ArtifactSynthesis` (bundle synthesis + packaging)
  -     Library: `ArchLucid.Persistence` — workflow data access (`ArchLucid.Persistence.Data.*`)
  -     Library: `ArchLucid.Coordinator` (task generation / orchestration)
  -     Library: `ArchLucid.AgentRuntime` / `ArchLucid.AgentSimulator`
  -     Library: `ArchLucid.Contracts`
  -     Container relationships (high-level)
  -     Where to go next

### `library/ARCHITECTURE_FLOWS.md`
- **Scope:** ArchLucid architecture (Key flows) - full detail, tables, and links in the sections below.
- Title: **Architecture Flows**
- Summary: **Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) This doc describes the main runtime flows in “sequence narrative” form. It’s meant to be readable without diagrams. **Goal:** Turn an `ArchitectureRequest` into a committed, versioned golden manifest. **Important:** There are **two ways** the product reaches that outcome. **`POST /v1/architecture/request`** always persists the run and, on **SQL storage**, enters **`IAuthorityRunOrchestrator`** (context ingestion → knowledge graph → findings → decisioning → artifact synthesis) via **`AuthorityPipelineStagesExecutor`**. Separately, a **legacy coordinator** path still supports **in-host agent execution** (`POST …/execute`), **external** per-task submission (`POST …/result`), and a **merge commit** (`POST …/commit`) when the run is driven by **Agent
- Main headings:
  -   ArchLucid architecture (Key flows)
  -     Flow A: Run lifecycle (request → committed manifest)
  -       A0 — Authority pipeline (ingestion → graph → findings → artifacts)
  -       A0b — Legacy coordinator path (`execute` / `result` / `commit`)
  -       Flow A1: Decision tree (which path am I on?)
  -     Flow B: Export lifecycle (build → persist record → replay)
  -     Flow C: Comparison lifecycle (compare → persist record → replay/export → verify drift)
  -       C1: Create and persist an end-to-end run comparison
  -       C2: Create and persist an export-record diff comparison
  -       C3: Replay a persisted comparison record
  -       C4: Replay modes (artifact vs regenerate vs verify)
  -       C5: Persist replay (optional)

### `library/ARCHITECTURE_INVARIANTS.md`
- **Scope:** Engineering-maintained catalog of cross-cutting architecture invariants ArchLucid intends to enforce via code, tests, and ops; audience is contributors and reviewers; not buyer-facing trust claims or a substitute for ADRs.
- Title: **Architecture invariant catalog**
- Summary: **Last updated:** 2026-05-09 **Normative decisions** that conflict with this catalog belong in a new or amended [Architecture Decision Record](../architecture/adrs/README.md); this file is the **checklist and ID registry** for enforcement work tracked in [`TECH_BACKLOG.md`](TECH_BACKLOG.md). **Conformance today:** Mixed. Several invariants partially hold by convention only. Rows below state **intent**, **why it matters**, **enforcement sketch**, and **relation to shipped decisions** where applicable. | ID | Invariant (one sentence) | Tier | Enforcement sketch | |----|--------------------------|------|---------------------| | [INV-001](#inv-001-tenant-identity-boundary) | Tenant identity is established once at the host boundary and passed as typed context; deeper layers never re-parse claims or ambient HTTP to infer tenant. | P0 | Analyzer + architecture tests + parallel-tenant integratio
- Main headings:
  - Architecture invariant catalog
  -   INV-001: Tenant identity boundary
  -   INV-002: Structural execution mode
  -   INV-003: Audit path contracts
  -   INV-004: Durable cost guardrails
  -   INV-005: Production host fail-closed
  -   INV-006: Single composition root
  -   INV-007: Injected time
  -   INV-008: Cancellation forwarding
  -   INV-009: Mutating HTTP idempotency
  -   INV-010: Central HTTP / LLM clients
  -   INV-011: Append-only repository shape
  -   INV-012: Quality gate single source of truth
  -   INV-013: Replay read-only scope
  -   INV-014: No mutable statics
  -   INV-015: Inbound webhook pipeline order
  -   References

### `library/API_CONTRACTS.md`
- **Scope:** API contracts (notable behaviors) - full detail, tables, and links in the sections below.
- Title: **API contracts (notable behaviors)**
- Summary: **Error bodies (RFC 9457 Problem Details, obsoletes RFC 7807):** See **[API_ERROR_CONTRACT.md](API_ERROR_CONTRACT.md)** for Problem+JSON shape, stable **`type`** URIs, and correlation behavior. - **URL path:** Major version is in the path: **`/v1/...`** (see controller routes `v{version:apiVersion}`). - **Alternate readers:** Clients may also send **`api-version`** as a query string or request header (same major.minor as the URL segment, e.g. **`1.0`**) — wired in **`ArchLucid.Api/Startup/MvcExtensions.cs`** via **`ApiVersionReader.Combine`** alongside **`UrlSegmentApiVersionReader`**. - **Default:** Version **1.0** is assumed when not specified; clients should still use **`/v1`** in URLs. - **Discovery:** Responses can include **`api-supported-versions`** / **`api-deprecated-versions`** per [Asp.Versioning](https://github.com/dotnet/aspnet-api-versioning) options (`ReportApiVersions`).
- Main headings:
  - API contracts (notable behaviors)
  -   API versioning
  -   Deprecation policy
  -   Contract artifacts
  -   LLM cost signals — wire contract vs vendor economics
  -   Operator artifacts (`/v1/artifacts`)
  -   Changing the HTTP contract (PR checklist)
  -   Azure extractor ingest (`/v1/azure-extractor`)
  -   ITSM connectors (first-party)
  -   Explain (`/v1/explain`)
  -   Learning / planning (59R) (`/v1/learning`)
  -   Demo anonymous surfaces (`/v1/demo`)
  -   Pilots (`/v1/pilots`)
  -   Tenant self-service (`/v1/tenant`)
  -   List pagination (runs and alerts)
  -   Bulk operator endpoints (partial success)
  -   Admin configuration routes (`/v1/admin`)
  -   Correlation ID

### `library/V1_SCOPE.md`
- **Scope:** ArchLucid V1 — scope contract - full detail, tables, and links in the sections below.
- Title: **ArchLucid V1 — scope contract**
- Summary: **Audience:** Product, engineering, pilots, and operators who need a single, decisive boundary for what "V1" means in this repository. **Status:** Contract for the current codebase and docs. It describes what is implemented and supportable today, not a roadmap of net-new capabilities. This scope document lists in-scope capabilities, explicit out-of-scope items, the operator happy path, and minimum release checks. Naming and rename posture are summarized in **Related** below. - **[README.md](REPOSITORY_README.md)** — repo overview and install spine - **[GLOSSARY.md](GLOSSARY.md)** — terms and naming - **[BREAKING_CHANGES.md](../../BREAKING_CHANGES.md)** — breaking change trail - **[V1_DEFERRED.md](library/V1_DEFERRED.md)** — remaining rename phases - **[ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md)** — architecture poster - **[OPERATOR_ATLAS.md](OPERATOR
- Main headings:
  - ArchLucid V1 — scope contract
  -   Related
  -   1. What this document does
  -   2. In scope for V1 — organized by product layer
  -     Layer 1 — Pilot
  -       2.1 Run lifecycle: request → execute → commit
  -       2.2 Manifest and artifact review
  -       2.3 Export and package generation
  -       2.4 Deployability and supportability
  -     Layer 2 — Operate
  -       2.5 Compare
  -       2.6 Replay
  -       2.7 Graph
  -       2.8 Advisory, Q&A, and pilot signals
  -       2.9 Governance workflows
  -       2.10 Audit and compliance
  -       2.11 Alerts
  -       2.12 Trust and access

### `library/OPERATOR_ATLAS.md`
- **Scope:** Canonical operator action map — UI routes, APIs, CLI, and authority hints in one place.
- Title: **Operator atlas**
- Summary: **Audience:** Operators, reviewers, and engineers who need a **single map** from product intent → **shell route** → **HTTP surface** → **CLI** without opening ten onboarding files. **Source of truth for nav:** `archlucid-ui/src/lib/nav-config.ts` (labels, `tier`, `requiredAuthority`) composed with `nav-shell-visibility.ts`. **Authoritative authorization** remains **`[Authorize(Policy = …)]`** on `ArchLucid.Api` — the UI only shapes disclosure. **Related:** [CORE_PILOT.md](../CORE_PILOT.md) · [OPERATOR_QUICKSTART.md](OPERATOR_QUICKSTART.md) · [OPERATOR_DECISION_GUIDE.md](OPERATOR_DECISION_GUIDE.md) · [operator-shell.md](operator-shell.md) · [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) §3 · [API_CONTRACTS.md](API_CONTRACTS.md) | Action | CLI (examples) | Primary API | Operator UI | Authority (nav hint) | Runbook / doc | |--------|----------------|-------------|-------------|---------------
- Main headings:
  - Operator atlas
  -   Core Pilot — essential (default sidebar)
  -   Core Pilot — extended (Show more links)
  -   Operate (analysis workloads)
  -   Operate (governance and trust)
  -   Cross-cutting CLI (not tied to one page)

### `onboarding/EVALUATION_GUIDE.md`
- **Scope:** Unified onboarding and evaluation guide for buyers and operators. Replaces the former `BUYER_FIRST_30_MINUTES.md` and `CORE_PILOT.md`.
- Title: **ArchLucid Evaluation Guide**
- Summary: **Audience:** Prospective buyers, evaluators, operators, and design partners completing their first pilot. **Purpose:** Define the end-to-end journey from an empty tenant to a reviewed, exportable **architecture review package**. ArchLucid is a SaaS product. You will not install anything to evaluate it. Evaluating the product itself happens on the hosted SaaS at [`archlucid.net`](https://archlucid.net). There is no Docker, SQL, .NET, Node, Terraform, or CLI on the buyer path. Five steps. Roughly thirty minutes end-to-end on a normal connection. 1. **Sign in.** Open [`archlucid.net`](https://archlucid.net) and sign in with your work identity. 2. **Pick a vertical.** Choose the closest match (`financial-services`, `healthcare`, `public-sector`, `retail`, `saas`). The vertical sets default compliance rules, terminology, and analysis priorities. 3. **Run a sample.** ArchLucid pre-populates a
- Main headings:
  - ArchLucid Evaluation Guide
  -   Part 1: Your first 30 minutes (Buyer / Evaluator path)
  -     What 30 minutes looks like
  -   Part 2: Core Pilot (Operator path)
  -     Zero-config sample first
  -     Step 1 — Create an architecture review
  -     Step 2 — Execute the run
  -     Step 3 — Commit the manifest
  -     Step 4 — Open the review package
  -     Step 5 — Same four steps with **your** inputs
  -   What to evaluate in a Core Pilot

### `go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`
- **Scope:** ArchLucid Executive Sponsor Brief - full detail, tables, and links in the sections below.
- Title: **ArchLucid Executive Sponsor Brief**
- Summary: **Audience:** CIOs, CTOs, chief architects, architecture review sponsors, governance leaders, and pilot sponsors who need a concise explanation of what ArchLucid does and why a pilot matters. **Status:** Sponsor-facing V1 summary. This brief is grounded in what the current product supports today. It is not a pricing sheet and it does not claim enterprise-wide transformation. This file is the outward **sponsor story of record**: why a pilot matters, what success should look like in plain language, and what not to over-claim. Other docs and go-to-market pages should align here rather than grow a second buyer story. Use the related links for ROI measurement, packaging semantics, operator motion, and positioning. - **[READ_THIS_FIRST.md](archive/READ_THIS_FIRST.md)** — forced decision-tree entry (buyer vs contributor vs security vs architecture) - **[README.md](REPOSITORY_README.md)** — repo entry a
- Main headings:
  - ArchLucid Executive Sponsor Brief
  -   Related
  -   1. What ArchLucid is
  -   2. What problem it solves
  -   3. Core Value Pillars
  -     Pillar 1: AI-native architecture analysis
  -     Pillar 2: Auditable decision trail
  -     Pillar 3: Enterprise governance
  -   4. Elevator Pitches
  -     30-second pitch
  -     60-second pitch
  -   5. What Pilot proves
  -   6. What measurable value a pilot should show
  -   7. What Operate adds
  -   8. What expansion would look like
  -   9. What not to over-claim yet
  -   10. What success should allow a sponsor to say
  -   11. Limits of AI explanations (citations vs. proof)

### `go-to-market/BUYER_PERSONAS.md`
- **Scope:** ArchLucid buyer personas - full detail, tables, and links in the sections below.
- Title: **ArchLucid buyer personas**
- Summary: **Audience:** Product, sales, and marketing teams who need a shared understanding of who buys ArchLucid, why, and how they evaluate it. **Last reviewed:** 2026-04-15 **Grounding rule:** Capabilities and limitations referenced here reflect the V1 codebase per [V1_SCOPE.md](../library/V1_SCOPE.md) and [CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md). 1. **Sales:** Use personas to qualify leads quickly. If the prospect does not match at least one persona, the deal is likely a poor fit for V1. 2. **Marketing:** Use pain points and language to craft messaging that resonates. 3. **Product:** Use evaluation criteria and objections to prioritize roadmap items. 4. **Demo prep:** Tailor the demo to the persona in the room — each values different features. | Attribute | Detail | |-----------|--------| | **Title** | Enterprise Architect, Chief Architect, Principal Architect, H
- Main headings:
  - ArchLucid buyer personas
  -   How to use this document
  -   Persona 1: The Enterprise Architect / Chief Architect
  -     Profile
  -     Responsibilities and goals
  -     Pain points ArchLucid addresses
  -     How they evaluate tools
  -     What would make them champion ArchLucid
  -     What would make them reject ArchLucid
  -     Key objections and responses
  -     Demo priorities (what to show first)
  -   Persona 2: The VP Engineering / Head of Platform Engineering
  -     Profile
  -     Responsibilities and goals
  -     Pain points ArchLucid addresses
  -     How they evaluate tools
  -     What would make them champion ArchLucid
  -     What would make them reject ArchLucid

### `go-to-market/TRUST_CENTER.md`
- **Scope:** ArchLucid Trust Center - full detail, tables, and links in the sections below.
- Title: **ArchLucid Trust Center**
- Summary: **Buyer posture table (single index):** [`docs/go-to-market/trust-center.md`](trust-center.md) — same evidence links; rendered in-product at **`/trust`**. **Audience:** Security reviewers, procurement, and legal teams evaluating ArchLucid as a **vendor-operated (SaaS)** service. **Last reviewed:** 2026-05-01 **Canonical assurance wording:** [ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md) ArchLucid is built so that **security, privacy, and operational transparency** are first-class: identity-backed access, defense-in-depth on the data plane, measurable reliability targets, and documentation you can trace to the product and infrastructure code. This page is the **buyer-facing index** into policies and deep technical references maintained in the repository. - **Identity:** Microsoft **Entra ID** or **other OIDC issuers** (JWT bearer — **[V1_SCOPE.md](../library/V1_SCOPE.md) §
- Main headings:
  - ArchLucid Trust Center
  -   Security overview at a glance
  -   Azure connectivity (extractor posture)
  -     What we will never ask you to assign
  -   Data residency and sovereignty
  -   Penetration testing and security assessments
  -   Recent assurance activity
  -     Hosted staging probes (internal rollup)
  -   Trust documents
  -     Get the procurement pack
  -   Compliance and certifications
  -   Commercial terms
  -   Contact
  -   Related documents

### `go-to-market/CURRENT_ASSURANCE_POSTURE.md`
- **Scope:** Buyers and security reviewers: repository-linked snapshot of current assurance claims; not legal advice, CPA attestation, or customer-specific commitments.
- Title: **ArchLucid — Current Assurance Posture**
- Summary: **Date:** 2026-05-01 **Last reviewed:** 2026-05-01 **Classification:** Buyer-facing (include in procurement pack ZIP) This document summarizes the security, compliance, and assurance evidence that ArchLucid provides today. Every claim below links to a source artifact in the repository. Status labels follow [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md) to avoid contradictory buyer wording. ArchLucid runs automated security checks on every pull request and merge to main. These are **merge-blocking** unless noted. | Check | Tool | What it catches | CI status | |-------|------|----------------|-----------| | Secret scanning | [Gitleaks](https://github.com/gitleaks/gitleaks) (`.gitleaks.toml`) | Leaked API keys, connection strings, tokens in committed code | **Merge-blocking** (Tier 0) | | Static analysis (security-extended) | [CodeQL](https://codeql.github.com/) (`.github/
- Main headings:
  - ArchLucid — Current Assurance Posture
  -   1. Continuous security testing in CI
  -   2. Data isolation model
  -   3. Audit trail
  -   4. Threat modeling
  -   5. Compliance and privacy
  -   6. Penetration testing
  -   7. Infrastructure as Code
  -   8. Contact

### `security/MULTI_TENANT_RLS.md`
- **Scope:** Multi-tenant row-level security (SQL) — design sketch - full detail, tables, and links in the sections below.
- Title: **Multi-tenant row-level security (SQL) — design sketch**
- Summary: Describe how ArchLucid enforces **tenant / workspace / project isolation in SQL Server** so a compromised application tier or query bug cannot read or mutate another customer’s rows, while keeping the current **application-level scope** model (`IScopeContextProvider`) as the primary authorization gate. - Primary store is **SQL Server** (Azure SQL or boxed) with **private connectivity**; SMB/file shares are not used for tenant data at the API boundary. - **Entra ID** (or API keys in constrained scenarios) identifies the caller; **scope** (tenant, workspace, project) is derived from claims or headers and validated in the application layer. - When **`ArchLucid:SqlTopology:Mode=SystemWithPerTenantCatalogs`** (the production topology), the **database boundary is the primary and sufficient tenant isolation mechanism**. RLS is not required for defense-in-depth and is not a production requiremen
- Main headings:
  - Multi-tenant row-level security (SQL) — design sketch
  -   1. Objective
  -   2. Assumptions
  -   3. Constraints
  -   4. Architecture overview
  -   5. Component breakdown
  -   6. Data flow
  -   7. Security model
  -   8. Operational considerations
  -   9. Covered tables and known gaps (DbUp 036 + 046 + 096 + 097 + 108)
  -   10. Evolution

### `runbooks/PILOT_RESCUE_PLAYBOOK.md`
- **Scope:** Operators and pilot evaluators stuck during the Core Pilot; symptom-first triage with links to canonical runbooks—not incident response, security coordination, or a full RCA guide.
- Title: **Pilot rescue playbook (V1)**
- Summary: Use when you need **symptom → likely cause → first command → deeper doc**. Full flow: **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** and **[CORE_PILOT.md](../CORE_PILOT.md)**. **Correlation:** Include **`X-Correlation-ID`** (and `correlationId` inside ProblemDetails JSON) in notes whenever you open a thread, grep logs, or attach diagnostics. **Support bundle:** From a machine with CLI access to the tenant, run **`archlucid support-bundle --zip`** (or your deployment’s equivalent). Open **`README.txt`** then **`next-steps.json`**; use **`references.json`** for doc paths from repo root. Inspect contents before external send—see **support bundle** row below and [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) (support bundle / redaction). | Symptom | Likely cause | First command / check | Next doc | | --- | --- | --- | --- | | API unreachable / connection refused | Host down, wrong URL/port, ne
- Main headings:
  - Pilot rescue playbook (V1)

### `deployment/STAGING_DEPLOYMENT_CHECKLIST.md`
- **Scope:** Operators verifying hosted SaaS staging (Terraform apply order, trial funnel, health probes) using repo-defined stacks — not designing net-new infrastructure.
- Title: **Staging deployment checklist (`staging.archlucid.net`)**
- Summary: **Purpose:** Prerequisite and verification list for bringing the **hosted SaaS trial funnel** online on **staging** using **existing** Terraform and CI — **no new resources** in this document; operators apply or configure what is already defined in the repo. Covers signup, tenant provisioning, first-value experience, and health probes. Aligned with [TRIAL_AND_SIGNUP.md](../go-to-market/TRIAL_AND_SIGNUP.md), [REFERENCE_SAAS_STACK_ORDER.md](../library/REFERENCE_SAAS_STACK_ORDER.md), and [BUYER_FIRST_30_MINUTES.md](../BUYER_FIRST_30_MINUTES.md). **Last updated:** 2026-04-25 Apply nested stacks in the order documented in [REFERENCE_SAAS_STACK_ORDER.md](../library/REFERENCE_SAAS_STACK_ORDER.md) (multi-root table). Staging-relevant roots for workloads and edge: | Order (multi-root) | Root | Role for staging | |-------------------|------|------------------| | 1–5 | `infra/terraform-private` … `
- Main headings:
  - Staging deployment checklist (`staging.archlucid.net`)
  -   1. Default apply order (Terraform)
  -   2. GitHub: merge-to-staging CD (optional automation)
  -   3. Container Apps images (Terraform vs CD)
  -   4. Azure Front Door and `staging.archlucid.net`
  -   5. SQL, Key Vault, Entra, Service Bus
  -   6. Demo seed and trial sample data (important)
  -   7. Repository variable: `ARCHLUCID_STAGING_BASE_URL` (hosted probes)
  -   8. One-page operator smoke (after deploy)
  -   9. Related documentation
  -   10. Constraints (this change set)

---

## Part 4 — Detailed product model

### Architecture model

#### `library/ARCHITECTURE_CONTEXT.md`
**Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) **Product name:** **ArchLucid**. Legacy identifiers may still read **ArchLucid** in code and configuration (incremental rename; see `docs/library/V1_DEFERRED.md`). Project and namespace names below use **`ArchLucid.*`** until bulk rename phases in V1_DEFERRED §3 complete. ArchLucid is a .NET API that orchestrates AI-assisted architecture design. It accepts an `ArchitectureRequest`, coordinates agent tasks/results, merges results into a versioned manifest, and produces exports, comparisons, and replayable artifacts. This document is written for **internal engineers** and is intentionally pragmatic: it prioritizes “how the system actually behaves” over strict diagram formalism. - **Run lifecycle** - Create a run from an `ArchitectureRequest` - Generate agent tasks (topology/cost/compliance/critic) - Accept agent results - Commit a run to produce a **versioned manifest** - **Artifacts and exports** - Fetch manifests and summaries - Export analysis reports

Key topics:
- Purpose
- Primary capabilities
- System boundary and actors
- External dependencies (runtime)
- Key quality attributes (what we optimize for)
- Context ingestion
- Where to go next

#### `library/ARCHITECTURE_CONTAINERS.md`
**Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) **Product name:** **ArchLucid**. **`ArchLucid.*`** below refers to deployable projects and libraries until the bulk rename phases in `docs/library/V1_DEFERRED.md`. This is a pragmatic C4 “containers” view: **deployable processes** and major libraries, with their responsibilities and relationships. **Responsibility** - HTTP surface for all run/execution/export/compare/replay workflows. - API versioning (`/v1/...`), rate limiting, and API-key auth. - Wires up DI for Application, Persistence (workflow `Data.*` + authority SQL), Decisioning (merge + validation + governance), Retrieval, ContextIngestion, and related services. - Provides Swagger/OpenAPI docs (with small operation filters for replay examples). **Key concerns** - Authentication: API key scheme (`ApiKeyAuthenticationHandler`) - Authorization policies (claims-based): - `CanCommitRuns`, `CanSeedResults` - `CanReplayComparisons`, `CanViewReplayDiagnostics` - `CanExportConsultingD

Key topics:
- Container: `ArchLucid.Api` (ASP.NET Core Web API)
- Container: `ArchLucid.Cli` (dotnet tool / CLI)
- Library: `ArchLucid.Application` (application services)
- Library: `ArchLucid.Decisioning` (governance, advisory, merge, domain models)
- Library: `ArchLucid.Persistence` (SQL Server authority + operational data)
- Library: `ArchLucid.KnowledgeGraph` (graph snapshots)
- Library: `ArchLucid.ContextIngestion` (context pipeline)
- Library: `ArchLucid.Retrieval` (RAG / indexing)
- Library: `ArchLucid.ArtifactSynthesis` (bundle synthesis + packaging)
- Library: `ArchLucid.Persistence` — workflow data access (`ArchLucid.Persistence.Data.*`)
- Library: `ArchLucid.Coordinator` (task generation / orchestration)

#### `library/ARCHITECTURE_COMPONENTS.md`
**Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) **Product name:** **ArchLucid**. Solution/projects use **`ArchLucid.*`**; configuration may still show legacy **`ArchLucid:*`** / **`ArchLucidAuth`** keys until Phase 7 (`docs/library/V1_DEFERRED.md`). This document zooms into the most important components inside each container/library. It is not exhaustive; it focuses on the pieces engineers tend to touch when extending “run → export → compare → replay”. | Area | Role | Typical types | |------|------|----------------| | **`ArchLucid.Persistence.Data.*`** | ADO.NET/Dapper for the **run/commit/agent** workflow: repositories used by `ArchLucid.Application` and HTTP services for requests, runs, tasks, evidence, governance entities, background jobs, `IDbConnectionFactory`, DbUp **`DatabaseMigrator`**, consolidated **`Scripts/ArchLucid.sql`**. | `ArchitectureRequestRepository`, `IRunRepository`, `SqlConnectionFactory` | | **Rest of `ArchLucid.Persistence`** | **Authority and decisioning**

Key topics:
- Workflow data access vs authority persistence (both in `ArchLucid.Persistence`)
- `ArchLucid.Api` components
- Connection bridging (SQL)
- Dual manifest / trace repository interfaces
- Governance persistence
- Rate limiting on controllers
- Production configuration safety
- `ArchitectureController`
- AuthN/AuthZ
- Observability
- `ArchLucid.Application` components

#### `library/ARCHITECTURE_FLOWS.md`
**Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) This doc describes the main runtime flows in “sequence narrative” form. It’s meant to be readable without diagrams. **Goal:** Turn an `ArchitectureRequest` into a committed, versioned golden manifest. **Important:** There are **two ways** the product reaches that outcome. **`POST /v1/architecture/request`** always persists the run and, on **SQL storage**, enters **`IAuthorityRunOrchestrator`** (context ingestion → knowledge graph → findings → decisioning → artifact synthesis) via **`AuthorityPipelineStagesExecutor`**. Separately, a **legacy coordinator** path still supports **in-host agent execution** (`POST …/execute`), **external** per-task submission (`POST …/result`), and a **merge commit** (`POST …/commit`) when the run is driven by **AgentTask** / **AgentResult** rows. **Choose one mental model per run** after inspecting **`GET /v1/architecture/run/{runId}`** (see decision tree below). 1. **Create run** — `POST /v1/architecture/request

Key topics:
- Flow A: Run lifecycle (request → committed manifest)
- A0 — Authority pipeline (ingestion → graph → findings → artifacts)
- A0b — Legacy coordinator path (`execute` / `result` / `commit`)
- Flow A1: Decision tree (which path am I on?)
- Flow B: Export lifecycle (build → persist record → replay)
- Flow C: Comparison lifecycle (compare → persist record → replay/export → verify drift)
- C1: Create and persist an end-to-end run comparison
- C2: Create and persist an export-record diff comparison
- C3: Replay a persisted comparison record
- C4: Replay modes (artifact vs regenerate vs verify)
- C5: Persist replay (optional)

#### `library/ARCHITECTURE_INVARIANTS.md`
**Last updated:** 2026-05-09 **Normative decisions** that conflict with this catalog belong in a new or amended [Architecture Decision Record](../architecture/adrs/README.md); this file is the **checklist and ID registry** for enforcement work tracked in [`TECH_BACKLOG.md`](TECH_BACKLOG.md). **Conformance today:** Mixed. Several invariants partially hold by convention only. Rows below state **intent**, **why it matters**, **enforcement sketch**, and **relation to shipped decisions** where applicable. | ID | Invariant (one sentence) | Tier | Enforcement sketch | |----|--------------------------|------|---------------------| | [INV-001](#inv-001-tenant-identity-boundary) | Tenant identity is established once at the host boundary and passed as typed context; deeper layers never re-parse claims or ambient HTTP to infer tenant. | P0 | Analyzer + architecture tests + parallel-tenant integration tests | | [INV-002](#inv-002-structural-execution-mode) | Every persisted agent outcome and buyer-visible run summary carries an explicit structural execution mode (Real / Simulator / Fallback / Mix

Key topics:
- INV-001: Tenant identity boundary
- INV-002: Structural execution mode
- INV-003: Audit path contracts
- INV-004: Durable cost guardrails
- INV-005: Production host fail-closed
- INV-006: Single composition root
- INV-007: Injected time
- INV-008: Cancellation forwarding
- INV-009: Mutating HTTP idempotency
- INV-010: Central HTTP / LLM clients
- INV-011: Append-only repository shape

#### `library/ARCHITECTURE_CONSTRAINTS.md`
Automated checks that selected **ArchLucid** assemblies respect layering and dependency boundaries. Implementation: **`ArchLucid.Architecture.Tests`** ([`DependencyConstraintTests.cs`(../../ArchLucid.Architecture.Tests/DependencyConstraintTests.cs)), using **[NetArchTest.Rules](https://github.com/BenMorris/NetArchTest)** (central version in [`Directory.Packages.props`(../../Directory.Packages.props)). **See also:** [ARCHITECTURE_COMPONENTS.md](ARCHITECTURE_COMPONENTS.md) (what each module is for), [TEST_EXECUTION_MODEL.md](TEST_EXECUTION_MODEL.md) (how `Suite=Core` and fast-core filters run in CI and locally). Catch **accidental coupling** early: foundation assemblies pulling in hosts, domain modules referencing SQL/persistence facades, persistence sub-modules referencing the wrong sibling assemblies, or the CLI taking a dependency on the API **host** assembly instead of the HTTP **client**. - **Namespace prefixes** are a stable proxy for “depends on area X” when using NetArchTest `HaveDependencyOn` / `HaveDependencyOnAny` (prefix semantics per library). - **Persistence split assembl

Key topics:
- 1. Objective
- 2. Assumptions
- 3. Constraints
- 4. Architecture overview
- Why Tier 4 uses assembly metadata for `ArchLucid.Api`
- 5. Component breakdown
- 6. Data flow
- 7. Security model
- 8. Operational considerations
- 9. Evolution

#### `architecture/README.md`
**Purpose:** One screen to redraw **ArchLucid** as C4, know **who owns each box**, and find the **documentation index** for deeper dives.

Key topics:
- 1. System context (C4)
- Context nodes → ownership
- 2. Containers (C4)
- 3. C4 workspace (Structurizr DSL)
- 4. Documentation Index
- Orientation
- Operator shell (front end)
- Decisions and onboarding
- API and contracts
- Build, CLI, and operations
- Contributing and process

#### `ARCHITECTURE_ON_ONE_PAGE.md`
**Audience:** Evaluators, operators, and engineers who need the **system boundary, main containers, and trust edges** before opening ADRs or runbooks. **Pair with:** [`library/OPERATOR_ATLAS.md`](library/OPERATOR_ATLAS.md) (route → API → CLI map) · [`library/V1_SCOPE.md`](library/V1_SCOPE.md) (product boundary) Provide a **single page** that can be redrawn as C4 context/container views or a sequence diagram **without** re-walking the whole repository. - **Azure-first** hosting (Container Apps, SQL, private networking) unless a pilot explicitly diverges. - **Incomplete requirements** and **imperfect rollout** are normal; backlogs stay **observable** (outboxes, health, metrics) instead of failing silently. - **No public SMB (port 445)**; storage and queues use private endpoints and managed identity where possible. - **Single DDL source per database** — master SQL script plus forward-only migrations for new work. - **Configuration bridge:** `ArchLucid*` keys remain authoritative with `ArchiForge*` overrides until sunset (see [`library/CONFIG_BRIDGE_SUNSET.md`](library/CONFIG_BRIDGE_SUNS

Key topics:
- 1. Objective
- 2. Assumptions
- 3. Constraints
- 4. Architecture overview
- 4.1 System context (who touches what)
- 4.2 Containers (internal responsibilities)
- 5. Component breakdown
- 6. Data flow
- 7. Security model
- 8. Operational considerations
- Happy path (read left to right)

### API and contract model

#### `library/API_CONTRACTS.md`
**Error bodies (RFC 9457 Problem Details, obsoletes RFC 7807):** See **[API_ERROR_CONTRACT.md](API_ERROR_CONTRACT.md)** for Problem+JSON shape, stable **`type`** URIs, and correlation behavior. - **URL path:** Major version is in the path: **`/v1/...`** (see controller routes `v{version:apiVersion}`). - **Alternate readers:** Clients may also send **`api-version`** as a query string or request header (same major.minor as the URL segment, e.g. **`1.0`**) — wired in **`ArchLucid.Api/Startup/MvcExtensions.cs`** via **`ApiVersionReader.Combine`** alongside **`UrlSegmentApiVersionReader`**. - **Default:** Version **1.0** is assumed when not specified; clients should still use **`/v1`** in URLs. - **Discovery:** Responses can include **`api-supported-versions`** / **`api-deprecated-versions`** per [Asp.Versioning](https://github.com/dotnet/aspnet-api-versioning) options (`ReportApiVersions`). - **Headers:** When **`ApiDeprecation:Enabled`** is true, successful responses may include **`Deprecation`** and **`Sunset`** (and optional **`Link`** with relation `deprecation`) per product configur

Key topics:
- API versioning
- Deprecation policy
- Contract artifacts
- LLM cost signals — wire contract vs vendor economics
- Operator artifacts (`/v1/artifacts`)
- Changing the HTTP contract (PR checklist)
- Azure extractor ingest (`/v1/azure-extractor`)
- ITSM connectors (first-party)
- Explain (`/v1/explain`)
- Learning / planning (59R) (`/v1/learning`)
- Demo anonymous surfaces (`/v1/demo`)

#### `library/API_ERROR_CONTRACT.md`
Give API clients a **stable, machine-readable** error shape for failures: **`application/problem+json`** with **`type`**, **`title`**, **`detail`**, **`status`**, and **`correlationId`** where the global pipeline attaches it. **Normative reference:** [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) (*Problem Details for HTTP APIs*), which **obsoletes** [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807). The media type and JSON fields are unchanged; cite **9457** for new documentation and reviews. - Clients use **`GET /openapi/v1.json`** or the checked-in contract snapshot for response schemas. - Operators may read **`correlationId`** from response bodies or **`X-Correlation-ID`** headers (see **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)**). - Prefer **`ProblemTypes.*`** URI constants (see **`ArchLucid.Host.Core.ProblemDetails`**) so **`type`** stays stable across releases. - Do not use **empty** `NotFound()` / raw `Conflict(object)` for **client-visible** API errors when a typed problem exists — use **`ProblemDetailsExtensions`** on **`ArchLucid.Api`** (`NotFoundProblem`, `Conflic

Key topics:
- Objective
- Assumptions
- Constraints
- Architecture overview
- Component breakdown
- Data flow
- Security model
- Operational considerations
- Related docs

#### `library/API_VERSIONING.md`
Document how **Asp.Versioning** is wired for `ArchLucid.Api`, how clients should call versioned routes, and how to introduce a future **v2** without breaking v1. - Primary contract remains **OpenAPI document** `openapi/v1.json` (see CI contract snapshot tests). - Breaking changes require a new **major** API version (URL segment or explicit header). - Anonymous infrastructure endpoints (`/health/*`, `/version`) and static docs remain **version-neutral**. - Auth debug (`/api/auth/me`) and HTML docs (`DocsController`) are **version-neutral** by design. Registration lives in **`ArchLucid.Api/Startup/MvcExtensions.cs`**: - **Default version:** `1.0` with `AssumeDefaultVersionWhenUnspecified = true`. - **Reporting:** `ReportApiVersions = true` (response headers advertise supported versions). - **URL substitution:** `SubstituteApiVersionInUrl = true` — routes use `v{version:apiVersion}` (e.g. **`/v1/architecture/...`**). Controllers declare **`[ApiVersion("1.0")]`** or **`[ApiVersionNeutral]`**. A regression test **`ApiControllerApiVersionMetadataTests`** fails the build if a new controller

Key topics:
- Objective
- Assumptions
- Constraints
- Current configuration
- Adding v2 (future)
- Related

#### `architecture/api/API_V2_ROUTES.md`
Version prefix: **`v1`** (Asp.Versioning `1.0`). New product-facing routes live **alongside** legacy `v1/architecture/…` paths until clients migrate. | Concept | Meaning | |--------|---------| | **Request** | Operator intent to assess an architecture (created with the run). | | **Run** | Execution instance for that assessment. | | **Manifest** | Finalized golden manifest for the run. | | **Finding** | Structured issue/recommendation emitted from analysis. | | **Artifact** | Synthesized downloadable output tied to the manifest. | | **Review trail** | Audit timeline + rationale + provenance for explainability. | | Method | Path | Notes | |--------|------|--------| | `POST` | `/v1/requests` | Same payload as legacy `POST /v1/architecture/request`. Supports `Idempotency-Key`. | | Method | Path | Notes | |--------|------|--------| | `GET` | `/v1/runs` | Paged envelope (`PagedResponse`). Query: `page`, `pageSize`, optional `status`, `fromUtc`, `toUtc`. | | `GET` | `/v1/runs/{runId}` | Run detail (`Guid`). Aligns with authority summary/detail projections. | | `GET` | `/v1/runs/{runId}/progr

Key topics:
- Resource Taxonomy
- Canonical Routes
- Architecture requests
- Runs
- Manifest
- Findings
- Artifacts
- Review trail
- Internal / operator diagnostics (`RequireOperatorRole`)
- Governance idempotency
- Standard Envelopes

#### `contracts/archlucid-asyncapi-2.6.yaml`
asyncapi: 2.6.0 info: title: ArchLucid outbound webhooks & integration events version: 1.5.1 description: | ArchLucid **pushes** JSON to operator-configured HTTPS URLs for alert routing and digest delivery. This is **not** the primary REST API (canonical HTTP contract: OpenAPI **`/openapi/v1.json`**; **`/swagger/v1/swagger.json`** is explorer-only). When `WebhookDelivery:UseHttpClient` is true and a shared secret is configured, requests include header `X-ArchLucid-Webhook-Signature` with value `sha256=<hex>` (HMAC-SHA256 over the raw UTF-8 body). Verify using `ArchLucid.Host.Core.Services.Delivery.WebhookSignature` semantics. **Azure Service Bus (optional):** UTF-8 JSON payloads are published to a configured queue or topic (`IntegrationEvents:QueueOrTopicName`). Message `subject` and application property `event_type` carry the logical type. **Canonical** type strings are `com.archlucid.*`; legacy V1 aliases in `IntegrationEventTypes` match the same payloads and should be accepted during migration. Payloads include `schemaVersion: 1`; additive fields are expected; breaking changes shi

### Security and trust model

#### `security/MULTI_TENANT_RLS.md`
Describe how ArchLucid enforces **tenant / workspace / project isolation in SQL Server** so a compromised application tier or query bug cannot read or mutate another customer’s rows, while keeping the current **application-level scope** model (`IScopeContextProvider`) as the primary authorization gate. - Primary store is **SQL Server** (Azure SQL or boxed) with **private connectivity**; SMB/file shares are not used for tenant data at the API boundary. - **Entra ID** (or API keys in constrained scenarios) identifies the caller; **scope** (tenant, workspace, project) is derived from claims or headers and validated in the application layer. - When **`ArchLucid:SqlTopology:Mode=SystemWithPerTenantCatalogs`** (the production topology), the **database boundary is the primary and sufficient tenant isolation mechanism**. RLS is not required for defense-in-depth and is not a production requirement; it ships with `STATE = OFF` by default and is available as optional configuration. See [../library/TENANT_DATABASE_TOPOLOGY.md](../library/TENANT_DATABASE_TOPOLOGY.md). - RLS is rolled out on **eve

Key topics:
- 1. Objective
- 2. Assumptions
- 3. Constraints
- 4. Architecture overview
- 5. Component breakdown
- 6. Data flow
- 7. Security model
- 8. Operational considerations
- 9. Covered tables and known gaps (DbUp 036 + 046 + 096 + 097 + 108)
- 10. Evolution

#### `security/SOC2_SELF_ASSESSMENT_2026.md`
> **IMPORTANT:** This document is an **internal / buyer-transparency self-assessment**. It is **not** a SOC 2 Type I or Type II **audit opinion** and must not be represented as third-party attestation. **In scope:** Security (CC) and Availability (A) criteria most relevant to the hosted API + SQL data plane. Confidentiality, Processing Integrity, and Privacy are **partially** addressed where they overlap engineering controls (see gap register). | TSC theme | ArchLucid evidence (examples) | Maturity | |-----------|-------------------------------|----------| | Security — logical access | Entra / JWT roles, API keys, RBAC policies; `AuthSafetyGuard`; privileged operations audited per [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md) | Partial | | Security — data protection | SQL RLS + `SESSION_CONTEXT`; private endpoint posture (Terraform) | Partial | | Security — secure SDLC | OWASP ZAP, Schemathesis, CodeQL **security-extended**, unit/integration tiers | Strong | | Availability | `/health/*`, SLO docs, synthetic probes, runbooks | Partial | | ID | Gap | Owner | Target

Key topics:
- Scope
- Control summary (high level)
- Gap register
- SOC 2 Type I — funded scoping (Q2–Q3 2026)
- Pending questions (G-001)
- Related

#### `security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md`
**Status:** Owner-conducted assessment **(not third-party audited).** When we say third-party penetration test coverage or SOC 2, read `docs/library/V1_DEFERRED.md` §6c — those artefacts are tracked for V1.1 separately. **This is not a third-party penetration test and is not a SOC 2 attestation.** It is an **internal security self-assessment** performed by the product owner / engineering team, structured for buyer transparency until a separately funded external assessor delivers a redacted summary under [`pen-test-summaries/`](pen-test-summaries/README.md). **Assessment window (planned):** `2026-04-28` — `2026-04-28` **Scope in / out:** ArchLucid API surface (ASP.NET Core), operator UI (Next.js), SQL Server persistence layer, Docker container images, Terraform IaC modules, CI pipeline security gates. **Related templates:** [`PEN_TEST_SOW_TEMPLATE.md`](PEN_TEST_SOW_TEMPLATE.md) (borrow structure for scope), [`../go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md) (buyer index) **Last reviewed (UTC):** 2026-04-28 1. **Automated gates already in CI** — OWASP ZAP (baseline /

Key topics:
- Method
- Findings summary
- Sign-off (internal)
- Limitations

#### `go-to-market/CURRENT_ASSURANCE_POSTURE.md`
**Date:** 2026-05-01 **Last reviewed:** 2026-05-01 **Classification:** Buyer-facing (include in procurement pack ZIP) This document summarizes the security, compliance, and assurance evidence that ArchLucid provides today. Every claim below links to a source artifact in the repository. Status labels follow [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md) to avoid contradictory buyer wording. ArchLucid runs automated security checks on every pull request and merge to main. These are **merge-blocking** unless noted. | Check | Tool | What it catches | CI status | |-------|------|----------------|-----------| | Secret scanning | [Gitleaks](https://github.com/gitleaks/gitleaks) (`.gitleaks.toml`) | Leaked API keys, connection strings, tokens in committed code | **Merge-blocking** (Tier 0) | | Static analysis (security-extended) | [CodeQL](https://codeql.github.com/) (`.github/workflows/codeql.yml`) | SQL injection, XSS, insecure deserialization, tainted data flows | **Merge-blocking** | | DAST baseline | [OWASP ZAP](https://www.zaproxy.org/) (`infra/zap/`) | Common web vul

Key topics:
- 1. Continuous security testing in CI
- 2. Data isolation model
- 3. Audit trail
- 4. Threat modeling
- 5. Compliance and privacy
- 6. Penetration testing
- 7. Infrastructure as Code
- 8. Contact

#### `go-to-market/TRUST_CENTER.md`
**Buyer posture table (single index):** [`docs/go-to-market/trust-center.md`](trust-center.md) — same evidence links; rendered in-product at **`/trust`**. **Audience:** Security reviewers, procurement, and legal teams evaluating ArchLucid as a **vendor-operated (SaaS)** service. **Last reviewed:** 2026-05-01 **Canonical assurance wording:** [ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md) ArchLucid is built so that **security, privacy, and operational transparency** are first-class: identity-backed access, defense-in-depth on the data plane, measurable reliability targets, and documentation you can trace to the product and infrastructure code. This page is the **buyer-facing index** into policies and deep technical references maintained in the repository. - **Identity:** Microsoft **Entra ID** or **other OIDC issuers** (JWT bearer — **[V1_SCOPE.md](../library/V1_SCOPE.md) §2.12**) with **app roles** (**Admin**, **Operator**, **Reader**, **Auditor**) and optional **API keys** for automation; see [../SECURITY.md](../library/SECURITY.md) and [../CUSTOMER_TRUST_AND_ACCESS.m

Key topics:
- Security overview at a glance
- Azure connectivity (extractor posture)
- What we will never ask you to assign
- Data residency and sovereignty
- Penetration testing and security assessments
- Recent assurance activity
- Hosted staging probes (internal rollup)
- Trust documents
- Get the procurement pack
- Compliance and certifications
- Commercial terms

#### `go-to-market/SOC2_STATUS_PROCUREMENT.md`
**Last reviewed:** 2026-05-01 **Canonical wording source:** [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md) **Formal SOC 2 Type II attestation:** **Not yet issued** — programme deferred until funded CPA / assessor engagement (see [`TRUST_CENTER.md`](TRUST_CENTER.md) compliance table and [`../security/SOC2_SELF_ASSESSMENT_2026.md`](../security/SOC2_SELF_ASSESSMENT_2026.md) for interim self-assessment posture under internal ownership). **SOC 2 Type I engagement:** Not started; deferred until funded assessor engagement. Procurement teams should treat the self-assessment document as **non-attestation** evidence alongside this pack’s technical controls references (`MULTI_TENANT_RLS.md`, `AUDIT_COVERAGE_MATRIX.md`, `SECURITY.md`).

Key topics:

#### `go-to-market/TENANT_ISOLATION.md`
**Audience:** Security reviewers who need a **short** explanation before diving into engineering docs. **Last reviewed:** 2026-04-15 **Headline:** Your data is **logically isolated** at **identity**, **application**, and **database** layers when ArchLucid is deployed with the recommended Azure posture. This page summarizes; deep references are linked below. **Healthcare / PHI:** ArchLucid is for **architecture and governance evidence** about systems you describe; **do not upload PHI** into product briefs or unstructured context fields. Posture and contractual questions (including BAA) are summarized under **[`docs/go-to-market/trust-center.md`](../go-to-market/trust-center.md)** (**Healthcare and PHI**); inquiries → **`sales@archlucid.net`**.

Key topics:
- 1. Three layers
- 2. Encryption
- 3. Network
- 4. Audit and accountability
- 5. What we do not claim here
- 6. Deep dives
- Related documents

### Buyer and procurement model

#### `go-to-market/BUYER_PERSONAS.md`
**Audience:** Product, sales, and marketing teams who need a shared understanding of who buys ArchLucid, why, and how they evaluate it. **Last reviewed:** 2026-04-15 **Grounding rule:** Capabilities and limitations referenced here reflect the V1 codebase per [V1_SCOPE.md](../library/V1_SCOPE.md) and [CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md). 1. **Sales:** Use personas to qualify leads quickly. If the prospect does not match at least one persona, the deal is likely a poor fit for V1. 2. **Marketing:** Use pain points and language to craft messaging that resonates. 3. **Product:** Use evaluation criteria and objections to prioritize roadmap items. 4. **Demo prep:** Tailor the demo to the persona in the room — each values different features. | Attribute | Detail | |-----------|--------| | **Title** | Enterprise Architect, Chief Architect, Principal Architect, Head of Architecture | | **Reports to** | CTO or VP Engineering | | **Team size** | 3–15 architects in a central practice or federated across business units | | **Organization** | 500–10,000+ employee

Key topics:
- How to use this document
- Persona 1: The Enterprise Architect / Chief Architect
- Profile
- Responsibilities and goals
- Pain points ArchLucid addresses
- How they evaluate tools
- What would make them champion ArchLucid
- What would make them reject ArchLucid
- Key objections and responses
- Demo priorities (what to show first)
- Persona 2: The VP Engineering / Head of Platform Engineering

#### `go-to-market/BUYER_JOURNEY.md`
Help enterprise architecture and platform leaders **hire ArchLucid** to turn messy architecture requests into **reviewable, versioned manifests, evidence, and governance-ready artifacts** in weeks instead of quarters — without replacing their existing EA tools wholesale. - The buyer already has **Confluence/Jira**, **draw.io or similar**, and **some** formal governance (even if inconsistent). - **Entra ID** (or equivalent) exists; the team can approve an Azure-first pilot. - Economic buyers may **not** have a labeled budget line** for “AI architecture OS”; value must map to **release risk**, **audit evidence**, or **review cycle time**. - Sales motion is **multi-stakeholder** (EA, security reviewer, SRE, procurement). - **LLM outputs are not legal proof**; value is in **traceability, versioning, and workflow discipline**. - **Data residency** and **tenant isolation** are non-negotiable in regulated pilots; unsupported regions are a stop condition (see [NOT_A_FIT.md](NOT_A_FIT.md)). ArchLucid is an **AI-assisted architecture workflow** with three product layers: **Core Pilot** (reques

Key topics:
- Objective
- Assumptions
- Constraints
- Architecture overview (buyer mental model)
- Component breakdown (what the buyer touches)
- Data flow
- Security model
- Operational considerations
- Three pilot success metrics (measurable)

#### `go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`
**Audience:** CIOs, CTOs, chief architects, architecture review sponsors, governance leaders, and pilot sponsors who need a concise explanation of what ArchLucid does and why a pilot matters. **Status:** Sponsor-facing V1 summary. This brief is grounded in what the current product supports today. It is not a pricing sheet and it does not claim enterprise-wide transformation. This file is the outward **sponsor story of record**: why a pilot matters, what success should look like in plain language, and what not to over-claim. Other docs and go-to-market pages should align here rather than grow a second buyer story. Use the related links for ROI measurement, packaging semantics, operator motion, and positioning. - **[READ_THIS_FIRST.md](archive/READ_THIS_FIRST.md)** — forced decision-tree entry (buyer vs contributor vs security vs architecture) - **[README.md](REPOSITORY_README.md)** — repo entry and deeper operator material - **[go-to-market/EXECUTIVE_ONE_EMAIL_KIT.md](go-to-market/EXECUTIVE_ONE_EMAIL_KIT.md)** — one-email sponsor/procurement copy (subject, ~120-word summary, four-artifact che

Key topics:
- Related
- 1. What ArchLucid is
- 2. What problem it solves
- 3. Core Value Pillars
- Pillar 1: AI-native architecture analysis
- Pillar 2: Auditable decision trail
- Pillar 3: Enterprise governance
- 4. Elevator Pitches
- 30-second pitch
- 60-second pitch
- 5. What Pilot proves

#### `go-to-market/PROCUREMENT_EVIDENCE_PACKET.md`
**Audience:** Procurement reviewers, security reviewers, GRC teams, architecture sponsors, and enterprise buyers who need to understand what ArchLucid V1 proves, which evidence exists, and which items are explicitly deferred. **Use this when:** A buyer asks, "What can I give my CIO, security team, architecture review board, or procurement committee so they can evaluate ArchLucid without reading the whole repository?" **Buyer-safe rule:** This packet only points to existing evidence. It does **not** claim SOC 2 Type II, a third-party penetration test, a published public reference customer, live Stripe production transactability, or a published Marketplace offer unless a linked source explicitly says that status has changed. ArchLucid is an AI-assisted architecture workflow system that shortens the path from an architecture request to a reviewable, defensible architecture package. V1 is best understood as a **sales-led pilot product** for regulated enterprise architecture teams: it helps teams produce a committed manifest, findings, reviewable deliverables, evidence trail, governance c

Key topics:
- 1. One-page buyer summary
- 2. What V1 proves
- 3. Procurement reviewer checklist
- 4. Evidence map by stakeholder
- CIO / CTO / executive sponsor
- Architecture review board / chief architect
- Security / GRC / procurement
- Pilot owner / sales engineer
- 5. Explicit non-claims and deferred items
- 6. Pilot packet contents
- 7. Recommended buyer-facing answer

#### `go-to-market/PROCUREMENT_FAQ.md`
**Audience:** procurement, InfoSec questionnaires, resilience reviews preparing **SOC 2** / SIG / CAIQ spreadsheets. **Evidence index:** **[trust-center.md](trust-center.md)** **Canonical assurance wording:** **[ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md)** **SIG / CAIQ row acceleration:** **[PROCUREMENT_RESPONSE_ACCELERATOR.md](PROCUREMENT_RESPONSE_ACCELERATOR.md)** — fifty Shared-Assessments-style prompts mapped to **in-repo** evidence links and honesty labels (**Implemented / Self-asserted / In flight / Deferred V1.1**); **SOC 2 Type II “issued” is not claimed** there—see **[SOC2_STATUS_PROCUREMENT.md](SOC2_STATUS_PROCUREMENT.md)**. **Answer:** Today we publish a **SOC 2 self-assessment** and control mapping—SOC 2 **Type II** CPA attestation is **not currently issued** ([SOC2_SELF_ASSESSMENT_2026.md](../security/SOC2_SELF_ASSESSMENT_2026.md)). Type **I** followed by Type **II** is the typical SaaS roadmap once operating evidence exists alongside budget. **Answer:** **V1** uses **owner-conducted** penetration-style testing and internal assessments (see [`2026-Q2-O

Key topics:
- Q & A
- 1. Do you have SOC 2 Type II?
- 2. Can we see the latest penetration-test report?
- 3. Where is customer **data processed / stored**?
- 4. Can we authenticate with **Okta / Ping / Auth0** instead of Microsoft Entra ID?
- 5. What **SLA** do you publish?
- 6. Can we execute the **Data Processing Agreement**?
- 7. What **subprocessors** apply?
- 8. What happens if ArchLucid **ceases trading**?
- 9. Do you maintain **cyber insurance**?
- 10. Can we speak with **reference customers**?

#### `go-to-market/PROCUREMENT_OBJECTION_PLAYBOOK.md`
**Audience:** Sales engineering, security contacts, and procurement responders. **Last reviewed:** 2026-05-01 - Use the short answer first. - Expand with the long answer when reviewers request detail. - Escalate when the trigger condition is met. - Keep claims aligned with `ASSURANCE_STATUS_CANONICAL.md`. - **Short answer:** No. We provide a SOC2 self-assessment and technical evidence pack; external attestation is not currently issued. - **Long answer:** SOC2 Type II is not issued. Current posture is explicit self-assessment plus control evidence in-repo. We do not represent this as a CPA opinion. - **Evidence:** [SOC2_STATUS_PROCUREMENT.md](SOC2_STATUS_PROCUREMENT.md), [../security/SOC2_SELF_ASSESSMENT_2026.md](../security/SOC2_SELF_ASSESSMENT_2026.md), [ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md) - **Escalate when:** Buyer requires contractual attestation date commitment. - **Short answer:** V1 uses owner-conducted penetration-style testing; third-party engagement is V2-scoped. - **Long answer:** We provide owner-conducted testing evidence for V1 and external-enga

Key topics:
- Usage
- Objections
- 1) "Do you have SOC2 Type II today?"
- 2) "Where is the third-party pen-test report?"
- 3) "Your DPA has placeholders. Is it executable?"
- 4) "How do we know incident communication is real?"
- 5) "What are your data residency commitments?"
- 6) "How often are these trust docs reviewed?"
- 7) "Can we trust that docs are consistent?"
- 8) "How do we know this pack is complete?"
- 9) "Do you support legal fallback if support channels fail?"

#### `go-to-market/PRICING_PHILOSOPHY.md`
**Audience:** Product leadership, sales, and finance — internal alignment before external pricing publication. **Last reviewed:** 2026-05-01 (interim Stripe Team bundled monthly — § 3.2) **Grounding:** Pricing anchors to the ROI model in [ROI_MODEL.md](ROI_MODEL.md) (break-even at ~180 architect-hours/year) and buyer personas in [BUYER_PERSONAS.md](BUYER_PERSONAS.md). **Single source of truth:** All price figures live **only** in this file, [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md), [TRIAL_AND_SIGNUP.md](TRIAL_AND_SIGNUP.md), and [docs/CHANGELOG.md](../CHANGELOG.md). Every other doc must **link here** rather than restate numbers; the CI check `scripts/ci/check_pricing_single_source.py` enforces this on every pull request. **Marketplace tier naming** (Team / Professional / Enterprise) is guarded by `scripts/ci/assert_marketplace_pricing_alignment.py` against [`MARKETPLACE_PUBLICATION.md`](MARKETPLACE_PUBLICATION.md) and [`AZURE_MARKETPLACE_SAAS_OFFER.md`](../AZURE_MARKETPLACE_SAAS_OFFER.md). **Quote path vs live checkout (2026-04-22):** When Stripe / Marketplace checkout is not

Key topics:
- 1. Pricing principles
- 2. Pricing model evaluation
- 3. Packaging tiers
- Tier overview
- Feature gates
- 3.1 Canonical Marketplace tier names
- 3.2 Interim Stripe Team self-serve (bundled SKU)
- 4. Pilot pricing
- 4.1 Reference-customer discount (standardized 2026-04-21)
- 5. Locked list prices (2026)
- 5.1 Derivation (50%-of-fair-value basis)

### Deployment and operations model

#### `deployment/STAGING_DEPLOYMENT_CHECKLIST.md`
**Purpose:** Prerequisite and verification list for bringing the **hosted SaaS trial funnel** online on **staging** using **existing** Terraform and CI — **no new resources** in this document; operators apply or configure what is already defined in the repo. Covers signup, tenant provisioning, first-value experience, and health probes. Aligned with [TRIAL_AND_SIGNUP.md](../go-to-market/TRIAL_AND_SIGNUP.md), [REFERENCE_SAAS_STACK_ORDER.md](../library/REFERENCE_SAAS_STACK_ORDER.md), and [BUYER_FIRST_30_MINUTES.md](../BUYER_FIRST_30_MINUTES.md). **Last updated:** 2026-04-25 Apply nested stacks in the order documented in [REFERENCE_SAAS_STACK_ORDER.md](../library/REFERENCE_SAAS_STACK_ORDER.md) (multi-root table). Staging-relevant roots for workloads and edge: | Order (multi-root) | Root | Role for staging | |-------------------|------|------------------| | 1–5 | `infra/terraform-private` … `infra/terraform-storage` | Network, Key Vault, SQL, storage — **foundation** | | 5–6 | `infra/terraform-servicebus`, `infra/terraform-logicapps` | Optional messaging / automation for jobs and trial em

Key topics:
- 1. Default apply order (Terraform)
- 2. GitHub: merge-to-staging CD (optional automation)
- 3. Container Apps images (Terraform vs CD)
- 4. Azure Front Door and `staging.archlucid.net`
- 5. SQL, Key Vault, Entra, Service Bus
- 6. Demo seed and trial sample data (important)
- 7. Repository variable: `ARCHLUCID_STAGING_BASE_URL` (hosted probes)
- 8. One-page operator smoke (after deploy)
- 9. Related documentation
- 10. Constraints (this change set)

#### `engineering/DEPLOYMENT.md`
> **Audience banner — read first.** ArchLucid is a **SaaS** product. **Customers never deploy ArchLucid; ArchLucid hosts it for them at `archlucid.net`.** This document is for **internal ArchLucid operators and release managers** running our hosted production / staging environments. Customer entry points: **[`START_HERE.md`](../START_HERE.md)** "Audience split" and `archlucid.net`. This document ties together how **ArchLucid** (product; repository and assemblies still use `ArchLucid.*` until rename Phase 5–6) is released, how database changes roll forward, and where to find deeper procedures. It is aimed at **internal operators and release managers**, not at local `docker compose`-only workflows (see **`docs/engineering/BUILD.md`** and **`docs/engineering/CONTAINERIZATION.md`**). **New to the repo?** Phased checklist from laptop to Azure: **`docs/onboarding/day-one-sre.md`** (and **`docs/START_HERE.md`** hub). - Apply application + infrastructure changes in a **predictable order** (schema before behavior that depends on new columns, or feature flags when order cannot be guaranteed).

Key topics:
- Objectives
- Assumptions
- Application deployment
- Rollback
- Related documentation
- CORS (browser → API)
- Security note

#### `runbooks/PILOT_RESCUE_PLAYBOOK.md`
Use when you need **symptom → likely cause → first command → deeper doc**. Full flow: **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** and **[CORE_PILOT.md](../CORE_PILOT.md)**. **Correlation:** Include **`X-Correlation-ID`** (and `correlationId` inside ProblemDetails JSON) in notes whenever you open a thread, grep logs, or attach diagnostics. **Support bundle:** From a machine with CLI access to the tenant, run **`archlucid support-bundle --zip`** (or your deployment’s equivalent). Open **`README.txt`** then **`next-steps.json`**; use **`references.json`** for doc paths from repo root. Inspect contents before external send—see **support bundle** row below and [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) (support bundle / redaction). | Symptom | Likely cause | First command / check | Next doc | | --- | --- | --- | --- | | API unreachable / connection refused | Host down, wrong URL/port, network | `dotnet run --project ArchLucid.Cli -- doctor`; confirm `ARCHLUCID_API_URL` / TLS | [COMMON_ERRORS.md](COMMON_ERRORS.md), [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) | | **`/health/ready`** un

Key topics:

#### `library/DEPLOYMENT_CD_PIPELINE.md`
This document describes the multi-job **CD** workflow (`.github/workflows/cd.yml`). It complements [DEPLOYMENT.md](./DEPLOYMENT.md) and [DEPLOYMENT_TERRAFORM.md](./DEPLOYMENT_TERRAFORM.md). Provide a **repeatable V1-style** path: build and push container images to ACR, optionally plan/apply Terraform for the same environment, roll **API + worker + UI** Container App revisions to the new tag, smoke the public API surface, optionally roll back revisions on failed smoke, optionally publish the API client to NuGet, and notify—using **Azure OIDC** only (no long-lived service principal client secrets in GitHub). - GitHub **Environments** `dev`, `staging`, and `production` exist when you use those CD targets; use **required reviewers** on `staging` and `production` (and optionally on `dev`) for manual gates before jobs that reference those environments run. - Azure Federated Credentials map each environment (or the workflow) to Entra app registration(s) used by `azure/login@v2`. - Operators copy `terraform.tfvars.example` → `terraform.tfvars` and `production.tfvars.example` → `production.tf

Key topics:
- Objective
- Assumptions
- Architecture overview (nodes and flow)
- Job breakdown
- Post-deploy validation behavior
- Security model
- Traceability
- GitHub Environment secrets and variables (checklist)
- Operational considerations
- Related workflows

#### `library/OBSERVABILITY.md`
**Audience:** SRE, platform engineers, and developers wiring Prometheus/Grafana, Application Insights, or OTLP exporters. **Scope:** This doc lists **stable** custom instrumentation names owned in **`ArchLucid.Core.Diagnostics.ArchLucidInstrumentation`**. It is not an exhaustive inventory of ASP.NET Core, HTTP client, or SQL client auto-instrumentation. Registration lives in **`ArchLucid.Host.Core`** → **`ObservabilityExtensions.AddArchLucidOpenTelemetry`**. Custom metrics (including **`archlucid_agent_output_*`**) only reach **Application Insights**, a **collector**, or **Prometheus** after you configure **at least one** export path: | Mechanism | What to set | |-----------|-------------| | **Azure Monitor / Application Insights** | **`APPLICATIONINSIGHTS_CONNECTION_STRING`** (environment — typical on Azure), or **`ApplicationInsights:ConnectionString`**, or **`Observability:AzureMonitor:ApplicationInsightsConnectionString`**. Enables **`AddAzureMonitorMetricExporter`** and trace exporter. | | **OTLP** | Non-empty **`Observability:Otlp:Endpoint`** (absolute URI). Optional: **`Observ

Key topics:
- Export path configuration (OpenTelemetry)
- committed JSON only (CI / clean tree; ignores your shell env) — expect **WARN** verdict unless JSON layers include an exporter
- release gate: fail when verdict is not PASS (e.g. missing Worker export, or Api still absent with env overlay)
- Agent-output quality alerts (Prometheus / Grafana)
- Meter
- Histograms and counters (selected)
- Business-Level KPI Metrics
- Explanation cache hit ratio (Prometheus)
- Trial funnel (self-service product metrics)
- Activity sources (custom)
- Trace tags (conventions)

### Testing and quality model

#### `library/COVERAGE_GAP_ANALYSIS.md`
> Describe how **line/branch coverage** is collected in CI, how to reproduce reports locally, and interpret trends vs CI gates. **Merged line / branch / per-package floors** (including **`ArchLucid.Persistence`** at **≥ 63%** line for its assembly) are enforced **only** in GitHub Actions on the merged Cobertura from the full solution test run with SQL — job id **`dotnet-full-regression`**, display name **`.NET: full regression (SQL)`** in **`.github/workflows/ci.yml`**. That job sets **`ARCHLUCID_SQL_TEST`**, runs **`dotnet test ArchLucid.sln`** with **`coverage.runsettings`**, merges reports, then runs **`scripts/ci/assert_merged_line_coverage_min.py`**. **Treat that result and the uploaded artifact `coverage-merged-cobertura` (`Cobertura.xml`) as authoritative** when debugging a red coverage gate. **Local default (fast iteration).** When adding **`ArchLucid.Persistence.Tests`**, verify behavior without Coverlet so runs stay short: - **Cross-platform:** `scripts/ci/test-persistence-local-fast.sh` - **Windows:** `scripts/ci/test-persistence-local-fast.ps1` Or manually:

Key topics:
- Objective
- Recommended workflow: Persistence and strict gates (CI-first)
- Strict profile (product target)
- Current merge-blocking gates
- Local run (merged HTML)
- Exclusions
- Hotspots and backlog hooks
- Security, scalability, reliability, cost
- Snapshot Data
- All assemblies by line coverage (lowest first)
- Per-assembly class gaps (by line coverage %)

#### `library/AUDIT_COVERAGE_MATRIX.md`
This document maps **state-changing** workflows to the audit signals they emit. ArchLucid has two parallel **channels** that share one **string catalog** in `ArchLucid.Core.Audit.AuditEventTypes`: 1. **Durable SQL audit** — `IAuditService.LogAsync` → `IAuditRepository.AppendAsync` → `dbo.AuditEvents` (`ArchLucid.Core.Audit.AuditEvent`). Event types use **top-level** `AuditEventTypes.*` constants (e.g. `RunStarted`, `GovernanceApprovalSubmitted`). 2. **Baseline mutation log** — `IBaselineMutationAuditService.RecordAsync` → structured **ILogger** lines only (`ArchLucid.Application.Common.BaselineMutationAuditService`). Event types use **`AuditEventTypes.Baseline.Architecture.*`** and **`AuditEventTypes.Baseline.Governance.*`** (namespaced string values). These **do not** populate `dbo.AuditEvents`. `ArchLucid.Application.Governance.GovernanceAuditEventTypes` mirrors **`AuditEventTypes.Baseline.Governance`** values for documentation and some workflow code paths. **`GovernanceWorkflowService`** dual-writes: baseline channel with **`Baseline.Governance.*`** **and** `IAuditService` with to

Key topics:
- Design notes (ADR-style)
- Indexes on `dbo.AuditEvents`
- Audit retrieval and export (read paths; no new `IAuditService` row)
- Operations → durable audit (`IAuditService` → `dbo.AuditEvents`)
- Baseline mutation logging only (`IBaselineMutationAuditService` — not `dbo.AuditEvents`)
- Known gaps (mutating behavior without durable `IAuditService` event)
- Mutating / lifecycle — verified
- Read-path / reserved observability (not an append-only weakness)
- Coverage statistics (manual; refresh when adding call sites)
- Appendix — Core `AuditEventTypes` registry (one row per constant)
- Appendix — `AuditEventTypes.Run` registry (canonical coordinator durable rows)

#### `library/TEST_EXECUTION_MODEL.md`
This document is the **canonical reference** for how the ArchLucid product codebase (`ArchLucid.*` assemblies) classifies and runs automated tests. It aligns local scripts, contributor docs, and CI behavior. **See also:** [TEST_STRUCTURE.md](TEST_STRUCTURE.md) (**54R operator cheat sheet** — copy-paste commands), [BUILD.md](BUILD.md) (SQL Server setup for tests), [API_FUZZ_TESTING.md](API_FUZZ_TESTING.md) (scheduled Schemathesis OpenAPI fuzz), [RELEASE_LOCAL.md](RELEASE_LOCAL.md) (**56R** — `build-release`, `package-release`, `run-readiness-check`), [RELEASE_SMOKE.md](RELEASE_SMOKE.md) (**56R** — `release-smoke` E2E gate). > **Canonical entry point (2026-04-20).** Every tier below can be invoked from the repo root with the consolidated driver: **`.\scripts\test.ps1 -Tier <name>`** (PowerShell) or **`test.cmd <name>`** (cmd trampoline). Tier names: `Core`, `FastCore`, `OpenApiContract`, `Integration`, `SqlServerIntegration`, `Full`, `UiUnit`, `UiSmoke`, `Slow`. Run **`.\scripts\test.ps1 -ListTiers`** for the full list. The legacy `test-<tier>.cmd` / `test-<tier>.ps1` scripts still exist as **shims**

Key topics:
- Objectives
- Suite definitions
- 1. Core suite (“corset”)
- 2. Fast core subset
- 3. Integration suite (HTTP / host)
- 4. SQL Server–first integration (Dapper / Persistence)
- 5. Full regression
- 6. Operator shell unit (Next.js + Vitest)
- 7. Operator shell — Vitest axe (components) and mock Playwright (on demand)
- Combining filters (examples)
- CI mapping (54R)

#### `library/API_FUZZ_TESTING.md`
This document describes **Schemathesis**-based property testing of the ArchLucid HTTP API against the **OpenAPI** document. It complements contract snapshots ([OPENAPI_CONTRACT_DRIFT.md](OPENAPI_CONTRACT_DRIFT.md)), PR CI, and the weekly **ZAP** baseline ([security/ZAP_BASELINE_RULES.md](../security/ZAP_BASELINE_RULES.md)). **Workflow:** [`.github/workflows/schemathesis-scheduled.yml`(../../.github/workflows/schemathesis-scheduled.yml) **Upstream:** [Schemathesis](https://github.com/schemathesis/schemathesis) (official Docker image `schemathesis/schemathesis:stable`) Schemathesis performs **property-based API fuzzing** driven by the **OpenAPI specification**. It generates large numbers of requests—both schema-valid and deliberately invalid—to surface: - Crashes and unhandled exceptions - Unexpected **5xx** responses on inputs the spec allows (or that edge the spec) - **Response bodies** that do not match the documented schema - **Content-Type** mismatches vs. documented responses - **Latency** regressions relative to configured thresholds Unlike a fixed integration test suite, Schema

Key topics:
- Purpose
- When it runs
- What it checks
- How to run locally
- A — CI-parity (recommended to reproduce the workflow)
- Wait until the API responds (same probe as CI)
- B — Against `docker compose` full-stack API
- Resolve one Docker network attached to the API container (first listed)
- Interpreting results
- JUnit XML artifact
- Common failure categories

### Integrations model

#### `integrations/CICD_INTEGRATION.md`
**Audience:** DevOps engineers and platform teams who want to integrate architecture review into their PR or build pipelines. **Last reviewed:** 2026-04-15 Architecture review traditionally happens in meetings — after the code is written and the PR is merged. ArchLucid can shift architecture review **left** into the PR workflow, giving developers feedback on architecture decisions **before** they merge.

Key topics:
- 1. Why
- 2. Pattern
- 3. Setup
- GitHub Actions
- Azure DevOps
- 4. Configuration options
- 5. Security
- 6. Limitations (V1)
- Related documents

#### `integrations/GITHUB_ACTION_MANIFEST_DELTA.md`
> **Picking a vendor:** [GitHub job summary](GITHUB_ACTION_MANIFEST_DELTA.md) · [GitHub PR comment](GITHUB_ACTION_MANIFEST_DELTA_PR_COMMENT.md) · [Azure DevOps job summary](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md) · [Azure DevOps PR comment](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) · [Azure DevOps server-side](AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) **Audience:** Platform engineers wiring ArchLucid into GitHub pull-request review. **Purpose:** Surface **`GET /v1/compare`** (structured golden-manifest delta between two **committed** runs) in the Actions job summary so reviewers see added/removed/changed counts without opening the operator UI first. **Action path:** [`integrations/github-action-manifest-delta/`](../../integrations/github-action-manifest-delta/) (composite action). - Both runs must exist in the **same tenant scope** as the API key and must already have **golden manifests** (committed). Otherwise the API returns **404** — see [`docs/API_CONTRACTS.md`](../library/API_CONTRACTS.md) and [`docs/COMPARISON_REPLAY.md`](../library/COMPARISON_REPLAY.md).

Key topics:
- Prerequisites
- Secrets
- Example (copy-paste)
- Operator deep link
- Related

#### `integrations/AZURE_DEVOPS_PR_DECORATION.md`
> Moved. Pick your path: [pipeline task (recommended for ADO-shop pilots)](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) · [server-side handler (zero pipeline changes)](AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md).

#### `integrations/MICROSOFT_TEAMS_NOTIFICATIONS.md`
| Node | Role | |------|------| | ArchLucid API | `POST /v1/integrations/teams/connections` stores `KeyVaultSecretName` + optional `Label` per tenant (`ExecuteAuthority`). | | Azure Key Vault | Holds the actual Teams incoming webhook URL as a secret value. | | Logic Apps Standard | Subscribes to Service Bus; resolves secret; POSTs Adaptive Card to Teams (see `infra/terraform-logicapps/workflows/teams-notifications/README.md`). | | Service Bus | Topics per [`schemas/integration-events/catalog.json`](../../schemas/integration-events/catalog.json). | The v1 production workflow subscribes to the following `eventType` values. Owner approved the expanded set on **2026-04-21** (PENDING_QUESTIONS.md item 32): | `eventType` | When fired | Action link in card | |-------------|-----------|---------------------| | `com.archlucid.authority.run.completed` | A run reaches the committed manifest state | `/runs/{runId}` | | `com.archlucid.governance.approval.submitted` | A governance approval has been requested or submitted | `/governance/approvals/{approvalId}` | | `com.archlucid.alert.fired` | An a

Key topics:
- Architecture
- v1 default trigger set (2026-04-21 — six events)
- Per-trigger opt-in matrix (added 2026-04-21)
- API
- List the canonical trigger catalog (Read+)
- Configure (Execute+)
- Read (Read+)
- Remove (Execute+)
- Operator UI
- Screenshot stub

#### `integrations/SCIM_PROVISIONING.md`
ArchLucid acts as a **SCIM 2.0 Service Provider** (RFC 7644). Your identity provider (Microsoft Entra ID, Okta, OneLogin, or any SCIM client speaking core User/Group semantics) can **provision, update, and deactivate** users mapped into ArchLucid **tenant-scoped** SCIM tables. | Setting | Value | |--------|--------| | **SCIM base URL** | `https://<your-host>/scim/v2` | | **Authentication** | HTTP `Authorization: Bearer <token>` using the plaintext token issued from ArchLucid (see operator runbook). | | **Users resource** | `/Users` | | **Groups resource** | `/Groups` (membership drives **role hints** via configured group→role mapping). | 1. **Tenant tier** must support enterprise automation (per your order / contract). 2. **Seat limit** — `EnterpriseSeatsLimit` may be set on the tenant row; active SCIM users count toward `EnterpriseSeatsUsed`. 3. **Admin issues SCIM token** — `POST /v1/admin/scim/tokens` (interactive admin session, not SCIM bearer). - **No anonymous SCIM** — unauthenticated calls receive **401**. - **Filter support** — `eq`, `ne`, `co`, `sw`, `ew`, `gt`, `lt`, `ge`,

Key topics:
- What you configure in your IdP
- Enterprise prerequisites
- Behaviour highlights
- Further reading

#### `integrations/WEBHOOK_SCHEMAS.md`
> **See also:** [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md) (CloudEvents envelope + `X-ArchLucid-Webhook-Signature`), [`schemas/integration-events/catalog.json`](../../schemas/integration-events/catalog.json). - **`GovernanceApprovalRequested`** appears as **`dbo.AuditEvents.EventType`** / buyer-facing audit timelines when operators request governance review (see [`AuditEventTypes`](../../ArchLucid.Core/Audit/AuditEventTypes.cs)). - **`com.archlucid.governance.approval.submitted`** (`IntegrationEventTypes.GovernanceApprovalSubmittedV1`) is the **integration-event / webhook** string emitted after an approval request is persisted — use this constant when subscribing via Service Bus (`event_type` application property) or outbound webhook routers. When `WebhookDelivery:UseCloudEventsEnvelope` is **true**, receivers obtain a **CloudEvents 1.0** wrapper (`specversion`, `type`, `source`, `id`, `time`, `datacontenttype`, `data`). The `data` object matches the payload schemas below. When **false**, POST bodies are the payload JSON directly (camelCase,

Key topics:
- Naming note: audit vs integration types
- HTTP webhook envelope
- Primary payloads
- `com.archlucid.authority.run.completed`
- Governance approval submitted (`GovernanceApprovalSubmittedV1`)
- Additional schemas
- Verification hooks in-repo

---

## Part 5 — Recommended cleanup backlog

| Priority | Work item | Description |
|---|---|---|
| P0 | Create a document status standard | Add YAML front matter to all current non-archive docs. Mark canonical/supporting/draft/archived/superseded. |
| P0 | Exclude archive from normal navigation | Keep archive available, but remove it from START_HERE paths, generated indexes, and buyer/developer onboarding. |
| P0 | Canonicalize terminology | Replace buyer-visible run/pipeline/warning language with review/package/manifest/finding/risk/control/audit terms. |
| P1 | Create PRODUCT_OVERVIEW.md | One authoritative internal description of ArchLucid: product thesis, buyer, primary workflows, architecture, trust posture, V1/V2 scope. |
| P1 | Create GLOSSARY.md | Enforce the product vocabulary and identify deprecated terms. |
| P1 | Split go-to-market | Separate public copy, buyer collateral, procurement pack, sales enablement, and internal competitive analysis. |
| P1 | Create a current-document map | A human-readable and machine-generatable map of current docs by persona and task. |
| P1 | Collapse duplicate onboarding docs | Retain one canonical onboarding guide per persona: buyer/evaluator, developer, SRE/operator, security/GRC. |
| P1 | Tame assessment history | Move all dated assessments and Cursor prompts into an archive/research area with an index and a “latest accepted findings” summary. |
| P2 | Use template families | Apply common templates for ADRs, runbooks, buyer pages, security evidence, API contracts, and troubleshooting pages. |

---

## Part 6 — Non-archive document catalog

This catalog includes current non-archive Markdown documents. It is intentionally concise per file so the generated master summary stays navigable.

### `ARCHITECTURE_ON_ONE_PAGE.md`

#### `ARCHITECTURE_ON_ONE_PAGE.md`
**Scope:** **Scope:** Canonical architecture poster — C4-style map, ownership, and happy-path trace; defers playbooks to linked library docs.
**Title:** Architecture on one page
**Summary:** **Audience:** Evaluators, operators, and engineers who need the **system boundary, main containers, and trust edges** before opening ADRs or runbooks. **Pair with:** [`library/OPERATOR_ATLAS.md`](library/OPERATOR_ATLAS.md) (route → API → CLI map) · [`library/V1_SCOPE.md`](library/V1_SCOPE.md) (product boundary) Provide a **single page** that can be redrawn as C4 context/container views or a sequence diagram **without** re-walking the whole repository. - **Azure-first** hosting (Container Apps, SQL, private networking) unless a pilot explicitly diverges. - **Incomplete requirements** and **imperfect rollout** are normal; backlogs stay **observable** (outboxes, health, metrics) instead of fail
**Headings:** Architecture on one page; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 4.1 System context (who touches what); 4.2 Containers (internal responsibilities); 5. Component breakdown

### `BUYER_FIRST_30_MINUTES.md`

#### `BUYER_FIRST_30_MINUTES.md`
**Scope:** **Scope:** Buyer-first 30 minutes — GitHub-facing stub (no install); mirrors intent of `archlucid.net/get-started`; not contributor toolchain onboarding.
**Title:** Buyer — your first 30 minutes with ArchLucid
**Summary:** > **Audience banner:** Evaluators and sponsors arriving from GitHub or a forwarded link. For engineers cloning the repo, use `docs/engineering/FIRST_30_MINUTES.md` instead. ArchLucid is a SaaS product. You will not install anything to evaluate it. You found ArchLucid on GitHub. The repository is open so engineers can read the source, the architecture decisions, and the security posture before talking to us. Evaluating the product itself happens on the hosted SaaS at archlucid.net — there is no Docker, SQL, .NET, Node, Terraform, or CLI on the buyer path. For the same five steps with screenshots and links, open archlucid.net/get-started. Five steps. Roughly thirty minutes end-to-end on a norm
**Headings:** Buyer — your first 30 minutes with ArchLucid; Where to go next

### `CHANGELOG.md`

#### `CHANGELOG.md`
**Scope:** **Scope:** ArchLucid changelog - full detail, tables, and links in the sections below.
**Title:** ArchLucid changelog
**Summary:** **Buyer shorthand (rolling):** recent entries below also call out **security / audit**, **governance & exports**, **integrations / connectors**, and **operational controls** when they change — scan section headings for *Admin*, *Audit*, *Governance*, *OpenAPI*, *Terraform*, and *support bundle*. Release entries newest-first. Each section condenses the detailed prompt logs preserved in `docs/archive/`. **Outcome.** **`RealModeDeploymentFingerprintRules`** in **`ArchLucid.Host.Core`** rejects **`AzureOpenAI:DeploymentName`** that is blank or mirrors **`AgentExecutionTraceModelMetadata`** sentinels (plus the **`fallback:`** trace prefix) when **`AgentExecution:Mode=Real`** on Production- or Sta
**Headings:** ArchLucid changelog; 2026-05-09 — Startup: **Real-mode deployment fingerprint** (Production / Staging hard fail); 2026-05-07 — Brand: **Architecture Proof Engine** + lead promise *Defensible architecture, on demand.*; 2026-05-05 — Policy: **Atlassian** sequencing — **Confluence** before **Jira** (paired workstream); 2026-05-05 — Scope: **Confluence** first-party documentation publish promoted to **V1 GA**; 2026-05-05 — Scope: **Slack** first-party chat-ops promoted to **V1 GA**; 2026-05-05 — Phase 3 **PR B**: coordinator strangler formal closure (ADR supersession + tracker/CI retirement); 2026-05-03 — Docs: **`FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER`** runbook (planned LLC seller-of-record migration)

### `CONTRIBUTOR_ON_ONE_PAGE.md`

#### `CONTRIBUTOR_ON_ONE_PAGE.md`
**Scope:** **Scope:** Contributor fast path — install order, one verification command, and where to read next; not buyer narrative, deep architecture, or operator atlas detail.
**Title:** Contributor on one page
**Summary:** **ArchLucid** is an AI-assisted architecture workflow (structured request → run → committed manifest, with exports and governance hooks). **Doc hub:** [START_HERE.md](START_HERE.md). | I want to… | Go here | | --- | --- | | **Docker-first boot (no .NET first)** | [engineering/FIRST_30_MINUTES.md](engineering/FIRST_30_MINUTES.md) | | **Build, test, migrations** | [engineering/BUILD.md](engineering/BUILD.md) | | **Where to change code** | [library/CONTRIBUTOR_CODE_MAP.md](library/CONTRIBUTOR_CODE_MAP.md) | | **Architecture poster (C4)** | [architecture/README.md](architecture/README.md) | | **HTTP API contracts** | [library/API_CONTRACTS.md](library/API_CONTRACTS.md) | | **Deployment (internal
**Headings:** Contributor on one page; Common tasks; Copy-paste (repo root); Verify in one shot (Docker running); Install + troubleshooting

### `CORE_PILOT.md`

#### `CORE_PILOT.md`
**Scope:** **Scope:** Core Pilot spine — shortest path from “new review” to committed manifest + review package; defers playbook depth to the evaluation guide and operator quickstart.
**Title:** Core Pilot
**Summary:** Use this page when you need the **four-step Core Pilot** narrative without scrolling the full evaluator guide. **Buyer / hosted path** (no install) stays in **Part 1** of **`[onboarding/EVALUATION_GUIDE.md`](onboarding/EVALUATION_GUIDE.md)**; Core Pilot specifics are expanded in **Part 2** of that guide. Do not mistake the Core Pilot checklist for full product scope — advanced Operate lanes, entitlement-specific depth, and GA-gated paths live under **[`library/V1_SCOPE.md`](library/V1_SCOPE.md)** and linked runbooks. Use Core Pilot to prove **request → execute → commit → review package** once on **your** inputs. | Need | Doc | |------|-----| | Step-by-step UI + “what good looks like” | [`onb
**Headings:** Core Pilot; 1. What stays secondary (scope boundary); 2. Canonical depth and commands; First session checklist

### `PENDING_QUESTIONS.md`

#### `PENDING_QUESTIONS.md`
**Scope:** **Scope:** Product and operations decisions the repo cannot resolve alone — consolidated pending list (supersedes scattered assessment §9 lists).
**Title:** Pending questions (product and operations)
**Summary:** > **Updated 2026-05-06:** **ITSM bidirectional sync** — **both** Jira (Jira → ArchLucid finding state) and **ServiceNow** (ServiceNow → ArchLucid finding state) **confirmed in scope for V1 GA**. Supersedes "not committed unless owner adds" for ServiceNow and "may fast-follow" qualification for Jira. *Resolved 2026-05-06 (ITSM bidirectional sync — both connectors)* below. > **Updated 2026-05-05 (k):** **Live commerce cutover sequence** (**item 22**): **Stripe production first**, then **Marketplace go-live**. **Rollback owner:** **Joseph Francis** (same path for both stages). Dates + comms remain open until un-held. *Resolved 2026-05-05 (commerce cutover sequencing — item 22 partial)* below. >
**Headings:** Pending questions (product and operations); Resolved 2026-05-06 (ITSM bidirectional sync — both connectors); Resolved 2026-05-05 (Commerce cutover sequencing — item 22 partial); Resolved 2026-05-05 (Next workflow breadth — item 4); Resolved 2026-05-05 (VPAT posture — item 26); Resolved 2026-05-05 (Public pricing surface — item 13); Resolved 2026-05-05 (Reference publication owner — items 7 / 19); Resolved 2026-05-05 (SOC 2 ARR trigger — item 6)

### `READ_THIS_FIRST.md`

#### `READ_THIS_FIRST.md`
**Scope:** **Scope:** Former Y/N branch list (buyer, security reviewer, contributor, architect); routes you to the next document in one click. Not a primer or substitute for the linked docs themselves.
**Title:** Read This First
**Summary:** > **Redirect:** **[START_HERE.md](START_HERE.md)** — canonical hub.

### `START_HERE.md`

#### `START_HERE.md`
**Scope:** **Scope:** Single onboarding hub — buyer, contributor, and security routing.
**Title:** Start here — ArchLucid
**Summary:** Use this page to pick **one** door based on your role.
**Headings:** Start here — ArchLucid

### `TROUBLESHOOTING.md`

#### `TROUBLESHOOTING.md`
**Scope:** **Scope:** Root stub — canonical troubleshooting lives under **`docs/runbooks/`**.
**Title:** Troubleshooting (entry)
**Summary:** Operator and pilot triage content is maintained in **[`runbooks/TROUBLESHOOTING.md`](runbooks/TROUBLESHOOTING.md)** (symptom index, health checks, support bundle). Quick link: **[Common operator errors (top 10)](runbooks/COMMON_ERRORS.md)**.
**Headings:** Troubleshooting (entry)

### `architecture`

#### `architecture/BOUNDARY_TESTS_ROADMAP.md`
**Scope:** **Scope:** Boundary tests — what's pinned today, what's still missing - full detail, tables, and links in the sections below.
**Title:** Boundary tests — what's pinned today, what's still missing
**Summary:** | Assertion | Mechanism | |---|---| | `Core_must_not_depend_on_any_solution_project` | NetArchTest `HaveDependencyOnAny(ForbiddenFromCore)` | | `Contracts_must_not_depend_on_any_solution_project` | NetArchTest `HaveDependencyOnAny(ForbiddenFromContracts)` | | `ContractsAbstractions_may_only_depend_on_Contracts` | NetArchTest `HaveDependencyOnAny(ForbiddenFromContractsAbstractions)` | | Assertion | |---| | `Coordination_must_not_reference_Runtime` | | `Coordination_must_not_reference_Advisory` | | `Coordination_must_not_reference_Alerts` | | `Integration_must_not_reference_Runtime` | | `Integration_must_not_reference_Advisory` | | `Integration_must_not_reference_Alerts` | | Assertion | |---|
**Headings:** Boundary tests — what's pinned today, what's still missing; What is pinned today (`ArchLucid.Architecture.Tests/DependencyConstraintTests.cs`); Tier 1 — foundation isolation; Tier 2 — persistence sub-module DAG; Tier 3 — hexagonal isolation; Tier 4 — CLI isolation; Custom source-scanning lints; What is missing (the next ring)

#### `architecture/COORDINATOR_STRANGLER_INVENTORY.md`
**Scope:** **Scope:** Living inventory for ADR 0021 coordinator strangler — post-PR A3 / PR A4 ([ADR 0030](adr/0030-coordinator-authority-pipeline-unification.md)): what shipped, what stays pinned in CI, and what is **product/ADR follow-up** (not dual storage). Complements [`DualPipelineRegistrationDisciplineTests`](../../ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs) (pins **no** resurrected `ICoordinatorGoldenManifestRepository` / `ICoordinatorDecisionTraceRepository`, authority repository namespaces, and `AuthorityDrivenArchitectureRunCommitOrchestrator`), [`MvcControllerCoordinatorRepositoryFamilyGuardTests`](../../ArchLucid.Api.Tests/Startup/MvcControllerCoordinatorRepositoryFamilyGuardTests.cs) ([**`V1_SCOPE` Section 3**](../library/V1_SCOPE.md) — MVC constructor surface), and [`scripts/ci/assert_coordinator_reference_ceiling.py`](../../scripts/ci/assert_coordinator_reference_ceiling.py) (reference-count ceiling).
**Title:** Coordinator strangler inventory
**Summary:** **Objective.** Make Phase 3 retirement work visible and reviewable without guessing which symbols still anchor the coordinator pipeline. **Assumptions.** Authority is the operator manifest/commit path; **`ICoordinatorGoldenManifestRepository`** / **`ICoordinatorDecisionTraceRepository`** and **`dbo.GoldenManifestVersions`** are **removed** ([ADR 0030](adr/0030-coordinator-authority-pipeline-unification.md) PR A3 + PR A4). **Constraints.** Reintroducing coordinator interfaces or a second manifest table requires a **new ADR** — do not silently regress [`DualPipelineRegistrationDisciplineTests`](../../ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs) or [`MvcControllerCoor
**Headings:** Coordinator strangler inventory; Migrate (completed — PR A3); Keep (stable — do not weaken without ADR); Completed in code (track ADR archival separately); Completed in docs (PR B — 2026-05-05); Remaining product / ADR follow-up; Related automation

#### `architecture/MANIFEST_FINALIZATION_TRANSACTION.md`
**Scope:** **Scope:** Transactional manifest commit path (SQL stored procedure, audit row, outbox) for backend engineers; not general run troubleshooting or user-facing product copy.
**Title:** Manifest finalization transaction (authority commit)
**Summary:** Persist the **decision trace** and **golden manifest**, then atomically **finalize the run** (`dbo.Runs`), append a **durable audit** row, and enqueue an **integration outbox** message so downstream consumers see a consistent review trail. 1. `BEGIN` transaction (via `IArchLucidUnitOfWork`). 2. `SELECT … FROM dbo.Runs WITH (UPDLOCK, ROWLOCK)` — serializes concurrent finalizers for the same run; supports idempotent early return when ` LegacyRunStatus = 'Committed'`. 3. `INSERT dbo.DecisioningTraces` + `INSERT dbo.GoldenManifests` (+ relational slices via `IGoldenManifestRepository`). 4. `EXEC dbo.sp_FinalizeManifest` — `UPDATE dbo.Runs` with optimistic `RowVersionStamp` match; `INSERT dbo.Aud
**Headings:** Manifest finalization transaction (authority commit); Objective; Flow (SQL path); Database artifacts; In-memory / legacy path; Code map; Security, reliability, cost

#### `architecture/README.md`
**Scope:** **Scope:** Canonical architecture index, poster (C4 + ownership), and workspace documentation.
**Title:** ArchLucid Architecture
**Summary:** **Purpose:** One screen to redraw **ArchLucid** as C4, know **who owns each box**, and find the **documentation index** for deeper dives.
**Headings:** ArchLucid Architecture; 1. System context (C4); Context nodes → ownership; 2. Containers (C4); 3. C4 workspace (Structurizr DSL); 4. Documentation Index; Orientation; Operator shell (front end)

#### `architecture/REBRAND_WORKSTREAM_2026_04_23.md`
**Scope:** **Scope:** Historical tracker — first rename wave (Intelligence → Review Board). **Superseded for completion tracking** by [`REBRAND_WORKSTREAM_2026_05_07.md`](REBRAND_WORKSTREAM_2026_05_07.md) (Architecture Proof Engine + lead promise). Original charter (2026-04-23): Q6/Q7 seam workstream per [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md); keep as archive context.
**Title:** "AI Architecture Review Board" rebrand workstream (historical)
**Summary:** [`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) Q6 / Q7 (Resolved 2026-04-23, sixth pass) scheduled the rebrand from **"AI Architecture Intelligence"** to **"AI Architecture Review Board"** for V1, with the explicit stipulation that the workstream consumes **separate session(s)** and is sequenced **after the brand-neutral content seam ships** so each surface flip is a one-line change. This file is the running checklist for the seven PRs that complete the workstream. It is the working surface — the normative inputs are owner Q6 / Q7 in [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md), Improvement 4 in [`QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md`](../archive/root-superseded-20
**Headings:** "AI Architecture Review Board" rebrand workstream (historical); Why this exists; Architecture (decomposition); Security / Scalability / Reliability / Cost; PR sequence; How each follow-on PR works; Stop-and-ask boundaries (carried over from Prompt 4); Verification at each step

#### `architecture/REBRAND_WORKSTREAM_2026_05_07.md`
**Scope:** **Scope:** “Architecture Proof Engine” second-pass rebrand — execution tracker (category line + lead promise). Supersedes completion tracking for `REBRAND_WORKSTREAM_2026_04_23.md`.
**Title:** Architecture Proof Engine rebrand workstream (2026-05-07)
**Summary:** - **Category (`BRAND_CATEGORY`):** Architecture Proof Engine - **Lead promise (homepage H1):** Defensible architecture, on demand. Seam: [`archlucid-ui/src/lib/brand-category.ts`](../../archlucid-ui/src/lib/brand-category.ts) exports `BRAND_CATEGORY_LEGACY` (“AI Architecture Review Board”) and `BRAND_CATEGORY_LEGACY_ORIGINAL` (“AI Architecture Intelligence”) for SEO/metadata escape hatches. CI guard: [`scripts/ci/assert_brand_category_seam.py`](../../scripts/ci/assert_brand_category_seam.py) — forbids hardcoding legacy phrases in scoped marketing/app/doc surfaces unless escape-marker identifiers appear (imports from seam). | PR | Surfaces | Status | |----|----------|--------| | **PR-1** | `b
**Headings:** Architecture Proof Engine rebrand workstream (2026-05-07); Intent; PR sequence (this session); Verification; Related

#### `architecture/adrs/0001-hosting-roles-api-worker-combined.md`
**Scope:** **Scope:** ADR 0001: Hosting roles (Api, Worker, Combined) - full detail, tables, and links in the sections below.
**Title:** ADR 0001: Hosting roles (Api, Worker, Combined)
**Summary:** - **Status:** Accepted - **Date:** 2026-04-04 ArchLucid runs HTTP APIs, background jobs (advisory, outbox, durable exports), and optional combined dev hosts. Operators need clear deployment units. Use configuration **`Hosting:Role`**: **`Api`**, **`Worker`**, or **`Combined`** (default for local dev). Split processes in production for blast-radius and scaling. - **Positive:** Scale API and worker independently; validate production SQL + RLS for both paths. - **Negative:** More Terraform/Container Apps definitions and operational runbooks. - `docs/DEPLOYMENT_TERRAFORM.md` - `ArchLucid.Host.Core.Hosting.HostingRoleResolver`
**Headings:** ADR 0001: Hosting roles (Api, Worker, Combined); Context; Decision; Consequences; Links

#### `architecture/adrs/0002-dual-persistence-architecture-runs-and-runs.md`
**Scope:** **Scope:** ADR 0002: Dual persistence (ArchitectureRuns vs dbo.Runs) - full detail, tables, and links in the sections below.
**Title:** ADR 0002: Dual persistence (ArchitectureRuns vs dbo.Runs)
**Summary:** - **Status:** Superseded — see **ADR 0012** (completed 2026-04-12): legacy **`dbo.ArchitectureRuns`** and **`IArchitectureRunRepository`** removed; **`dbo.Runs`** is the sole run header table. - **Date:** 2026-04-04 Historical **`dbo.ArchitectureRuns`** (string run id) coexisted with authority **`dbo.Runs`** (GUID). Idempotency and coordinator paths used the string key while authority artifacts used the GUID header. Treat **`dbo.Runs`** as the **authority source of truth** for new features. **`ArchitectureRuns`** remained for compatibility until fully migrated. - **Positive:** Clear direction for new code; ROWVERSION and RLS target authority tables first. - **Negative:** Idempotency and rare
**Headings:** ADR 0002: Dual persistence (ArchitectureRuns vs dbo.Runs); Context (historical); Decision (historical); Consequences (historical); Links

#### `architecture/adrs/0003-sql-rls-session-context.md`
**Scope:** **Scope:** ADR 0003: SQL RLS and SESSION_CONTEXT - full detail, tables, and links in the sections below.
**Title:** ADR 0003: SQL RLS and SESSION_CONTEXT
**Summary:** - **Status:** Accepted - **Date:** 2026-04-04 Multi-tenant data in SQL Server should be isolated even if application bugs omit scope predicates. Deploy RLS policies with **`SqlServer:RowLevelSecurity:ApplySessionContext=true`** in **Production** when `ArchLucid:StorageProvider=Sql`. The applicator sets `SESSION_CONTEXT` keys for tenant/workspace/project per connection. - **Positive:** Defense in depth aligned with enterprise expectations. - **Negative:** Connection setup overhead; misconfiguration fails startup validation by design. - `docs/security/MULTI_TENANT_RLS.md` (if present) or migration `036_RlsArchiforgeTenantScope.sql` (the policy / predicate / SESSION_CONTEXT key names defined in
**Headings:** ADR 0003: SQL RLS and SESSION_CONTEXT; Context; Decision; Consequences; Links

#### `architecture/adrs/0004-transactional-outbox-retrieval-indexing.md`
**Scope:** **Scope:** ADR 0004: Transactional outbox for retrieval indexing - full detail, tables, and links in the sections below.
**Title:** ADR 0004: Transactional outbox for retrieval indexing
**Summary:** - **Status:** Accepted - **Date:** 2026-04-04 Retrieval indexing must not commit “run succeeded” without a durable record of indexing work, or the system can lose index updates on crashes. Enqueue retrieval indexing work **inside the same SQL transaction** as authority commit where the storage provider supports it. - **Positive:** Atomic handoff from commit to indexer; aligns with outbox pattern. - **Negative:** In-memory test doubles use a separate code path; integration tests should exercise SQL. See ADR 0011 for storage-provider branching. - `docs/DATA_CONSISTENCY_MATRIX.md`
**Headings:** ADR 0004: Transactional outbox for retrieval indexing; Context; Decision; Consequences; Links

#### `architecture/adrs/0005-llm-completion-pipeline.md`
**Scope:** **Scope:** ADR 0005: LLM completion pipeline (cache, circuit breaker, quota, metrics) - full detail, tables, and links in the sections below.
**Title:** ADR 0005: LLM completion pipeline (cache, circuit breaker, quota, metrics)
**Summary:** - **Status:** Accepted - **Date:** 2026-04-04 Azure OpenAI calls need resilience (circuit breaker), cost control (cache, quota), and observability (tokens, traces). Pipeline order from the wire: **`CircuitBreaking( Caching( LlmCompletionAccounting( AzureOpenAi ) ) )`**. - **Accounting** (scoped): pre-check quota, post-record usage, emit OTel counters (optional per-tenant labels). - **Caching** sits inside the breaker so hits do not trip failure counting. - **Azure** client records usage into `AsyncLocal` consumed by accounting after each call. - **Positive:** Scoped `IAgentCompletionClient` works with singleton `IScopeContextProvider`; quota is tenant-aware on HTTP and ambient scope jobs. -
**Headings:** ADR 0005: LLM completion pipeline (cache, circuit breaker, quota, metrics); Context; Decision; Consequences; Links

#### `architecture/adrs/0006-url-path-api-versioning.md`
**Scope:** **Scope:** ADR 0006: URL-path API versioning (/v1) - full detail, tables, and links in the sections below.
**Title:** ADR 0006: URL-path API versioning (`/v1`)
**Summary:** - **Status:** Accepted - **Date:** 2026-04-04 Clients need a stable contract while allowing future breaking changes. Major version in the URL path: **`/v1/...`**, with Asp.Versioning reporting supported/deprecated headers where configured. - **Positive:** Obvious routing at edge (APIM, Front Door); easy Bruno/OpenAPI alignment. - **Negative:** Longer paths; v2 will duplicate surface until old versions sunset. - **Breaking change** (requires `/v2` or a negotiated version): removing or changing the JSON type of a required response field, changing HTTP method or path for the same logical operation, or changing semantics of a field in a way that breaks existing clients. - **Non-breaking:** addin
**Headings:** ADR 0006: URL-path API versioning (`/v1`); Context; Decision; Consequences; v2 introduction and deprecation (operational policy — 2026-04-15); Links

#### `architecture/adrs/0007-effective-governance-merge.md`
**Scope:** **Scope:** ADR 0007: Effective governance merge - full detail, tables, and links in the sections below.
**Title:** ADR 0007: Effective governance merge
**Summary:** - **Status:** Accepted (v1) - **Date:** 2026-04-04 Multiple **policy pack** assignments can apply to a tenant / workspace / project. Runtime features (alerts, compliance filtering, advisory defaults) need a **single merged** `PolicyPackContentDocument` plus optional explainability for operators. - **Resolution** is implemented by **`IEffectiveGovernanceResolver`** (assignments → versions → merge with deterministic precedence). **`IEffectiveGovernanceLoader`** exposes only **`EffectiveContent`** for call sites that do not need decisions/conflicts. - **Merge rules** for list fields (e.g. compliance / alert rule id lists) and dictionary fields (**`advisoryDefaults`**, **`metadata`**) are implem
**Headings:** ADR 0007: Effective governance merge; Context; Decision; Consequences; Links

#### `architecture/adrs/0008-alert-dedupe-scopes.md`
**Scope:** **Scope:** ADR 0008: Alert deduplication scopes - full detail, tables, and links in the sections below.
**Title:** ADR 0008: Alert deduplication scopes
**Summary:** - **Status:** Accepted (v1) - **Date:** 2026-04-04 Simple and composite alerts must avoid spamming operators when the same condition fires repeatedly across evaluations. Deduplication keys must be stable and scope-aware. - **Simple alerts** use **`IAlertRecordRepository.GetOpenByDeduplicationKeyAsync`** with keys produced by evaluation (`AlertRecord.DeduplicationKey`), scoped by tenant / workspace / project. - **Composite alerts** use **`IAlertSuppressionPolicy`** to decide **`ShouldCreateAlert`**, **`DeduplicationKey`**, and suppression reasons; composite rules carry **`DedupeScope`** (**`CompositeDedupeScope`**) influencing how keys are built (e.g. rule-only vs rule-and-run). - **Positive:
**Headings:** ADR 0008: Alert deduplication scopes; Context; Decision; Consequences

#### `architecture/adrs/0009-digest-delivery-failure-semantics.md`
**Scope:** **Scope:** ADR 0009: Digest delivery failure semantics - full detail, tables, and links in the sections below.
**Title:** ADR 0009: Digest delivery failure semantics
**Summary:** - **Status:** Accepted (v1) - **Date:** 2026-04-04 **`IDigestDeliveryDispatcher`** delivers architecture digests to multiple subscriptions and channels. Operators need durable attempt history and clear failure signals without failing the entire advisory scan. - Each subscription delivery creates a **`DigestDeliveryAttempt`** row (**`Started`** → **`Succeeded`** or **`Failed`**). - **Success** updates the subscription's **`LastDeliveredUtc`** and audits **`DigestDeliverySucceeded`**. - **Non-cancellation failures** set **`Failed`**, **`ErrorMessage`**, audit **`DigestDeliveryFailed`**, and increment OTel counter **`digest_delivery_failed`** with tag **`channel`** (same pattern for success cou
**Headings:** ADR 0009: Digest delivery failure semantics; Context; Decision; Consequences

#### `architecture/adrs/0010-dual-manifest-trace-repository-contracts.md`
**Scope:** **Scope:** ADR 0010: Dual manifest and decision-trace repository contracts - full detail, tables, and links in the sections below.
**Title:** ADR 0010: Dual manifest and decision-trace repository contracts
**Summary:** - **Status:** Superseded by [ADR 0030 — Coordinator → Authority pipeline unification](0030-coordinator-authority-pipeline-unification.md) *(2026-05-05, PR B)* — the Coordinator repository interface family is retired; manifests and traces converge on the **Authority** (`ArchLucid.Decisioning.Interfaces`) persistence path. - **Date:** 2026-04-04 ArchLucid persists golden manifests and decision traces in two different lifecycles: 1. **Run / commit pipeline (coordinator)** — manifests and traces are created and read with run-scoped APIs (`CreateAsync`, `GetByVersionAsync`, batch traces by run). These contracts live in **`ArchLucid.Persistence.Data.Repositories`** (`IGoldenManifestRepository`, `I
**Headings:** ADR 0010: Dual manifest and decision-trace repository contracts; Context; Decision; Consequences; Related

#### `architecture/adrs/0011-inmemory-vs-sql-storage-provider.md`
**Scope:** **Scope:** ADR 0011: ArchLucid:StorageProvider — InMemory vs Sql - full detail, tables, and links in the sections below.
**Title:** ADR 0011: `ArchLucid:StorageProvider` — InMemory vs Sql
**Summary:** - **Status:** Accepted - **Date:** 2026-04-04 ArchLucid must run in: - **Local / CI / demos** without Azure SQL or migration prerequisites. - **Production** with durable SQL, resilience, and optional RLS/session context. A single configuration switch avoids duplicating entire host graphs. Use **`ArchLucid:StorageProvider`** with supported values: - **`InMemory`** — singleton in-memory repositories for components bound to this option (see **`AddArchLucidStorage`**, **`RegisterCoordinatorDecisionEngineAndRepositories`**, **`RegisterComparisonReplayAndDrift`**, **`RegisterRunExportAndArchitectureAnalysis`**, **`RegisterGovernance`**). Suitable for development and automated tests; data is not du
**Headings:** ADR 0011: `ArchLucid:StorageProvider` — InMemory vs Sql; Context; Decision; Consequences; Related

#### `architecture/adrs/0012-runs-authority-convergence-write-freeze.md`
**Scope:** **Scope:** ADR 0012: Runs / authority convergence — legacy ArchitectureRuns removal - full detail, tables, and links in the sections below.
**Title:** ADR 0012: Runs / authority convergence — legacy `ArchitectureRuns` removal
**Summary:** - **Status:** Completed (2026-04-12) - **Date:** 2026-04-11 (accepted); **closure:** 2026-04-12 - **Extends / closes:** [0002-dual-persistence-architecture-runs-and-runs.md](0002-dual-persistence-architecture-runs-and-runs.md) (now **Superseded**) The product previously maintained **dual persistence**: authority **`dbo.Runs`** ( **`UNIQUEIDENTIFIER` `RunId`** ) and legacy **`dbo.ArchitectureRuns`** (string **`RunId`** ). Coordinator tables used string run ids; migration **047** dropped inbound FKs from those tables to **`ArchitectureRuns`** so **`dbo.Runs`** could become the sole header without a type-matched FK. 1. **Remove** **`IArchitectureRunRepository`**, **`ArchitectureRunRepository`**
**Headings:** ADR 0012: Runs / authority convergence — legacy `ArchitectureRuns` removal; Context; Decision (final); Inventory — historical write paths (all retired); Appendix: Foreign keys that referenced `dbo.ArchitectureRuns` (migration 047); Consequences; Links; Audit method (closure)

#### `architecture/adrs/0013-api-versioning-and-json-schema-versioning.md`
**Scope:** **Scope:** ADR 0013 — API versioning and JSON schemaVersion on persisted aggregates - full detail, tables, and links in the sections below.
**Title:** ADR 0013 — API versioning and JSON schemaVersion on persisted aggregates
**Summary:** **Status:** Accepted **Date:** 2026-04-14 ArchLucid ships a single URL namespace under `/v1/...` today. Operators and integrators need a forward path for breaking HTTP changes without silent client drift. Persisted JSON payloads (`GoldenManifest`, `GraphSnapshot`, findings) need an explicit **additive evolution** story. 1. **HTTP:** Use **Asp.Versioning.Mvc** with default **1.0**, URL segment `v{version:apiVersion}`, **`ReportApiVersions`**, and **`[ApiVersion("1.0")]`** on versioned controllers (see `ArchLucid.Api/Startup/MvcExtensions.cs`). **`VersionController`** remains **`[ApiVersionNeutral]`**. 2. **JSON:** Add **`schemaVersion`** (CLR: **`SchemaVersion`**, default **1**) on **`ArchLuc
**Headings:** ADR 0013 — API versioning and JSON schemaVersion on persisted aggregates; Context; Decision; Consequences; Alternatives considered

#### `architecture/adrs/0014-trial-enforcement-boundary.md`
**Scope:** **Scope:** ADR 0014 — Trial enforcement boundary (server-side, UoW run counter, idempotent seats) - full detail, tables, and links in the sections below.
**Title:** ADR 0014 — Trial enforcement boundary (server-side, UoW run counter, idempotent seats)
**Summary:** **Status:** Accepted **Date:** 2026-04-17 ArchLucid offers self-service trials with **run** and **seat** limits and a **time-boxed** expiry (`Tenants` trial columns, migration **072**). Enforcement must be: - **Server-authoritative** (UI is display-only). - **Consistent across entry points** (HTTP, future CLI/worker paths sharing persistence). - **Safe under concurrency** (no double-charged runs, no orphaned increments). 1. **Write gate:** Introduce **`TrialLimitGate`** in the Application layer (pure dependency on `ITenantRepository` + `TimeProvider`; no HTTP types). It throws **`TrialLimitExceededException`** with **`TrialLimitReason`** (`Expired`, `RunsExceeded`, `SeatsExceeded`). 2. **HTT
**Headings:** ADR 0014 — Trial enforcement boundary (server-side, UoW run counter, idempotent seats); Context; Decision; Alternatives considered; Consequences; References

#### `architecture/adrs/0015-trial-tier-authentication-model.md`
**Scope:** **Scope:** ADR 0015 — Trial-tier authentication model (External ID + local identity) - full detail, tables, and links in the sections below.
**Title:** ADR 0015 — Trial-tier authentication model (External ID + local identity)
**Summary:** **Status:** Accepted **Date:** 2026-04-17 Self-service trials must work when the customer has **not** completed workforce Entra federation. We still want **production-grade** controls: clear trust boundaries, JwtBearer alignment, and safe defaults. Introduce **`Auth:Trial:Modes`** with two optional lanes: 1. **`MsaExternalId`** — Microsoft Entra **External ID (CIAM)** for consumer IdPs (MSA, Google, hosted local accounts in CIAM). **Production** configuration validation **fails** if this mode is enabled without **`Auth:Trial:ExternalIdTenantId`**. 2. **`LocalIdentity`** — ArchLucid-hosted **email/password** in SQL (**`dbo.IdentityUsers`**, migration **077**) using **PBKDF2**, **lockout**, **
**Headings:** ADR 0015 — Trial-tier authentication model (External ID + local identity); Context; Decision; Alternatives considered; Consequences

#### `architecture/adrs/0016-billing-provider-abstraction.md`
**Scope:** **Scope:** ADR 0016 — Billing provider abstraction (Stripe + Azure Marketplace) - full detail, tables, and links in the sections below.
**Title:** ADR 0016 — Billing provider abstraction (Stripe + Azure Marketplace)
**Summary:** Accepted (2026-04-17) Trial conversion requires hosted checkout and asynchronous payment confirmation. Stripe and Azure Marketplace use different client credentials, webhook authentication models, and fulfillment APIs. - Introduce **`IBillingProvider`** + **`IBillingProviderRegistry`** (resolved from `Billing:Provider`). - Persist subscription state in **`dbo.BillingSubscriptions`** with **RLS** and **stored-procedure-only** mutations for the least-privilege SQL role. - Record webhook attempts in **`dbo.BillingWebhookEvents`** with **primary key idempotency** on provider event identifiers. - Keep **HTTP controllers** thin: Stripe and Marketplace webhook routes delegate to the respective prov
**Headings:** ADR 0016 — Billing provider abstraction (Stripe + Azure Marketplace); Status; Context; Decision; Consequences; Compliance / security notes

#### `architecture/adrs/0017-azure-app-configuration-deferred.md`
**Scope:** **Scope:** ADR 0017 — Azure App Configuration: deferred for v1 on cost grounds - full detail, tables, and links in the sections below.
**Title:** ADR 0017 — Azure App Configuration: deferred for v1 on cost grounds
**Summary:** **Status:** Accepted (deferred adoption) **Date:** 2026-04-18 ArchLucid centralizes runtime configuration through `IConfiguration` (`appsettings.{Env}.json` + environment variables + `dotnet user-secrets` for local) and feature flags through `Microsoft.FeatureManagement` (`FeatureManagementFeatureFlags`, `FeatureManagementAuthorityPipelineModeResolver`). Secrets are intended to live in **Azure Key Vault** (`appsettings.KeyVault.sample.json`, `docs/runbooks/SECRET_AND_CERT_ROTATION.md`). Live-reload of resilience knobs already uses `IOptionsMonitor<T>` (`CircuitBreakerGate`, `CircuitBreakerGateOptionsMonitorTests`). **Azure App Configuration** is a strong architectural fit for this stack: - N
**Headings:** ADR 0017 — Azure App Configuration: deferred for v1 on cost grounds; Context; Decision; Reasoning; Alternatives considered; Consequences; Revisit triggers; Compliance / security notes

#### `architecture/adrs/0018-background-workloads-container-apps-jobs.md`
**Scope:** **Scope:** ADR 0018 — Background workloads: Azure Container Apps Jobs (not Functions) - full detail, tables, and links in the sections below.
**Title:** ADR 0018 — Background workloads: Azure Container Apps Jobs (not Functions)
**Summary:** **Status:** Accepted (2026-04-19) ArchLucid runs long-lived background loops in `ArchLucid.Worker` via `IHostedService` implementations (advisory polling, archival, trial lifecycle, Cosmos change feed, Service Bus consumer, orphan probes, outbox drains). Operators want to: - Scale or schedule **batch-shaped** work independently from the HTTP API and the always-on worker. - Keep **private connectivity** to Azure SQL, Cosmos DB, Service Bus, and Key Vault (workspace default: private endpoints, no public SMB). **Azure Functions** with VNet integration requires **Premium**-class plans in typical enterprise networking postures, which is materially more expensive than reusing the existing **Contai
**Headings:** ADR 0018 — Background workloads: Azure Container Apps Jobs (not Functions); Context; Decision; Non-decisions / deferrals; Consequences; References

#### `architecture/adrs/0019-logic-apps-standard-edge-orchestration.md`
**Scope:** **Scope:** ADR 0019 — Azure Logic Apps (Standard) for edge orchestration - full detail, tables, and links in the sections below.
**Title:** ADR 0019 — Azure Logic Apps (Standard) for edge orchestration
**Summary:** Accepted (2026-04-19) ArchLucid already publishes domain integration events to Azure Service Bus (`IntegrationEventTypes`, transactional outbox per ADR 0004). Several workflows are **cross-system orchestration** with **human-in-the-loop** steps (governance approvals, incident ChatOps, marketplace fulfillment fan-out) where hand-rolled C# competes poorly with first-party connectors (Teams adaptive cards, Outlook approvals, ServiceNow/Jira). Azure **Functions** and **Container Apps Jobs** (ADR 0018) remain the default for compute-heavy or CLI-shaped batch work. Logic Apps fill a different niche: **visual run history**, **connector breadth**, and **retry policies** on outbound SaaS calls withou
**Headings:** ADR 0019 — Azure Logic Apps (Standard) for edge orchestration; Status; Context; Decision; Consequences; Compliance / security notes; Related

#### `architecture/adrs/0020-azure-primary-platform-permanent.md`
**Scope:** **Scope:** ADR 0020: Azure as the primary and permanent platform - full detail, tables, and links in the sections below.
**Title:** ADR 0020: Azure as the primary and permanent platform
**Summary:** **Status:** Accepted **Date:** 2026-04-20 **Context:** Product positioning, infrastructure, and buyer narrative. ArchLucid ships as a SaaS-oriented system with Azure-native building blocks (Entra ID, Azure SQL, Service Bus, storage, Container Apps, etc.). Some documentation historically used neutral “multi-cloud” phrasing to avoid locking narratives while capabilities were still stabilizing. **Azure is the primary, planned-permanent hosting and identity surface for ArchLucid.** Outward docs, Terraform, and operational runbooks should describe Azure-first deployment without implying equal first-class support for other public clouds unless a future ADR explicitly adds that scope. Portability a
**Headings:** ADR 0020: Azure as the primary and permanent platform; Context; Decision; Consequences; Compliance; Related

#### `architecture/adrs/0021-coordinator-pipeline-strangler-plan.md`
**Scope:** **Scope:** ADR 0021: Coordinator pipeline strangler plan - full detail, tables, and links in the sections below.
**Title:** ADR 0021: Coordinator pipeline strangler plan
**Summary:** - **Status:** Accepted - **Date:** 2026-04-20 - **Supersedes:** *(none yet — see § Decision)* - **Superseded by:** [ADR 0030 — Coordinator → Authority pipeline unification (sequenced multi-PR plan)](0030-coordinator-authority-pipeline-unification.md) *(2026-05-05 closure on PR B — strangler complete; ADR 0010 also superseded)* - **Amended by:** [ADR 0030 — Coordinator → Authority pipeline unification (sequenced multi-PR plan)](0030-coordinator-authority-pipeline-unification.md) — re-scopes § Phase 3 mechanism (a) from "single PR A deletion" into PR A0 → PR A4. > **Status note.** This ADR is **Accepted** as of **2026-04-20** (architecture review: product + platform leads — evidence: Phase 0 s
**Headings:** ADR 0021: Coordinator pipeline strangler plan; Context; Decision; Decision review gate; Phase 0 — Strangler hardening (no behaviour change); Phase 1 — Single read-side adapter (additive); Phase 1 internal read-path inventory (incremental, 2026-04-21); Phase 2 — Audit constant unification

#### `architecture/adrs/0022-coordinator-phase3-deferred.md`
**Scope:** **Scope:** ADR 0022 — Phase 3 coordinator retirement blocked pending exit gates (ADR 0021).
**Title:** ADR 0022: Coordinator interface family retirement — **blocked** (exit gates not met)
**Summary:** - **Status:** **Superseded by [ADR 0030 — Coordinator → Authority pipeline unification](0030-coordinator-authority-pipeline-unification.md) on 2026-04-24** (PR A3 merge — coordinator interface family deletion shipped, the per-sub-PR gate-evidence framing this ADR introduced is now history). The historical record below is preserved verbatim for context; do not merge new deletion PRs against this ADR. - **Date:** 2026-04-21 (superseded 2026-04-24) - **Supersedes:** *(none — this ADR does not retire ADR 0010 / 0021 until Phase 3 actually ships)* - **Superseded by:** [ADR 0030 — Coordinator → Authority pipeline unification](0030-coordinator-authority-pipeline-unification.md) (PR A3 deletion ship
**Headings:** ADR 0022: Coordinator interface family retirement — **blocked** (exit gates not met); Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `architecture/adrs/0024-azure-devops-pipeline-task-parity-with-github-action.md`
**Scope:** **Scope:** ADR — Azure DevOps pipeline YAML parity with GitHub Actions for manifest-delta PR surfaces.
**Title:** ADR 0024 — Azure DevOps pipeline task parity with GitHub Action (manifest delta)
**Summary:** **Status:** Accepted **Date:** 2026-04-21 Give **Azure DevOps Repos** pilots the **same buyer journey** GitHub pilots already have: paste a **single YAML snippet** into CI that fetches **`GET /v1/compare`** and surfaces the Markdown on either the **pipeline run summary** or a **sticky pull-request thread** plus an **informational PR status**, without requiring a Marketplace extension or the `az` CLI. - Buyer agents run **Node.js ≥ 20** (templates pin **22.x** via `NodeTool@0`). - Azure DevOps **Git REST 7.1** for PR threads and statuses remains stable for the contract shapes we serialize (`thread` create + `status` create + comment **PATCH**). - For **Mode A** (`System.AccessToken`), the **P
**Headings:** ADR 0024 — Azure DevOps pipeline task parity with GitHub Action (manifest delta); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture Overview; 5. Component Breakdown; 6. Data Flow; 7. Security Model

#### `architecture/adrs/0027-demo-preview-cached-anonymous-commit-page.md`
**Scope:** **Scope:** ADR — cached anonymous marketing `GET /v1/demo/preview` and `/demo/preview`; not operator auth design or SQL migrations.
**Title:** ADR 0027 — Cached anonymous marketing commit-page preview
**Summary:** Accepted (2026-04-21) Marketing needs a credible **“see a real commit page”** story. The operator shell already exposes a rich run detail page, but it requires an authenticated operator session. **`GET /v1/demo/explain`** proves explainability, yet it is a **different shape** than the commit page buyers expect (manifest summary, authority chain, artifacts, timeline). Ship **`GET /v1/demo/preview`** (anonymous, **`DemoEnabled`** feature gate, **`fixed`** rate limit) returning a **single bundled JSON** (`DemoCommitPagePreviewResponse`), plus a marketing **`/demo/preview`** page that renders that payload with **ISR** (`revalidate = 300`). Cache **three layers**: 1. **In-process** `IHotPathReadC
**Headings:** ADR 0027 — Cached anonymous marketing commit-page preview; Status; Context; Decision; Alternatives considered; Consequences; Implementation pointers

#### `architecture/adrs/0028-coordinator-strangler-completion.md`
**Scope:** **Scope:** Architecture team — captures the original scaffold for completing the coordinator → authority strangler. **Superseded by ADR 0029**; preserved for audit history. Not a current execution plan — read ADR 0029 for the live plan.
**Title:** ADR 0028 — Coordinator strangler completion (scaffold)
**Summary:** > > **Status:** Superseded by [ADR 0029](0029-coordinator-strangler-acceleration-2026-05-15.md) (2026-04-21) > **Supersedes / relates:** [0021-coordinator-pipeline-strangler-plan.md](0021-coordinator-pipeline-strangler-plan.md) > **Superseded 2026-04-21.** The `_TODO (owner)_` placeholders in this scaffold (calendar date for Phase 3 completion + ADR 0022 state transition) were resolved by owner Q&A on 2026-04-21 and are now recorded in **[ADR 0029 — Coordinator strangler acceleration to 2026-05-15](0029-coordinator-strangler-acceleration-2026-05-15.md)**. Read ADR 0029 for the calendar date, the post-PR-A 30-day-soak-gate waiver rationale (pre-release context), the atomic surface area for th
**Headings:** ADR 0028 — Coordinator strangler completion (scaffold); Objective; Assumptions; Constraints; Decision; Consequences; Exit gates; Completion date

#### `architecture/adrs/0029-coordinator-strangler-acceleration-2026-05-15.md`
**Scope:** **Scope:** ADR 0029 — Coordinator strangler acceleration to 2026-05-15 (Phase 3 cut-over) - full detail, tables, and links in the sections below.
**Title:** ADR 0029: Coordinator strangler acceleration — Phase 3 cut-over to **2026-05-15**
**Summary:** - **Status:** Accepted - **Date:** 2026-04-21 (§ Lifecycle amended 2026-04-22 — **PR B — audit-constant retirement checklist** + tracker mirror per `PENDING_QUESTIONS.md` item **35e**) - **Supersedes:** [ADR 0028 (Draft) — Coordinator strangler completion (scaffold)](0028-coordinator-strangler-completion.md) (the calendar-date and exit-gate `_TODO (owner)_` placeholders in 0028 are answered by this ADR) - **Superseded by:** *(none yet — see § Lifecycle below)* - **Amends:** [ADR 0021 — Coordinator pipeline strangler plan](0021-coordinator-pipeline-strangler-plan.md) (cut-over date and Phase 3 30-day exit-gate waiver) - **Amended by:** [ADR 0030 — Coordinator → Authority pipeline unification
**Headings:** ADR 0029: Coordinator strangler acceleration — Phase 3 cut-over to **2026-05-15**; Objective; Assumptions; Constraints; Architecture overview; Component breakdown — atomic surface area; Data flow; Security model

#### `architecture/adrs/0030-coordinator-authority-pipeline-unification.md`
**Scope:** **Scope:** ADR 0030 — Coordinator → Authority pipeline unification, sequenced over multiple PRs. Replaces the optimistic single-PR-A framing in [ADR 0021](0021-coordinator-pipeline-strangler-plan.md) § Phase 3 mechanism (a) once the dual-data-model and dual-SQL-table reality is acknowledged.
**Title:** ADR 0030: Coordinator → Authority pipeline unification — sequenced multi-PR plan
**Summary:** - **Status:** Accepted - **Date:** 2026-04-21 (amended 2026-04-22 — owner Q&A on `PENDING_QUESTIONS.md` items **35a** + **35b** + **35d**; see § Owner sub-decisions, **PR A0.5** in § Component breakdown, and **PR A4** hard-drop update per item **35d**) (amended 2026-04-24 — **PR A3 shipped**: coordinator interfaces + concretes deleted, legacy commit orchestrator deleted, `TopologySection.Relationships` added so the Authority FK chain round-trips contract relationships, `Demo:SeedDepth = quickstart | vertical` integration test landed, OpenAPI snapshot regenerated; ADR 0022 superseded by this ADR) (amended 2026-04-29 — **PR A4 shipped**: migration **`111_DropGoldenManifestVersions_Legacy.sql`*
**Headings:** ADR 0030: Coordinator → Authority pipeline unification — sequenced multi-PR plan; Objective; Assumptions; Constraints; Architecture overview; Component breakdown — the four sub-PRs; Data flow; Security model

#### `architecture/adrs/0031-cross-tenant-pattern-library.md`
**Scope:** **Scope:** ADR 0031 — Cross-tenant pattern library (anonymised industry guidance) - full detail, tables, and links in the sections below.
**Title:** ADR 0031: Cross-tenant pattern library (anonymised vertical guidance)
**Summary:** - **Status:** Accepted (owner sign-off **2026-05-03** — implementation PRs may merge when they conform to this ADR) - **Date:** 2026-04-22 - **Supersedes:** *(none)* - **Superseded by:** *(none)* - **Amends:** *(none)* - **Amended by:** *(none yet)* ArchLucid operators already receive **tenant-private** architecture intelligence from their own committed manifests, runs, and governance outputs under **strict row-level security (RLS)** and RBAC. Product strategy (see [`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) **Resolved 2026-04-21** table — row *Cross-tenant pattern library*, and **item 14** follow-ups) calls for an **optional** capability: show **patterns other tenants in the same
**Headings:** ADR 0031: Cross-tenant pattern library (anonymised vertical guidance); Context; Objective; Assumptions; Constraints; Architecture Overview; Component Breakdown; Data Flow

#### `architecture/adrs/0032-scim-v2-service-provider.md`
**Scope:** **Scope:** ADR 0032 — SCIM 2.0 inbound service provider — full detail in the sections below.
**Title:** ADR 0032: SCIM 2.0 inbound service provider (RFC 7644)
**Summary:** > - **Status:** Accepted (implementation shipped in repo) - **Date:** 2026-04-24 - **Supersedes:** *(none)* - **Superseded by:** *(none)* Enterprise customers expect **automated user lifecycle** from their IdP (Microsoft Entra ID, Okta, OneLogin). SCIM 2.0 is the standard contract for **inbound** provisioning into SaaS tenants. Without it, procurement and IT security reviews stall. ArchLucid implements a **SCIM 2.0 Service Provider** surface under dedicated routes (`/scim/v2/...`), authenticated only via a custom **`ScimBearer`** scheme backed by **per-tenant bearer tokens** (hashed at rest with **Argon2id**, salt derived from `tenantId`). **JWT and API-key sessions never satisfy SCIM routes
**Headings:** ADR 0032: SCIM 2.0 inbound service provider (RFC 7644); Context; Decision; Consequences; Alternatives considered

#### `architecture/adrs/0033-first-real-value-single-env-var-flip.md`
**Scope:** **Scope:** Maintainers recording why local `archlucid try --real` is opt-in, key-preflighted, and fallible-to-simulator; not hosted SaaS try-real, managed identity for the dev loop, or non-CLI execution paths.
**Title:** ADR 0033 — First real value: single env-var flip for `archlucid try --real`
**Summary:** Accepted (2026-04-24) The **`archlucid try`** path gives a committed manifest and sponsor-grade Markdown in about a minute using the **simulator**. Buyers still could not **self-prove** value against **their own** Azure OpenAI (AOAI) deployment without operator assistance. Ship **`archlucid try --real`** as an **opt-in** local path: 1. **Gate:** `ARCHLUCID_REAL_AOAI=1` must be set in the shell alongside `--real`. This is the feature switch (no separate `Demo:Enabled`-style flag for this path). 2. **Preflight:** the CLI validates **`AZURE_OPENAI_ENDPOINT`**, **`AZURE_OPENAI_API_KEY`**, and **`AZURE_OPENAI_DEPLOYMENT_NAME`** before applying the compose overlay. 3. **Compose:** additive overlay
**Headings:** ADR 0033 — First real value: single env-var flip for `archlucid try --real`; Status; Context; Decision; Alternatives considered; Consequences; References

#### `architecture/adrs/0034-segregation-of-duties-entra-oid-actor-keys.md`
**Scope:** **Scope:** Why governance SoD uses Entra JWT `tid`/`oid`-derived canonical keys plus additive DB columns—**not** display names alone—not API-key ergonomics redesign.
**Title:** ADR 0034 — Segregation of duties: Entra `oid`-normalized actor keys
**Summary:** Accepted (2026-04-29) `IActorContext.GetActor()` surfaced the mutable **display** identity (`ClaimTypes.Name`, short JWT `name`, etc.). A principal could authenticate as two different **display** strings while still representing the **same** Entra object (interactive user vs delegated service principal semantics in CI/SP flows), defeating ordinal compare on display strings (`GovernanceSegregationRules` / `GovernanceWorkflowService`). Separately, **`http://schemas.microsoft.com/identity/claims/objectidentifier` (oid)** together with **`tid`** (tenant) is stable enough for JWT/OIDC segregation keys within one tenant boundary. 1. **`IActorContext.GetActorId()`** returns **`jwt:{tid}:{oid}`** (`
**Headings:** ADR 0034 — Segregation of duties: Entra `oid`-normalized actor keys; Status; Context; Decision; Alternatives considered; Consequences; References

#### `architecture/adrs/0035-architecture-invariant-catalog.md`
**Scope:** **Scope:** ADR 0035 — Architecture invariant catalog and enforcement program — full detail, tables, and links in the sections below.
**Title:** ADR 0035: Architecture invariant catalog and enforcement program
**Summary:** - **Status:** Proposed *(owner accepts by moving Status to Accepted; enforcement waves may merge before acceptance when each wave is independently safe)* - **Date:** 2026-05-09 - **Supersedes:** *(none)* - **Superseded by:** *(none)* - **Amends:** *(none)* The codebase is large (↑30 assemblies), heavily instrumented for agents and connectors, and multi-tenant. Several cross-cutting guards (startup validation, RLS session context per [ADR 0003](0003-sql-rls-session-context.md), LLM pipelines per [ADR 0005](0005-llm-completion-pipeline.md)) exist, but **desired invariants today mix convention, tests, and documentation** rather than repeatable CI gates. External reviews repeatedly surface the s
**Headings:** ADR 0035: Architecture invariant catalog and enforcement program; Context; Decision; Consequences; Execution mode aggregation *(normative sketch for INV-002)*; Links

#### `architecture/adrs/README.md`
**Scope:** **Scope:** Architecture Decision Records (ADR) - full detail, tables, and links in the sections below.
**Title:** Architecture Decision Records (ADR)
**Summary:** **Last reviewed:** 2026-04-29 Short, durable decisions for ArchLucid. Each file is **immutable** once accepted; supersede with a new ADR rather than rewriting history. | ADR | Title | |-----|--------| | [0001](0001-hosting-roles-api-worker-combined.md) | Hosting roles: Api, Worker, Combined | | [0002](0002-dual-persistence-architecture-runs-and-runs.md) | Dual persistence (historical — **Superseded** by 0012) | | [0003](0003-sql-rls-session-context.md) | SQL RLS and SESSION_CONTEXT | | [0004](0004-transactional-outbox-retrieval-indexing.md) | Transactional outbox for retrieval indexing | | [0005](0005-llm-completion-pipeline.md) | LLM completion pipeline, cache, quota, metrics | | [0006](000
**Headings:** Architecture Decision Records (ADR)

#### `architecture/adrs/adr-template-full.md`
**Scope:** **Scope:** Long-form ADR skeleton for contributors — optional tables and extra sections; same three mandated headings as [template.md](template.md); meta-doc, not an ADR.
**Title:** ADR template — full skeleton (mandatory reasoning sections)
**Summary:** **How to use:** Copy into `docs/architecture/adrs/NNNN-short-slug-kebab-case.md` per [README.md](README.md). Replace every `⌈placeholder⌉`. Remove optional blocks only when they truly do not apply—**never** remove the three mandated sections below. **Immutability:** Once **Accepted**, do not rewrite; supersede with another ADR. **Merge-blocking rules (exact wording):** [template.md](template.md). The following **MUST** appear as top-level `##` headings (exact titles) with substantive prose—not empty, not placeholder-only, not a single vague sentence. 1. **`## Trade-offs`** — You **MUST** name what you are trading away for this decision (performance, cost, flexibility, operational load, secur
**Headings:** ADR template — full skeleton (mandatory reasoning sections); Enforcement rules (MUST); Paste below into your new ADR file; ADR ⌈NNNN⌉: ⌈Full title⌉; Context; Decision; Trade-offs; Constraints

#### `architecture/adrs/template.md`
**Scope:** **Scope:** ADR template enforcement — `Trade-offs`, `Constraints`, and `Expected impact` are merge-blocking for new numbered ADRs; meta-doc, not an ADR.
**Title:** ADR template — strict sections (canonical)
**Summary:** **Use:** Copy the block below into `docs/architecture/adrs/NNNN-short-slug-kebab-case.md` per [README.md](README.md). Replace every `⌈placeholder⌉`. **Immutability:** Once **Accepted**, do not rewrite; supersede with another ADR. **Longer skeleton** (optional blocks, tables, links): [adr-template-full.md](adr-template-full.md). These rules are **merge-blocking** unless an exception is recorded in the PR and in the ADR **Context**: 1. The ADR **must** contain three top-level Markdown headings with **exact** titles (case and wording as shown): `## Trade-offs`, `## Constraints`, `## Expected impact`. 2. Each of those sections **must** hold **substantive prose**: multiple sentences that a review
**Headings:** ADR template — strict sections (canonical); Enforcement rules (organizational MUST); Paste into your new ADR file; ADR ⌈NNNN⌉: ⌈Full title⌉; Context; Decision; Trade-offs; Constraints

#### `architecture/api/API_REDESIGN_CRITIQUE.md`
**Scope:** **Scope:** Engineering critique of the public REST surface for API and SDK owners; not the canonical route catalog or a compliance attestation.
**Title:** ArchLucid API Surface — Defect Catalogue
**Summary:** This document captures the nine defect dimensions identified during the REST API review (see implementation workstream `docs/architecture/api/API_V2_ROUTES.md` for the target surface). Pipeline-internal verbs and constructs exposed on public routes dilute the product narrative and complicate SDK contracts: - Execute / replay / determinism-check / seed-fake-results expose orchestration mechanics. - Agent evaluation, evidence packages, and execution traces expose LLM/agent internals. - “Pipeline” terminology appears where operators expect lifecycle language (“review trail”). - Duplicate replay surfaces (`architecture/run/.../replay` vs `authority/replay`) multiply confusion. - Creating a **Run
**Headings:** ArchLucid API Surface — Defect Catalogue; 1. Implementation Details Leak; 2. Resource Name Confusion; 3. Missing Authorization Checks; 4. Missing Idempotency; 5. Bad HTTP Verbs; 6. Bad Response Shapes; 7. Missing Pagination and Filtering

#### `architecture/api/API_V2_ROUTES.md`
**Scope:** **Scope:** Canonical product-facing HTTP paths under v1 for implementers and client authors; not auth configuration, OpenAPI bundles, or non-HTTP contracts.
**Title:** ArchLucid Product REST API — Canonical Routes
**Summary:** Version prefix: **`v1`** (Asp.Versioning `1.0`). New product-facing routes live **alongside** legacy `v1/architecture/…` paths until clients migrate. | Concept | Meaning | |--------|---------| | **Request** | Operator intent to assess an architecture (created with the run). | | **Run** | Execution instance for that assessment. | | **Manifest** | Finalized golden manifest for the run. | | **Finding** | Structured issue/recommendation emitted from analysis. | | **Artifact** | Synthesized downloadable output tied to the manifest. | | **Review trail** | Audit timeline + rationale + provenance for explainability. | | Method | Path | Notes | |--------|------|--------| | `POST` | `/v1/requests` | S
**Headings:** ArchLucid Product REST API — Canonical Routes; Resource Taxonomy; Canonical Routes; Architecture requests; Runs; Manifest; Findings; Artifacts

#### `architecture/api/REST_API_REDESIGN_IMPLEMENTATION_NOTES.md`
**Scope:** **Scope:** What shipped in code for the REST redesign versus legacy route aliases; not a full API reference, changelog, or deprecation calendar.
**Title:** REST API redesign — implementation notes (2026-04)
**Summary:** This complements [`API_V2_ROUTES.md`](API_V2_ROUTES.md) and [`API_REDESIGN_CRITIQUE.md`](API_REDESIGN_CRITIQUE.md). It records **what shipped in code** versus **still duplicated for backward compatibility**. Ship the redesign incrementally: **canonical routes** plus **legacy aliases** so existing clients keep working while SDKs move to the cleaner paths. - **Paged lists**: `GET /v1/runs` and `GET /v1/authority/projects/{projectId}/runs` return `PagedResponse<T>` (no dual JSON shapes). - **Aliases**: `POST …/submit` beside `…/execute`; `POST …/manifest/finalize` beside `…/commit`. - **`RunSubmitted`** audit on successful submit (not pilot-only). - **`InvalidOperationException`** on finalize m
**Headings:** REST API redesign — implementation notes (2026-04); Objective; What shipped; Runs & manifest; Review trail & manifest reads (`AuthorityQueryController`); Internal / operator diagnostics; Artifacts; Governance

### `artifacts`

#### `artifacts/phase3/gate-verification.md`
**Scope:** **Scope:** Redirect — receipt moved to archive.
**Title:** Gate Verification
**Summary:** Archived copy: [gate-verification.md](../../archive/artifacts-phase3-2026-04-23/gate-verification.md).

#### `artifacts/phase3/pr-a2-cohort-parity.md`
**Scope:** **Scope:** Redirect — receipt moved to archive.
**Title:** Pr A2 Cohort Parity
**Summary:** Archived copy: [pr-a2-cohort-parity.md](../../archive/artifacts-phase3-2026-04-23/pr-a2-cohort-parity.md).

### `assessments`

#### `assessments/LATEST.md`
**Scope:** **Scope:** Internal weighted readiness assessment for repo stewards — V1 scoring boundary and backlog prompts; not a customer-facing datasheet nor an exhaustive audit substitute.
**Title:** ArchLucid Assessment – Weighted Readiness 88.88%
**Summary:** **Canonical pair:** This file is the **single current score and backlog** for weighted readiness. Read **`docs/library/ASSESSMENT_INPUTS.md`** first for the evidence contract; treat **`docs/archive/assessments/`** and archived quality narratives as **history only** — see **“One workflow (current score vs history)”** there. **V1 scoring boundary:** - **Native SAML 2.0 Service Provider (workforce SSO):** **Shipped for V1 GA** (**`docs/library/V1_SCOPE.md` §2.12**). **`JwtBearer`** OIDC remains **first-class**; SAML **SP** augments buyer choice. - **ServiceNow bi-directional status sync:** **`V1` GA** per **`docs/library/V1_SCOPE.md` §2.13** — unchanged. As of **2026-05-15**: **no** ServiceNow
**Headings:** ArchLucid Assessment – Weighted Readiness 88.88%; Executive Summary; Weighted Quality Assessment; 1. Adoption Friction; 2. AI/Agent Readiness; 3. Correctness; 4. Proof-of-ROI Readiness; 5. Usability

### `brand`

#### `brand/BRAND_SYSTEM.md`
**Scope:** **Scope:** ArchLucid brand system — colors, typography, layout, components, content language, and logo direction. Derived from the shipped V1 operator shell and marketing surfaces (April 2026).
**Title:** ArchLucid brand system
**Summary:** **Audience:** Designers, front-end engineers, and marketing contributors who need to create or extend ArchLucid surfaces with visual consistency. **Grounding rule:** Every token, pattern, and guideline in this document describes what is **already shipped** in the `archlucid-ui` codebase. Aspirational changes are marked explicitly in "Next" callouts. If the UI diverges from this document, update the document — not the other way around — unless a deliberate brand evolution has been approved. **Tech stack:** Next.js App Router, Tailwind CSS (class strategy, no CSS variables), shadcn/ui (new-york style, `neutral` base color), `lucide-react` icons. Dark mode via `class="dark"` on `<html>`, persis
**Headings:** ArchLucid brand system; 1. Brand core; Positioning; Tagline; Brand personality; 2. Color system; Primary brand color; Shell / chrome (neutral palette)

### `compliance`

#### `compliance/CAIQ_LITE.md`
**Scope:** **Scope:** Consensus Assessments Initiative Questionnaire (CAIQ) Lite for ArchLucid.
**Title:** CAIQ Lite - ArchLucid
**Summary:** This document answers standard enterprise security questions based on the ArchLucid architecture. **1. Does the system provide tenant isolation?** Yes. ArchLucid supports multi-tenancy at the data layer using row-level security (RLS) and tenant-specific identifiers in all core tables. **2. How is data backed up?** Data is stored in SQL Server. Customers are responsible for configuring SQL Server backups (e.g., Azure SQL Database automated backups) according to their RPO and RTO requirements. **3. How are API keys managed?** API keys are configured via the `Authentication:ApiKey` section in `appsettings.json` or environment variables. They are not stored in plaintext in the database. The syst
**Headings:** CAIQ Lite - ArchLucid

#### `compliance/SECURITY_WHITE_PAPER.md`
**Scope:** **Scope:** ArchLucid Security White Paper detailing data at rest/transit, RBAC, and the honest boundary architecture.
**Title:** ArchLucid Security White Paper
**Summary:** ArchLucid is an AI-assisted architecture workflow system designed to translate architecture requests into committed manifests and reviewable artifacts. Security is a foundational pillar, ensuring that all data, models, and governance evidence are protected and auditable. All communication between the operator (browser), CI/CD automation, and the ArchLucid API is encrypted using TLS 1.2 or higher over HTTPS. Internal communication between the API and SQL Server uses TDS with `TrustServerCertificate=True` in development, but requires strict certificate validation in production. All persistence is handled by SQL Server. In production, Transparent Data Encryption (TDE) is recommended to protect
**Headings:** ArchLucid Security White Paper; 1. Introduction; 2. Data Protection; 2.1 Data in Transit; 2.2 Data at Rest; 3. Authentication and Authorization (RBAC); 4. The Honest Boundary Architecture; 5. Network Security

### `data-consistency`

#### `data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md`
**Scope:** **Scope:** Data consistency enforcement (orphan probes) - full detail, tables, and links in the sections below.
**Title:** Data consistency enforcement (orphan probes)
**Summary:** Gradually escalate responses when coordinator rows reference **missing** `dbo.Runs` rows (orphans), without silently hiding drift in production. - **SQL** is the authority store (`ArchLucid:StorageProvider=Sql`). - Probes run only when **`DataConsistency:OrphanProbeEnabled`** is **true** (default). - **Operator readiness report (repo + optional read-only SQL):** `python scripts/data_consistency_mode_readiness_report.py` — merges default API appsettings (including **Advanced** overlay), summarizes **Enforcement** posture and quarantine DDL/migrations, and optionally runs the same detection-only orphan **COUNT** queries when **`ARCHLUCID_DATA_CONSISTENCY_READINESS_SQL`** or **`--sql-odbc`** is
**Headings:** Data consistency enforcement (orphan probes); Objective; Assumptions; Constraints; Prevention vs detection (SQL authority chain); Architecture overview; Component breakdown; Data flow

### `demo`

#### `demo/DEMO_RECORDING_STORYBOARD.md`
**Scope:** **Scope:** Buyer-safe **demo recording** script (≈3 minutes) with explicit UI targets.
**Title:** Demo recording storyboard
**Summary:** **Audience:** Marketing, solutions engineers, and founders capturing a **polished** operator UI walkthrough. **Last reviewed:** 2026-05-10 1. Use a **staging** workspace with **[Simulator](../library/V1_SCOPE.md)** mode or curated fixtures — never live production secrets in the recording. 2. Set **`NEXT_PUBLIC_*` demo flags** per **[DEMO_QUICKSTART.md](../go-to-market/DEMO_QUICKSTART.md)** and confirm **[operator-shell.md](operator-shell.md)** progressive disclosure matches the narrative (Pilot vs Operate). 3. Run **`scripts/demo-setup.ps1`** locally to validate API reachability, version endpoint, and optional SQL smoke prerequisites (see script header). | Time | Voiceover (suggested) | On-s
**Headings:** Demo recording storyboard; Before capture; Timeline (~3:00); Capture tips; Related

#### `demo/README.md`
**Scope:** **Scope:** Contributors and GTM aligning on offline demo exports and sanitized sample artifacts; not hosted SaaS buyer documentation or live tenant procedures.
**Title:** Product demo pack
**Summary:** Contributor-facing **offline** materials live under **`docs/demo/sample-pack/`** (manifest fragments, a sample finding, timeline skeleton). **Hosted SaaS buyers** do not use this path — it exists so GTM and engineering can share **sanitized** JSON shapes without copying from production tenants. - **CLI:** `archlucid demo export [--out <dir>]` copies the sample pack next to your working tree (default `./archlucid-demo-pack`). - **GitHub Actions:** See **[`docs/integrations/GITHUB_PR_MANIFEST_DELTA.md`](../integrations/GITHUB_PR_MANIFEST_DELTA.md)** for the composite action that diffs two manifest exports.
**Headings:** Product demo pack

#### `demo/sample-pack/README.md`
**Scope:** **Scope:** Engineering and CI consumers of non-proprietary JSON fragments for demos, slides, and manifest-delta fixtures; not production exports or authoritative API contracts.
**Title:** Demo sample pack (offline)
**Summary:** Non-proprietary JSON fragments for **slides, PLG onboarding copy, and CI examples**. - **`manifest-snippet.json`** / **`manifest-snippet-head.json`** — paired files for `scripts/integrations/github_pr_manifest_delta.py` and `.github/workflows/example-github-manifest-delta.yml`. - **`finding-example.json`** — finding-shaped object matching list/inspect field names used in operator UI. - **`trace-event-skeleton.json`** — illustrates pipeline timeline rows (see live **`GET /v1/authority/runs/{runId}/pipeline-timeline`** for authoritative data). From the repository root (after a local build):
**Headings:** Demo sample pack (offline); CLI export

### `deployment`

#### `deployment/PER_TENANT_COST_MODEL.md`
**Scope:** **Scope:** Per-tenant cost model (sketch) - full detail, tables, and links in the sections below.
**Title:** Per-tenant cost model (sketch)
**Summary:** Give sponsors a **defensible order-of-magnitude** for monthly Azure + LLM spend for ArchLucid **without** turning the pilot into a FinOps science project. - **Azure list** public pricing (enterprise discounts apply separately). - **LLM** is **metered** via `archlucid_llm_prompt_tokens_total` / `archlucid_llm_completion_tokens_total` and optional **`archlucid_llm_cost_usd_total`** when `AgentExecution:LlmCostEstimation:Enabled` is **true** ([../CAPACITY_AND_COST_PLAYBOOK.md](../library/CAPACITY_AND_COST_PLAYBOOK.md)). - **Not** a billing entitlement model — **no** silent SKU coupling to product packaging. - Cardinality: avoid unbounded **per-tenant** metric labels in Prometheus except bounded
**Headings:** Per-tenant cost model (sketch); Objective; Assumptions; Constraints; Architecture overview; Component breakdown (line items); Data flow; Security model

#### `deployment/PILOT_PROFILE.md`
**Scope:** **Scope:** Pilot Terraform profile (cost-aware) - full detail, tables, and links in the sections below.
**Title:** Pilot Terraform profile (cost-aware)
**Summary:** > **Install order moved.** See [../INSTALL_ORDER.md](../INSTALL_ORDER.md) for laptop + Azure pilot toolchains; this page covers cost posture only (week-one tasks after install). Run a **short-lived** ArchLucid environment (single region, reduced HA) to prove **Core Pilot** value without paying the full **production** multi-stack bill ([REFERENCE_SAAS_STACK_ORDER.md](../library/REFERENCE_SAAS_STACK_ORDER.md)). - **≤ 30-day** pilot window, **one tenant** (or two for A/B), **non-production** data classification. - Team accepts **weaker RTO/RPO** than [../RTO_RPO_TARGETS.md](../library/RTO_RPO_TARGETS.md) production tiers. - **Identity:** Entra ID (External ID or corporate tenant) — no anonymous
**Headings:** Pilot Terraform profile (cost-aware); Objective; Assumptions; Constraints; Architecture overview; Component breakdown (pilot vs production); Data flow; Security model

#### `deployment/STAGING_DEPLOYMENT_CHECKLIST.md`
**Scope:** **Scope:** Operators verifying hosted SaaS staging (Terraform apply order, trial funnel, health probes) using repo-defined stacks — not designing net-new infrastructure.
**Title:** Staging deployment checklist (`staging.archlucid.net`)
**Summary:** **Purpose:** Prerequisite and verification list for bringing the **hosted SaaS trial funnel** online on **staging** using **existing** Terraform and CI — **no new resources** in this document; operators apply or configure what is already defined in the repo. Covers signup, tenant provisioning, first-value experience, and health probes. Aligned with [TRIAL_AND_SIGNUP.md](../go-to-market/TRIAL_AND_SIGNUP.md), [REFERENCE_SAAS_STACK_ORDER.md](../library/REFERENCE_SAAS_STACK_ORDER.md), and [BUYER_FIRST_30_MINUTES.md](../BUYER_FIRST_30_MINUTES.md). **Last updated:** 2026-04-25 Apply nested stacks in the order documented in [REFERENCE_SAAS_STACK_ORDER.md](../library/REFERENCE_SAAS_STACK_ORDER.md) (
**Headings:** Staging deployment checklist (`staging.archlucid.net`); 1. Default apply order (Terraform); 2. GitHub: merge-to-staging CD (optional automation); 3. Container Apps images (Terraform vs CD); 4. Azure Front Door and `staging.archlucid.net`; 5. SQL, Key Vault, Entra, Service Bus; 6. Demo seed and trial sample data (important); 7. Repository variable: `ARCHLUCID_STAGING_BASE_URL` (hosted probes)

#### `deployment/STAGING_GITHUB_ENVIRONMENT_SETUP.md`
**Scope:** **Scope:** GitHub repository settings required for staging CD and hosted probes — no secret values; key names and descriptions only.
**Title:** Staging GitHub environment setup
**Summary:** **Purpose:** Document the GitHub repository settings (environment secrets, repository variables) required to deploy ArchLucid to `staging.archlucid.net` via the CD pipeline and enable hosted probes. **Last updated:** 2026-04-26 **Cross-references:** - [AZURE_SUBSCRIPTIONS.md](../library/AZURE_SUBSCRIPTIONS.md) — canonical subscription map - [DEPLOYMENT_CD_PIPELINE.md](../library/DEPLOYMENT_CD_PIPELINE.md) — CD workflow secrets and smoke behavior - [STAGING_DEPLOYMENT_CHECKLIST.md](STAGING_DEPLOYMENT_CHECKLIST.md) — full deployment checklist - [REFERENCE_SAAS_STACK_ORDER.md](../library/REFERENCE_SAAS_STACK_ORDER.md) — Terraform apply order Create the environment at **Settings → Environments →
**Headings:** Staging GitHub environment setup; 1. GitHub environment: `staging`; 1.1 Environment secrets; 1.2 Optional environment secrets; 1.3 Environment protection rules (recommended); 2. Repository variables; 3. Verification; List environment secrets (names only, not values)

#### `deployment/STAGING_PRE_DEPLOY_VERIFICATION.md`
**Scope:** **Scope:** Pre-deployment verification checklist for `staging.archlucid.net` — confirms all prerequisites before running `terraform apply` or CD pipeline.
**Title:** Staging pre-deploy verification (`staging.archlucid.net`)
**Summary:** **Purpose:** Confirm all prerequisites are in place before deploying the ArchLucid SaaS trial funnel to staging. Use this checklist before running `terraform apply` or triggering the CD pipeline. **Last updated:** 2026-04-26 | Check | Command | Expected result | |-------|---------|-----------------| | No `archlucid.com` in non-archive source | `rg "archlucid\.com" --glob "*.{cs,ts,tsx,json,yml,yaml,ps1}" --glob "!**/archive/**" -l` | Only CloudEvents files (`com.archlucid.*` URIs) | | No `archlucid.com` in active docs | `rg "archlucid\.com" docs/ --glob "!docs/archive/**" -l` | Only files containing `com.archlucid.*` CloudEvents URIs | | `appsettings.json` BaseUrl | Inspect `ArchLucid.Api/ap
**Headings:** Staging pre-deploy verification (`staging.archlucid.net`); 1. Domain alignment verification; 2. Azure resource prerequisites; 3. Terraform validation; Validate all roots; From infra/terraform-pilot (single entry point); 4. GitHub environment configuration; 5. CORS configuration

#### `deployment/STAGING_TRIAL_FUNNEL_STATUS.md`
**Scope:** **Scope:** For operators and doc maintainers: snapshot of staging trial funnel HTTP reachability from a dev network; not a live monitoring dashboard or runbook substitute.
**Title:** Staging trial funnel — reachability status
**Summary:** **Recorded (UTC):** 2026-04-28 **Method:** `Invoke-WebRequest` from the development environment (no infrastructure changes). | URL | Result | Notes | |-----|--------|--------| | `GET https://staging.archlucid.net/health/live` | **Not reachable** | DNS resolution failed: host name could not be resolved from this network. | | `GET https://staging.archlucid.net/health/ready` | **Not reachable** | Same as above. | | `GET https://staging.archlucid.net/pricing` | **Not reachable** | Same as above. | Not evaluated: the marketing/pricing pages could not be loaded because the hostname did not resolve locally. When DNS and Front Door routes are available from your network, repeat the checks in [`docs/
**Headings:** Staging trial funnel — reachability status; HTTP endpoints; Stripe TEST checkout; Follow-up (operator)

### `diagrams`

#### `diagrams/c4/README.md`
**Scope:** **Scope:** C4 diagrams (PNG for exec / security) - full detail, tables, and links in the sections below.
**Title:** C4 diagrams (PNG for exec / security)
**Summary:** **Purpose:** **Static PNGs** for audiences who will not open Mermaid in markdown. **Source files** (`.mmd`) are the canonical definitions; regenerate PNGs when the architecture changes. | File | C4 level | Description | |------|----------|-------------| | [c4-context.mmd](c4-context.mmd) | **1 — Context** | People, ArchLucid, and main external systems (SQL, blob, Entra, Azure OpenAI). | | [c4-container.mmd](c4-container.mmd) | **2 — Containers** | API, Worker, optional UI, data plane, identity, LLM. | | [c4-component-api.mmd](c4-component-api.mmd) | **3 — Components (API only)** | Simplified internals of the API process. | | Generated PNG | Source | |---------------|--------| | [c4-context.p
**Headings:** C4 diagrams (PNG for exec / security); Regenerate PNGs (maintainers); Related narrative docs

### `engineering`

#### `engineering/BUILD.md`
**Scope:** **Scope:** Build & project hygiene for **ArchLucid contributors and internal engineers** - full detail, tables, and links in the sections below.
**Title:** Build & project hygiene
**Summary:** > **Audience banner — read first.** ArchLucid is a **SaaS** product. **Customers, evaluators, and sponsors never run `dotnet build`, `npm ci`, Docker, or local SQL.** This document is the **contributor / internal-engineer** build & test hygiene reference. Customer-facing entry points are **[`START_HERE.md`](../START_HERE.md)** "Audience split" and the website at `archlucid.net`. > **Product naming:** Documentation refers to the product as **ArchLucid**. Phase 7 retired legacy `ArchLucid*` configuration and CLI naming; see `docs/library/V1_DEFERRED.md` for deferred items (Terraform state, repo path, etc.). See also [TEST_STRUCTURE.md](../library/TEST_STRUCTURE.md) for test categories a
**Headings:** Build & project hygiene; Compiler quality (warnings as errors); Hosting misconfiguration warnings (staging / production-like); Full solution; Solution filters (partial `.NET` load); On Windows the shim may be dotnet-CycloneDX.exe instead of dotnet-cyclonedx.; OpenTelemetry metrics (`ArchLucid` meter); SQL Server for integration tests (Dapper + API)

#### `engineering/CONTAINERIZATION.md`
**Scope:** **Scope:** Containerization for **ArchLucid contributors and internal operators** - full detail, tables, and links in the sections below.
**Title:** Containerization
**Summary:** > **Audience banner — read first.** ArchLucid is a **SaaS** product. **Customer-facing deliverables are the public website, the in-product operator UI, the published API client libraries, OpenAPI contracts, and documentation.** Docker images, `docker compose` definitions, and the contents of this document are **engineering / CI/CD / vendor-operations artifacts** — not a "customer installs our containers" distribution model. Customer entry points: **[`START_HERE.md`](../START_HERE.md)** "Audience split" and `archlucid.net`. Provide production-ready Docker images for the **ArchLucid** API and Operator UI that are identical across local integration testing and **vendor-operated** cloud deployme
**Headings:** Containerization; Objective; Customer product boundary (SaaS); Assumptions; Constraints; Architecture Overview; Development Workflows; Workflow 1 — Hot-reload (default)

#### `engineering/CONTRIBUTOR_ON_ONE_PAGE.md`
**Scope:** **Scope:** Contributor fast path — install order, one verification command, and where to read next; not buyer narrative, deep architecture, or operator atlas detail.
**Title:** Contributor on one page
**Summary:** **ArchLucid** is an AI-assisted architecture workflow (structured request → run → committed manifest, with exports and governance hooks). **Onboarding entry:** [START_HERE.md](START_HERE.md). | I want to… | Go here | | --- | --- | | **Docker-first boot (no .NET first)** | [docs/engineering/FIRST_30_MINUTES.md](engineering/FIRST_30_MINUTES.md) | | **Build, test, migrations** | [docs/engineering/BUILD.md](engineering/BUILD.md) | | **Architecture poster (C4)** | [docs/ARCHITECTURE_ON_ONE_PAGE.md](ARCHITECTURE_ON_ONE_PAGE.md) | | **HTTP API contracts** | [docs/library/API_CONTRACTS.md](library/API_CONTRACTS.md) | | **Deployment (internal operators)** | [docs/engineering/DEPLOYMENT.md](engineerin
**Headings:** Contributor on one page; Common tasks; Copy-paste (repo root); Verify in one shot (Docker running); Install + troubleshooting

#### `engineering/DEPLOYMENT.md`
**Scope:** **Scope:** Deployment and rollback umbrella for **ArchLucid internal operators and release managers** - full detail, tables, and links in the sections below.
**Title:** Deployment and rollback (umbrella — internal operators)
**Summary:** > **Audience banner — read first.** ArchLucid is a **SaaS** product. **Customers never deploy ArchLucid; ArchLucid hosts it for them at `archlucid.net`.** This document is for **internal ArchLucid operators and release managers** running our hosted production / staging environments. Customer entry points: **[`START_HERE.md`](../START_HERE.md)** "Audience split" and `archlucid.net`. This document ties together how **ArchLucid** (product; repository and assemblies still use `ArchLucid.*` until rename Phase 5–6) is released, how database changes roll forward, and where to find deeper procedures. It is aimed at **internal operators and release managers**, not at local `docker compose`-only workf
**Headings:** Deployment and rollback (umbrella — internal operators); Objectives; Assumptions; Application deployment; Rollback; Related documentation; CORS (browser → API); Security note

#### `engineering/DEVCONTAINER.md`
**Scope:** **Scope:** Dev container for **ArchLucid contributors and internal engineers** - full detail, tables, and links in the sections below.
**Title:** Dev container
**Summary:** > **Audience banner — read first.** ArchLucid is a **SaaS** product. **Customers, evaluators, and sponsors never open the dev container, run Docker, or install SQL.** This document is for ArchLucid contributors who want a Cursor / VS Code dev-container loop. Customer entry points: **[`START_HERE.md`](../START_HERE.md)** "Audience split" and `archlucid.net`. The **`.devcontainer/devcontainer.json`** uses the Microsoft **.NET 10** dev image plus **Node.js 22** (Operator UI). It is intended for editors that support the Dev Containers spec. The container does not embed SQL Server. On the **host**, run:
**Headings:** Dev container; Data plane dependencies; Environment

#### `engineering/FIRST_30_MINUTES.md`
**Scope:** **Scope:** First-time **ArchLucid contributor / internal engineer** running the full stack on a laptop. Goal: from `git clone` to "I committed a manifest and saw a finding" in ~30 minutes, using only Docker (no .NET SDK, no Node, no cloud keys).
**Title:** First 30 minutes — ArchLucid (contributor / internal engineer)
**Summary:** > **Audience banner — read first.** ArchLucid is a **SaaS** product. **Customers, evaluators, and sponsors never run Docker, SQL, .NET, Node, or any local CLI.** They sign up at **`archlucid.net`** and use the in-product operator UI. This document is the **contributor / internal-engineer** first-run path — it is **not** the customer first-run path. If you arrived here as a buyer or evaluator, start at **[`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)** then **[`ARCHITECTURE_ON_ONE_PAGE.md`](../ARCHITECTURE_ON_ONE_PAGE.md)**, and request a guided trial. See **[`START_HERE.md`](../START_HERE.md)** "Audience split" and **[`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_
**Headings:** First 30 minutes — ArchLucid (contributor / internal engineer); Prerequisites (one check); The 10 commands; 1. Get the code; 2. Start the demo stack; 3. Sanity-check the API; 4. Confirm the build identity; 5. Open the operator UI

#### `engineering/INSTALL_ORDER.md`
**Scope:** **Scope:** Canonical install order for **ArchLucid contributors and internal operators**. Supersedes persona-specific install steps.
**Title:** Install order (canonical — ArchLucid contributors and internal operators)
**Summary:** > **Audience banner — read first.** ArchLucid is a **SaaS** product. **Customers, evaluators, and sponsors never install Docker, SQL, .NET, Node, or Terraform** — they sign up at **`archlucid.net`** and use the in-product operator UI. This document is the **contributor / internal-operator** install path. It exists for people building, testing, or operating ArchLucid itself, not for customers using it. See **[`START_HERE.md`](../START_HERE.md)** "Audience split" and **[`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](../archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md)** §0.1. Single answer to: **What do I install, in what order, to get a working
**Headings:** Install order (canonical — ArchLucid contributors and internal operators); Prerequisites (read first); Dependency graph; Ordered steps (two columns); After install (persona week-one — not install order)

#### `engineering/SAAS_INFRA_VALIDATION.md`
**Scope:** **Scope:** Contributors running offline Terraform `init`/`validate` across declared roots — not `plan`/`apply`, Azure login, or production change windows.
**Title:** SaaS infrastructure validation (Terraform)
**Summary:** **Purpose** — run **offline** checks so every Terraform “root” (deployable `infra/terraform*` tree plus `infra/modules/*` packages) **initializes** and **validates** without Azure credentials, and so **layout** matches `infra/apply-saas.ps1` and shared conventions. **Prerequisites** - [Terraform CLI](https://www.terraform.io/downloads) ≥ 1.8 - [PowerShell 7+](https://github.com/PowerShell/PowerShell) (`pwsh`) on the PATH - **No** `az login` or other cloud credentials; uses `terraform init -backend=false` and `terraform validate` only (no `plan` / `apply`). | Script | Checks | |--------|--------| | [scripts/validate-saas-infra.ps1](../../scripts/validate-saas-infra.ps1) | For each discovered
**Headings:** SaaS infrastructure validation (Terraform); What the scripts do; How to run locally (repo root); Optional: fail on provider version drift; or; Adding a new Terraform root and getting “included”; Count of roots (≈ 17+); Operational notes

### `evidence`

#### `evidence/LLM_COST_RECONCILIATION.md`
**Scope:** **Scope:** Engineering evidence for reconciling LLM cost estimates with Azure billing on the dev AOAI resource (`oai-archlucid-dev`); for operators and reviewers assessing telemetry vs Cost Management—not legal/financial advice; figures depend on subscription discounts, region, deployment SKU, and Cost Management latency.
**Title:** Llm Cost Reconciliation
**Summary:** Reconcile **`LlmCostEstimator`** USD output with: 1. **Token-derived estimates** recorded on **`AgentExecutionTrace`** rows (product telemetry path). 2. **Actual billed** Azure usage attributed to **`Microsoft.CognitiveServices/accounts/oai-archlucid-dev`** (Cost Management). **Constraints respected:** no changes to **`LlmCostEstimator`** logic in this evidence pass — only measurement + configuration guidance. | Acceptance item | Status | |-----------------|--------| | ≥ **5** real-mode golden cohort runs with captured **`estimatedUsd`** / tokens | **Not executed in-repo** — requires a running API host, **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM`**, Azure OpenAI credentials, and budget approval (se
**Headings:** 1. Objective; Evidence collection status (handoff); 2. Estimator reference (shipped code path); 3. Golden cohort capture procedure (real LLM, `gpt-4o`); Per-run fields to record; Scenario placeholder table (operator completion); 4. Azure Cost Management — actual billed (dev resource only); Automated query (evidence capture)

#### `evidence/phase3/gate-verification.md`
**Scope:** **Scope:** Phase 3 exit-gate verification snapshot referenced from [ADR 0022](../../architecture/adrs/0022-coordinator-phase3-deferred.md) and historical [`CHANGELOG.md`](../../CHANGELOG.md) entries.
**Title:** Phase 3 gate verification (historical snapshot)
**Summary:** This document anchors **mechanical verification** notes for ADR 0021 Phase 3 exit gates when [ADR 0022](../../architecture/adrs/0022-coordinator-phase3-deferred.md) recorded blocked or deferred state. Checked-in narrative evidence for Phase 3 lives under **`docs/evidence/phase3/`**. Do not move these files to **`docs/artifacts/`** — the repository `.gitignore` entry **`artifacts/`** matches that folder name anywhere in the tree, so CI would never see the files and `scripts/ci/check_doc_links.py` would fail on every run. Strangler work is re-scoped under [ADR 0030](../../architecture/adrs/0030-coordinator-authority-pipeline-unification.md); pre-release waivers for gates **(i)** and **(iv)** a
**Headings:** Phase 3 gate verification (historical snapshot); Path note; Current posture (2026-04-22 onward); Why this file remains

#### `evidence/phase3/pr-a2-cohort-parity.md`
**Scope:** **Scope:** Phase 3 PR A2 — human-readable summary of cohort parity evidence (coordinator vs authority commit path). Linked from [`COORDINATOR_TO_AUTHORITY_PARITY.md`](../../runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md) and [`CHANGELOG.md`](../../CHANGELOG.md).
**Title:** PR A2 cohort parity evidence
**Summary:** This file lives under **`docs/evidence/phase3/`** (not `docs/artifacts/…`) because the repo `.gitignore` pattern **`artifacts/`** matches any directory named `artifacts`, which would untrack CI-local evidence if we nested markdown there. - **Tests:** `ArchitectureRunCommitPathParityIntegrationTests` in `ArchLucid.Api.Tests` (identical **traceability-bundle.zip** entry names; stable **`PilotRunDeltasResponse`** fields: findings-by-severity histogram, audit row count + truncation flag, LLM call count, demo flag, top severity string). - **Composition:** `ServiceCollectionExtensionsCompositionResolveTests` resolves `IArchitectureRunCommitOrchestrator` → `RunCommitPathSelector` as appropriate for
**Headings:** PR A2 cohort parity evidence; Where the mechanical proof lives; Intentionally out of scope for bit-identical asserts; Maintenance

### `explainability`

#### `explainability/CITATION_BOUND_RENDERING.md`
**Scope:** **Scope:** Citation-bound aggregate explanations - full detail, tables, and links in the sections below.
**Title:** Citation-bound aggregate explanations
**Summary:** Tie **aggregate** run explanations to **persisted artifacts** operators can inspect (manifest, findings, traces, optional bundle). - **`GET /v1/explain/runs/{runId}/aggregate`** returns **`RunExplanationSummary`** including **`citations`** (`CitationReference[]`). - The operator UI renders **chips** linking to manifest / provenance / run anchors. - **Read-only** authority: explanations require **`ReadAuthority`** (same as today). - **Not** a substitute for causal proof — see [../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) §10. **Aggregates:** `RunExplanationCitationBuilder` builds citations from **`RunDetailDto`**. **Instrumentation:** `archlucid_expl
**Headings:** Citation-bound aggregate explanations; Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

### `go-to-market`

#### `go-to-market/ADMIN_SURFACE_FIRST_60S_AUDIT.md`
**Scope:** **Scope:** Quick operator-shell audit — what a **buyer / pilot** sees in the first minute vs **platform admin** surfaces.
**Title:** Admin vs review workflow — first-60s UX notes
**Summary:** **Spine doc:** [`START_HERE.md`](../START_HERE.md). - **Review workflow** (`NavShellSurface.review-workflow`): runs, findings, analysis, governance **inbox** — default collapsed sidebar emphasizes pilot path; command palette shows admin groups only after the user types a **non-empty** search. - **Platform admin** (`platform-admin`): system health, tenant cost, support bundle, users — rendered in a separate sidebar cluster and mobile **Administration** block; deep links under `/admin/*` and `/settings/*` map here (`platform-admin-path.ts`). | Moment | Buyer-safe expectation | Admin leakage check | |--------|------------------------|---------------------| | Land on home | Pilot essentials + **
**Headings:** Admin vs review workflow — first-60s UX notes; Intent; First 60 seconds (signed-in operator, default toggles); Doc / test anchors

#### `go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md`
**Scope:** **Scope:** Quarterly **aggregate** ROI bulletin template for GTM and leadership — sanitized statistics only; not a vehicle for per-customer disclosure.
**Title:** Aggregate ROI bulletin — template (internal draft)
**Summary:** **No version of this bulletin may be published externally** (web, email to prospects, press, or partner decks) without **explicit owner sign-off** recorded per [`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) item **27**. Engineering may generate **drafts** from production using `archlucid roi-bulletin` (see [`docs/CLI_USAGE.md`](../library/CLI_USAGE.md)); publication remains **owner-only**. **Resolved 2026-04-21 (item 27):** | Decision | Value | |----------|-------| | **Minimum N for first issue** | **5** qualifying tenants | | **Signatory** | **Owner-solo** sign-off (no CRO / GC co-sign required) | | **Percentile bands** | **Mean + p50 + p90** all stay in v1 bulletins | | **First pub
**Headings:** Aggregate ROI bulletin — template (internal draft); Owner-approval gate (mandatory); Minimum-N privacy guard; Allowed statistics (this template); Draft body skeleton (Markdown); ArchLucid — aggregate review-cycle baseline bulletin (INTERNAL); Headline numbers (tenant-supplied baseline hours only); Interpretation guardrails

#### `go-to-market/ARCHITECTURE_REVIEW_BOARD_EXPORT.md`
**Scope:** **Scope:** Architecture review board packet export (DOCX/PDF), consultant whitelabel, and checked-in marketing samples. Buyer-facing vocabulary follows [UI Glossary V1](UI_GLOSSARY_V1.md) (improvement #27).
**Title:** Architecture review board export
**Summary:** Synthetic deliverables for landing pages and procurement previews (fictitious **Contoso Architecture Partners** / **Northwind Corp**, placeholder logo pixel): - [`samples/architecture-review-report-sample.docx`](samples/architecture-review-report-sample.docx) - [`samples/architecture-review-report-sample.pdf`](samples/architecture-review-report-sample.pdf) See [`samples/README.md`](samples/README.md) for regeneration. These files contain **no customer data**. 1. Open a **review** from **Reviews** (`/reviews`, `/reviews/{runId}`). 2. **Finalize review** when the architecture snapshot is ready (buyer-facing language for commit). 3. On the review detail page, open **Artifacts & exports** (or **
**Headings:** Architecture review board export; Sample downloads (sanitized); How to trigger export; Operator UI (today); API (consulting DOCX — live surface); Application entry (architecture review board packet); Whitelabel (consultants); Report sections (what populates each)

#### `go-to-market/ASSURANCE_STATUS_CANONICAL.md`
**Scope:** **Scope:** Canonical assurance status source for procurement-facing language; defines current status, deferred windows, allowed wording, and evidence links to prevent cross-document drift.
**Title:** Assurance Status Canonical
**Summary:** **Audience:** Procurement, security reviewers, and internal authors updating buyer-facing artifacts. **Last reviewed:** 2026-05-01 This document is the single source of truth for assurance status wording used by: - `TRUST_CENTER.md` - `CURRENT_ASSURANCE_POSTURE.md` - `PROCUREMENT_FAQ.md` - `PROCUREMENT_RESPONSE_ACCELERATOR.md` - `SOC2_STATUS_PROCUREMENT.md` | Assurance item | Current status | Deferred window | Allowed buyer wording | Evidence | |---|---|---|---|---| | SOC 2 Type II attestation | Not issued | Deferred (funding-gated) | "SOC 2 Type II is not currently issued. ArchLucid provides a self-assessment and evidence pack while attestation is deferred." | [SOC2_STATUS_PROCUREMENT.md](S
**Headings:** Assurance Status Canonical; Canonical status table; Authoring rules

#### `go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md`
**Scope:** **Scope:** Azure Marketplace — SaaS offer (fulfillment v2) checklist - full detail, tables, and links in the sections below.
**Title:** Azure Marketplace — SaaS offer (fulfillment v2) checklist
**Summary:** Stand up a **transactable** SaaS offer that lands buyers in ArchLucid while using **managed identity** to call **`https://marketplaceapi.microsoft.com/.default`** for subscription activation. 1. **Partner Center** → Commercial Marketplace → New offer → **Software as a Service**. 2. **Plan IDs** align with ArchLucid commercial tiers (`Team`, `Professional`, `Enterprise`) or map in your landing page (names must match [PRICING_PHILOSOPHY.md](go-to-market/PRICING_PHILOSOPHY.md) §3 — do not publish the middle tier as **Pro** alone; use **Professional**). 3. **Technical configuration** - **Landing page URL:** the URL returned from `Billing:AzureMarketplace:LandingPageUrl` (must accept `tenantId`,
**Headings:** Azure Marketplace — SaaS offer (fulfillment v2) checklist; Objective; Step-by-step (operator); Webhook actions (implemented subset); Example webhook (curl); Related

#### `go-to-market/BACKUP_AND_DR.md`
**Scope:** **Scope:** ArchLucid — Backup, disaster recovery, and data lifecycle - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Backup, disaster recovery, and data lifecycle
**Summary:** **Audience:** Security reviewers and procurement teams evaluating ArchLucid's data protection and recovery posture. **Last reviewed:** 2026-04-15 This document describes ArchLucid's backup, disaster recovery, and data lifecycle posture **honestly** — stating what is in place, what uses Azure platform defaults, and what is roadmap. | Property | Value | |----------|-------| | **Backup type** | Azure SQL automated backups (full, differential, transaction log) | | **Point-in-time restore** | Azure SQL default retention window (7–35 days depending on service tier; standard default is **7 days**) | | **Geo-redundant backup** | Available when configured via Terraform (`infra/terraform-sql-failover/
**Headings:** ArchLucid — Backup, disaster recovery, and data lifecycle; 1. Backup; Azure SQL Database; Blob storage; 2. Disaster recovery; SQL failover group; Geo-failover drill; Application resilience

#### `go-to-market/BULK_EVIDENCE_UPLOAD_V1.md`
**Scope:** **Scope:** GTM, pilots, and implementers aligning on V1 GA bulk evidence uploads (up to 30 files per action); not ZIP expansion, folder recursion, or other deferred V1.1 batch mechanics in `docs/library/V1_DEFERRED.md`.
**Title:** Bulk Evidence Upload (V1 GA)
**Summary:** Bulk upload up to 30 files per action at GA. **Note:** Larger batches (ZIP expansion, folder recursion) are deferred to V1.1. See `docs/library/V1_DEFERRED.md` for more details on post-GA bulk processing features.
**Headings:** Bulk Evidence Upload (V1 GA)

#### `go-to-market/BUSINESS_VALUE_CHEAT_SHEET.md`
**Scope:** **Scope:** Sales and marketing — quick **technical feature → business outcome → economic impact** mapping for conversations and decks; illustrative impact language only, **not** contractual ROI, audit-hour guarantees, pricing, or security attestations — verify specifics with **`PRODUCT_DATASHEET.md`** and procurement docs before buyer commitments.
**Title:** Business value cheat sheet
**Summary:** Use this table to translate ArchLucid capabilities into buyer language. **Economic impact** cells are directional talking points for discovery — always tie promises to evidence in repo-linked procurement and datasheet material. | Technical Feature | Business Outcome | Economic Impact | |-------------------|------------------|-----------------| | Row-Level Security (RLS) | Prevents cross-tenant data leakage at the database boundary | Reduces breach and privacy-incident exposure; lowers cost of forensic cleanup and regulator response | | Append-only audit log (typed events, DENY mutate) | Gives a tamper-evident record of who did what and when for reviews and operations | Accelerates compliance
**Headings:** Business value cheat sheet; How to use in the field

#### `go-to-market/BUYER_JOURNEY.md`
**Scope:** **Scope:** Buyer journey (outside-in) - full detail, tables, and links in the sections below.
**Title:** Buyer journey (outside-in)
**Summary:** Help enterprise architecture and platform leaders **hire ArchLucid** to turn messy architecture requests into **reviewable, versioned manifests, evidence, and governance-ready artifacts** in weeks instead of quarters — without replacing their existing EA tools wholesale. - The buyer already has **Confluence/Jira**, **draw.io or similar**, and **some** formal governance (even if inconsistent). - **Entra ID** (or equivalent) exists; the team can approve an Azure-first pilot. - Economic buyers may **not** have a labeled budget line** for “AI architecture OS”; value must map to **release risk**, **audit evidence**, or **review cycle time**. - Sales motion is **multi-stakeholder** (EA, security r
**Headings:** Buyer journey (outside-in); Objective; Assumptions; Constraints; Architecture overview (buyer mental model); Component breakdown (what the buyer touches); Data flow; Security model

#### `go-to-market/BUYER_PERSONAS.md`
**Scope:** **Scope:** ArchLucid buyer personas - full detail, tables, and links in the sections below.
**Title:** ArchLucid buyer personas
**Summary:** **Audience:** Product, sales, and marketing teams who need a shared understanding of who buys ArchLucid, why, and how they evaluate it. **Last reviewed:** 2026-04-15 **Grounding rule:** Capabilities and limitations referenced here reflect the V1 codebase per [V1_SCOPE.md](../library/V1_SCOPE.md) and [CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md). 1. **Sales:** Use personas to qualify leads quickly. If the prospect does not match at least one persona, the deal is likely a poor fit for V1. 2. **Marketing:** Use pain points and language to craft messaging that resonates. 3. **Product:** Use evaluation criteria and objections to prioritize roadmap items. 4. **Demo prep:*
**Headings:** ArchLucid buyer personas; How to use this document; Persona 1: The Enterprise Architect / Chief Architect; Profile; Responsibilities and goals; Pain points ArchLucid addresses; How they evaluate tools; What would make them champion ArchLucid

#### `go-to-market/COMPETITIVE_COMPARISON.md`
**Scope:** **Scope:** Procurement-facing competitive comparison — category-level contrasts only; ArchLucid claims grounded in shipped product docs (`docs/library/V1_SCOPE.md`, `docs/go-to-market/POSITIONING.md`). No competitor logos or trademarks.
**Title:** Competitive comparison — procurement pack
**Summary:** **Audience:** Security, architecture, and sourcing reviewers evaluating ArchLucid against common incumbent patterns. **Last reviewed:** 2026-05-10 **How to use this doc** - Treat competitor descriptions as **typical patterns** for each category — implementations vary by organization. - **Do not** quote cells below as factual statements about a named vendor without confirming against that vendor’s own materials. **Related:** [`POSITIONING.md`](POSITIONING.md) (value proposition), [`COMPETITIVE_LANDSCAPE.md`](COMPETITIVE_LANDSCAPE.md) (market-level matrices), [`ENTERPRISE_COMPARISON_ONE_PAGE.md`](ENTERPRISE_COMPARISON_ONE_PAGE.md) (short procurement PDF source). | Category | What organizations
**Headings:** Competitive comparison — procurement pack; 1. Where each category tends to excel; 2. Capability matrix (ArchLucid vs three incumbent patterns); 3. ArchLucid differentiation summary (fact-only); 4. FAQ — “Why not just use [X]?”; Why not rely on manual architecture review and general-purpose documentation portals?; Why not standardize on diagram-first collaboration tooling?; Why not satisfy procurement using only our enterprise GRC or IT governance suite?

#### `go-to-market/COMPETITIVE_LANDSCAPE.md`
**Scope:** **Scope:** ArchLucid competitive landscape - full detail, tables, and links in the sections below.
**Title:** ArchLucid competitive landscape
**Summary:** **Audience:** Product leadership, sales, and marketing teams who need to position ArchLucid against alternatives during evaluations and deal cycles. **Last reviewed:** 2026-05-07 **Grounding rule:** Every capability claimed for ArchLucid in this document is based on what the repository actually ships today per [V1_SCOPE.md](../library/V1_SCOPE.md), [ARCHITECTURE_CONTEXT.md](../library/ARCHITECTURE_CONTEXT.md), and [QUALITY_ASSESSMENT_2026_04_14_WEIGHTED.md](../archive/quality/2026-04-23-doc-depth-reorg/QUALITY_ASSESSMENT_2026_04_14_WEIGHTED.md). Claims are not aspirational. ArchLucid operates at the intersection of two established markets and one emerging one: | Market | Size estimate | Key
**Headings:** ArchLucid competitive landscape; 1. Market context; The category: Architecture Proof Engine; 2. Competitor matrix; 2.1 Enterprise architecture management incumbents; 2.2 Cloud-native architecture review tools; 2.3 AI-native tools and approaches; 3. ArchLucid capability summary (grounded in V1 codebase)

#### `go-to-market/COMPETITIVE_POSITIONING.md`
**Scope:** **Scope:** Competitive positioning for internal sales enablement and evaluator conversations — not for public publication without review.
**Title:** Competitive positioning (internal)
**Summary:** **Audience:** Field teams, solutions consultants, and product marketing preparing evaluators or pilots — use alongside the public-facing **[POSITIONING.md](POSITIONING.md)** narrative. **Last reviewed:** 2026-05-08 **Grounding rule:** ArchLucid cells in the matrix below map to **[V1_SCOPE.md](../library/V1_SCOPE.md)** and linked evidence. Other products are described at the level of **publicly understood primary use**; organizations vary by edition, plugins, and custom work. Do **not** treat this page as an exhaustive third-party feature matrix. ArchLucid is a **vendor-operated service** that accepts a structured **architecture request** and produces **versioned, evidence-linked findings** t
**Headings:** Competitive positioning (internal); Positioning statement; Capability comparison; When ArchLucid is not the right tool; Proof points (traceable artifacts); Related

#### `go-to-market/COMPETITOR_CONTRAST.md`
**Scope:** **Scope:** Competitor contrast (honest positioning) - full detail, tables, and links in the sections below.
**Title:** Competitor contrast (honest positioning)
**Summary:** **Audience:** Sales engineers, architects pitching sponsors. **Not** a feature matrix for RFP checkbox wars. **Where it wins:** Zero license cost; teams already know the wiki; political neutrality (“we don’t buy tools”). **Where ArchLucid wins:** **Versioned manifests** tied to **runs**, **replay/compare**, **LLM-assisted structuring** with **faithfulness and provenance hooks** — the wiki cannot enforce “what changed between these two decisions” without heroic manual work. **Where ArchLucid does *not* win:** Organizations that only need **lightweight documentation** and will never pay for Azure footprint or LLM usage. If the problem is “people don’t write ADRs,” ArchLucid doesn’t fix culture
**Headings:** Competitor contrast (honest positioning); 1. Homegrown EA (Confluence + ADRs + spreadsheets); 2. Diagramming + office suite (Visio, draw.io, PowerPoint packs); 3. Enterprise GRC / ITSM suites (ServiceNow GRC, Jira Align at policy layer, etc.)

#### `go-to-market/COST_GUIDE.md`
**Scope:** **Scope:** Buyer-facing **cost-of-operations** framing for ArchLucid-hosted and self-hosted pilots — estimates, not contractual pricing; verify against your Azure subscription and AOAI deployment.
**Title:** Cost guide (ArchLucid operations)
**Summary:** **Audience:** finance + platform owners sizing **LLM token burn** and **Azure footprint** before a pilot. - **Operational** cost (Azure resources + LLM usage)—**not** ArchLucid **commercial** subscription pricing (see **[ORDER_FORM_TEMPLATE.md](./ORDER_FORM_TEMPLATE.md)** / sales). - Mixes **measured instrumentation** (meter names in **[OBSERVABILITY.md](../library/OBSERVABILITY.md)**) with **illustrative arithmetic** using **public Azure OpenAI** list pricing—**recompute** before board approval. | Signal | Where it lives | |--------|----------------| | Calls per run | Histogram **`archlucid_llm_calls_per_run`** | | Token counters | **`archlucid_llm_*`** family (see **`ArchLucid.Core/Diagnos
**Headings:** Cost guide (ArchLucid operations); 1. What this document is; 2. Variable: LLM tokens per run; 3. Shared Azure fabric (order-of-magnitude); 4. Compared to **manual** architecture review hours; 5. Next steps

#### `go-to-market/CROSS_TENANT_DATA_PROCESSING_ADDENDUM.md`
**Scope:** **Scope:** Cross-tenant optional processing addendum defining exact data classes, privacy floor controls, opt-in/withdrawal behavior, and audit evidence expectations for procurement and DPA alignment.
**Title:** Cross-Tenant Data Processing Addendum
**Summary:** **Audience:** Legal reviewers, procurement, and product/security teams documenting optional cross-tenant processing. **Last reviewed:** 2026-05-01 This addendum defines the operational controls for optional cross-tenant pattern processing referenced by `DPA_TEMPLATE.md` section 10. The feature is optional, OFF by default, and separate from core tenant-private processing. - Non-identifying structural architecture fingerprints. - Coarse-grained aggregate counters used to generate generalized guidance. - Event metadata required to enforce minimum cohort thresholds and audit setting changes. - Free-text architecture descriptions. - URLs, hostnames, and endpoint strings. - User names, email addre
**Headings:** Cross-Tenant Data Processing Addendum; 1. Purpose; 2. Data included and excluded; Included (when opt-in is enabled); Explicitly excluded; 3. Privacy floor and publication control; 4. Opt-in and withdrawal flow; 5. Audit evidence and controls

#### `go-to-market/CURRENT_ASSURANCE_POSTURE.md`
**Scope:** **Scope:** Buyers and security reviewers: repository-linked snapshot of current assurance claims; not legal advice, CPA attestation, or customer-specific commitments.
**Title:** ArchLucid — Current Assurance Posture
**Summary:** **Date:** 2026-05-01 **Last reviewed:** 2026-05-01 **Classification:** Buyer-facing (include in procurement pack ZIP) This document summarizes the security, compliance, and assurance evidence that ArchLucid provides today. Every claim below links to a source artifact in the repository. Status labels follow [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md) to avoid contradictory buyer wording. ArchLucid runs automated security checks on every pull request and merge to main. These are **merge-blocking** unless noted. | Check | Tool | What it catches | CI status | |-------|------|----------------|-----------| | Secret scanning | [Gitleaks](https://github.com/gitleaks/gitleaks) (`
**Headings:** ArchLucid — Current Assurance Posture; 1. Continuous security testing in CI; 2. Data isolation model; 3. Audit trail; 4. Threat modeling; 5. Compliance and privacy; 6. Penetration testing; 7. Infrastructure as Code

#### `go-to-market/CUSTOMER_HEALTH_SCORING.md`
**Scope:** **Scope:** ArchLucid — Customer health scoring framework - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Customer health scoring framework
**Summary:** **Audience:** Customer success team and product leadership. **Last reviewed:** 2026-04-15 Detect **churn risk** early, identify **expansion** opportunities, and give the CS team a **single composite health score** per account. This framework starts manual (Phase 1) and evolves toward in-product automation. | Dimension | Weight | Signals | Data source | |-----------|--------|---------|-------------| | **Engagement** | 30% | Runs per week, unique active operators, login frequency | `dbo.Runs` (created dates), `dbo.AuditEvents` (actor diversity) | | **Breadth** | 20% | Finding engine types used, comparison runs, export frequency, workspaces active | Run metadata, audit events | | **Quality** |
**Headings:** ArchLucid — Customer health scoring framework; 1. Purpose; 2. Health dimensions; 3. Scoring model; Per-dimension scale (1–5); Composite score; 4. Implementation phases; Phase 1 SQL queries (starter)

#### `go-to-market/CUSTOMER_ONBOARDING_PLAYBOOK.md`
**Scope:** **Scope:** ArchLucid — Customer onboarding playbook - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Customer onboarding playbook
**Summary:** **Audience:** Customer success, sales engineering, and account management teams onboarding new SaaS customers. **Last reviewed:** 2026-04-17 This playbook aligns with the 6-week pilot timeline in [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md) and the technical quickstart in [../OPERATOR_QUICKSTART.md](../library/OPERATOR_QUICKSTART.md). **Pricing:** Current tier pricing, pilot fee, and design-partner terms are in [PRICING_PHILOSOPHY.md §4–§5](PRICING_PHILOSOPHY.md). Do not restate prices in this playbook. | Item | Owner | Definition of done | |------|-------|--------------------| | Tenant provisioned in ArchLucid SaaS | ArchLucid | Tenant ID confirmed, workspace created | | SSO con
**Headings:** ArchLucid — Customer onboarding playbook; 1. Onboarding phases; Week 0 — Pre-launch; Week 1 — Foundation; Weeks 2–3 — Adoption; Weeks 4–5 — Expansion; Week 6 — Review; 2. Touchpoint schedule

#### `go-to-market/DECISION_FAST_LANE.md`
**Scope:** **Scope:** Buyer-facing one-pager — pilot vs procurement paths, honest calendars, escalation triggers; not legal advice or a substitute for executed contracts.
**Title:** Decision fast lane (pilot + procurement)
**Summary:** **Audience:** Sponsors, sales engineers, and procurement coordinators who need **where to start** and **what to expect** without reading the full scope contract first. **Not this doc:** SKU math, detailed API semantics, or attestation claims — use pricing philosophy, API contracts, and Trust Center links below. Default motion: **[`docs/CORE_PILOT.md`](../CORE_PILOT.md)** — four steps. | Step | Outcome | |------|---------| | 1 | Structured architecture request submitted | | 2 | Pipeline completes | | 3 | Review package finalized (golden manifest committed) | | 4 | Manifest + artifacts reviewed / exported | **Measurement:** [`docs/library/PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) (sc
**Headings:** Decision fast lane (pilot + procurement); A. Pilot path (first useful outcome); B. Procurement path (diligence); C. What is signed vs template vs unavailable (V1); D. Typical calendar (honest ranges); E. Escalation triggers (involve founder / legal / security lead); F. One-email sponsor kit; Related

#### `go-to-market/DEFAULT_POLICY_PACKS_V1.md`
**Scope:** **Scope:** Default policy packs — V1 GA bundles - full detail, tables, and links in the sections below.
**Title:** Default policy packs — V1 GA bundles
**Summary:** **Audience:** pilots, procurement, CS, and sellers explaining what governance content ships **in-tenant by default**. **Objective:** Declare exactly **two** first-party curated categories bundled with every net-new tenant provisioning (see `IDefaultPolicyPackSeeder` / `DEFAULT_POLICY_PACKS_V1`). Everything else—including **Azure Landing Zone / CAF-style** packs—falls under **explicit V1.1** messaging below. | Bundled GA category | Display name | Pack type in UI/API | Stable rule references | Canonical narrative | |--------------------|--------------|---------------------|-----------------------|-----------------------| | **AI Governance** | **AI Governance / Responsible AI** | `PlatformDefau
**Headings:** Default policy packs — V1 GA bundles; 1. What ships for V1 GA; 2. Explicitly **not** a V1 GA bundle; Azure landing-zone / Cloud Adoption Framework (CAF) curated pack → **V1.1**; 3. Framework & jurisdiction disclaimers (all bundled rules); 4. Operator UI — where bundles appear; 5. Security / tenancy posture (non-regression assertion)

#### `go-to-market/DEMO_QUICKSTART.md`
**Scope:** **Scope:** ArchLucid demo quickstart (buyer-facing) - full detail, tables, and links in the sections below.
**Title:** ArchLucid demo quickstart (buyer-facing)
**Summary:** **Audience:** Evaluators and champions who want to see the product in minutes without installing the .NET SDK, SQL Server, or Node.js locally. **Grounding:** Same demo data as [demo-quickstart.md](../library/demo-quickstart.md) (Contoso Retail) and [V1_SCOPE.md](../library/V1_SCOPE.md). The Docker path uses **Development** environment, **simulator** agent mode (no Azure OpenAI charges), and **startup demo seed** after DbUp. - **Docker Desktop** (Windows or macOS) or **Docker Engine** (Linux) - That is all — no .NET 10 SDK, no local SQL Server, no Node.js for running the stack From the repository root: | Platform | Command | |----------|---------| | **Windows (PowerShell)** | `.\scripts\demo-
**Headings:** ArchLucid demo quickstart (buyer-facing); Prerequisites; Start the demo (one command); Your first five minutes; What you are seeing; Cleanup; Troubleshooting; Next steps

#### `go-to-market/DEMO_VIDEO_SCRIPT.md`
**Scope:** **Scope:** Two-minute product demo video script and recording notes for the core pilot path — not a promise of marketing artifacts already produced.
**Title:** Demo video script (≈2 minutes)
**Summary:** **Audience:** prospects and executive sponsors who cannot self-host the API before a call. **Grounding:** [V1_SCOPE.md](../library/V1_SCOPE.md) Pilot layer only; no V1.1-only connectors. | Time | Scene | Operator UI route(s) | VO (voiceover, ~300 words total) | Visual | |------|--------|----------------------|-----------------------------------|--------| | 0:00–0:15 | Opening | Marketing or operator home | "Enterprise architecture review is still slow, inconsistent, and hard to prove. ArchLucid turns a structured request into governed, auditable outputs you can diff and replay." | Split: messy wiki slide vs clean manifest table (static slide ok). | | 0:15–0:35 | Create run — wizard | `/runs/
**Headings:** Demo video script (≈2 minutes); Storyboard (timing); Recording instructions; Acceptance checklist

#### `go-to-market/DEMO_WORKSPACES.md`
**Scope:** **Scope:** Evaluator-facing demo workspaces (Workspace A Product Tour, Workspace B synthetic regulated storyline, stable URLs, scope headers, and export hints).
**Title:** Demo workspaces (go-to-market)
**Summary:** | Surface | Workspace | Repository wiring | |---------|-----------|-------------------| | **Landing / welcome — secondary CTA “Try the self-demo”** (improvement **#32**) | **Workspace A** (product tour run) | `archlucid-ui`: [`SelfDemoRequestCta.tsx`](../../archlucid-ui/src/components/marketing/SelfDemoRequestCta.tsx), [`build-self-demo-cta-href.ts`](../../archlucid-ui/src/lib/marketing/build-self-demo-cta-href.ts), env **`NEXT_PUBLIC_SELF_DEMO_URL`** — defaults to legacy `/runs/{ProductTour}` which **301**s to **`/reviews/...`** (see below). Deployments should set **`NEXT_PUBLIC_SELF_DEMO_URL`** explicitly for staging/production hostnames when it must be absolute. | | **Post-registration on
**Headings:** Demo workspaces (go-to-market); Cross-navigation (marketing + onboarding); Staging / production URLs (patterns and owner-owned hosts); Tenant bootstrap (Sales + Marketing); Resetting / re-seeding (staging refreshes); Living fixtures — maintenance and PR discipline; Synthetic naming and PII hygiene; From repo root — extend patterns thoughtfully for your org's PII fingerprints.

#### `go-to-market/DPA_TEMPLATE.md`
**Scope:** **Scope:** Data Processing Agreement (DPA) — Template (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** Data Processing Agreement (DPA) — Template (ArchLucid)
**Summary:** **Important — not legal advice:** This document is a **working template** for negotiation with customers. It **does not** constitute legal advice. **Qualified legal counsel** must review and adapt it before execution. **Parties:** Complete legal names and registered addresses before execution (see §10A). | Role | Party | |------|--------| | **Controller** | `<<Controller legal name and address>>` | | **Processor** | `<<Processor legal name and address>>` | **Effective date:** `<<YYYY-MM-DD>>` **Reference:** `<<Subscription or order form ID>>` - **“Personal Data”** means any information relating to an identified or identifiable natural person processed by Processor on behalf of Controller und
**Headings:** Data Processing Agreement (DPA) — Template (ArchLucid); 1. Definitions; 2. Scope and roles; 3. Categories of data subjects; 4. Categories of Personal Data; 5. Duration; 6. Processor obligations; 7. International transfers

#### `go-to-market/ENTERPRISE_COMPARISON_ONE_PAGE.md`
**Scope:** **Scope:** Enterprise procurement comparison — one-page buyer-facing summary; cites approved positioning only.
**Title:** ArchLucid — enterprise comparison (one page)
**Summary:** **Audience:** procurement, IT architecture, and security reviewers comparing ArchLucid to legacy EA / GRC platforms. **Objective:** Summarize the dimensions buyers care about without uncited vendor internals. Competitor columns should paraphrase only your approved positioning matrix (`docs/go-to-market/COMPETITIVE_LANDSCAPE.md` §2.1). | Dimension | ArchLucid | Incumbent / manual baseline | |-----------|-----------|-----------------------------| | Time-to-first committed architecture run | Guided operator path + deterministic demo surfaces for procurement | Often weeks of tenant setup before a credible demo | | Evidence and traceability | Golden manifest, artifacts, exports, audit events scop
**Headings:** ArchLucid — enterprise comparison (one page); Comparison matrix (themes); Footnote

#### `go-to-market/EXECUTIVE_ONE_EMAIL_KIT.md`
**Scope:** **Scope:** Go-to-market — one-email sponsor/procurement kit (copy-paste blocks); not a second buyer narrative, price sheet, or legal commitment.
**Title:** Executive one-email kit
**Summary:** **Audience:** Sponsor or procurement contact who needs a **single outbound email** with a tight summary and a short vendor-evidence checklist. **Rules:** Summary claims are grounded only in **[V1_SCOPE.md](../library/V1_SCOPE.md)** and **[POSITIONING.md](POSITIONING.md)**. **No list prices** here — commercial list language stays single-sourced in **[PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md)**.
**Headings:** Executive one-email kit; 1. Subject line options (copy one); 2. Executive summary (~120 words, paste into body); 3. Ask the vendor for these four artifacts; Related

#### `go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`
**Scope:** **Scope:** ArchLucid Executive Sponsor Brief - full detail, tables, and links in the sections below.
**Title:** ArchLucid Executive Sponsor Brief
**Summary:** **Audience:** CIOs, CTOs, chief architects, architecture review sponsors, governance leaders, and pilot sponsors who need a concise explanation of what ArchLucid does and why a pilot matters. **Status:** Sponsor-facing V1 summary. This brief is grounded in what the current product supports today. It is not a pricing sheet and it does not claim enterprise-wide transformation. This file is the outward **sponsor story of record**: why a pilot matters, what success should look like in plain language, and what not to over-claim. Other docs and go-to-market pages should align here rather than grow a second buyer story. Use the related links for ROI measurement, packaging semantics, operator motion
**Headings:** ArchLucid Executive Sponsor Brief; Related; 1. What ArchLucid is; 2. What problem it solves; 3. Core Value Pillars; Pillar 1: AI-native architecture analysis; Pillar 2: Auditable decision trail; Pillar 3: Enterprise governance

#### `go-to-market/HEALTHCARE_VERTICAL_BRIEF.md`
**Scope:** **Scope:** Healthcare / Medicare–adjacent **sales and architecture** positioning — not legal advice, not a compliance attestation. For procurement posture, see [`trust-center.md`](trust-center.md) and in-repo DPA/MSA templates.
**Title:** Healthcare vertical — architecture brief (starter)
**Summary:** **Audience:** Field architects and sponsors describing ArchLucid next to **Medicare / Medicaid–adjacent** systems. **BAA, PHI, and attestation** questions belong in **contract** and **trust-center** copy — not in this file as claims. **Last reviewed:** 2026-04-27 ArchLucid helps teams produce **reviewable architecture manifests, findings, and governance evidence** for systems *you describe* in briefs and structured context. It is **not** an EHR, claims system, or clinical data store. **Do not upload PHI** into briefs or free-text context; use de-identified or architectural descriptions only. Contractual and BAA paths → **`sales@archlucid.net`**. | Concern | How teams usually frame it in an a
**Headings:** Healthcare vertical — architecture brief (starter); Product fit (one paragraph); Medicare / Medicaid–adjacent integration (patterns, not an implementation spec); Minimum HIPAA *program* control mapping (illustrative); Related

#### `go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md`
**Scope:** **Scope:** How buyers and field teams obtain the ArchLucid procurement documentation ZIP.
**Title:** How to request the procurement pack
**Summary:** - **Buyers / procurement** requesting a single documentation drop. - **Sales engineering / customer success** assembling a diligence bundle without hand-picking Markdown paths. From a clone of the ArchLucid repository (with the .NET SDK and **Python 3** installed):
**Headings:** How to request the procurement pack; Who this is for; One command (recommended); Validate without writing a ZIP (CI / pre-commit); Release / buyer drop — marker strictness; Script-only (advanced); Deal-ready preflight (recommended before sending to buyer); After generating the ZIP

#### `go-to-market/IDEAL_CUSTOMER_PROFILE.md`
**Scope:** **Scope:** ArchLucid — Ideal Customer Profile (ICP) - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Ideal Customer Profile (ICP)
**Summary:** **Audience:** Sales, marketing, and product teams who need to qualify leads quickly and focus on high-probability opportunities. **Last reviewed:** 2026-04-15 **Grounding:** Derived from [BUYER_PERSONAS.md](BUYER_PERSONAS.md), [ROI_MODEL.md](ROI_MODEL.md) (break-even at ~180 architect-hours/year), and [COMPETITIVE_LANDSCAPE.md](COMPETITIVE_LANDSCAPE.md). The ICP describes the **company profile** where ArchLucid delivers **maximum value** and has the **highest win probability** in V1. Qualifying against the ICP prevents wasted effort on poor-fit prospects. | Criterion | Ideal range | Reasoning | |-----------|------------|-----------| | **Company size** | 500–10,000 employees | Large enough to
**Headings:** ArchLucid — Ideal Customer Profile (ICP); 1. Definition; 2. Firmographic criteria; 3. Behavioral / situational criteria; 4. Disqualifiers (poor fit for V1); 5. ICP scoring matrix; 6. Persona mapping; Related documents

#### `go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md`
**Scope:** **Scope:** ArchLucid — Incident communications policy - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Incident communications policy
**Summary:** **Audience:** Customers and internal operators; complements internal runbooks (not duplicated here). **Last reviewed:** 2026-04-15 **Canonical assurance wording:** [ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md) This policy describes how ArchLucid classifies service and security incidents and **communicates** with customers in a **SaaS** context. It aligns with correlation and support practices in [../CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md) and service objectives in [../API_SLOS.md](../library/API_SLOS.md). - Provide **timely**, **accurate** incident communication. - Separate **service availability** incidents from **security** incidents (persona
**Headings:** ArchLucid — Incident communications policy; 1. Objective; 2. Severity classification; 3. Communication timelines (service incidents); 4. Security incidents and personal data breaches; 5. Customer responsibilities; 6. Post-incident review (internal); 7. Escalation contacts

#### `go-to-market/INTEGRATION_CATALOG.md`
**Scope:** **Scope:** ArchLucid — Integration catalog — buyer-facing narrative, roadmap table, and links. Per-connector **status, direction, auth, secrets, code entry points, tests, and smoke** live in [`../library/CONNECTOR_READINESS_MATRIX.md`](../library/CONNECTOR_READINESS_MATRIX.md).
**Title:** ArchLucid — Integration catalog
**Summary:** **Audience:** Technical evaluators and integration engineers assessing how ArchLucid connects to their ecosystem. **Last reviewed:** 2026-05-05 — **Jira**, **ServiceNow**, **Slack**, and **Confluence** first-party surfaces in **V1** ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13–§2.15). V1 copy-paste recipes unchanged under `docs/integrations/recipes/`. **Engineering order:** **ServiceNow** → **Confluence** → **Jira** — **Atlassian** (**Confluence** + **Jira**) is **one workstream**, **Confluence** first (*Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)* in [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)); supersedes prior ServiceNow → Jira → Confluence or
**Headings:** ArchLucid — Integration catalog; 1. Available today (V1); V1 committed — first-party ITSM connectors; V1 committed — Slack and Confluence; Sequencing and CMDB; Authentication for integrations; 2. Planned connectors [Roadmap]; V1 supported patterns (copy-paste recipes)

#### `go-to-market/MARKETPLACE_PUBLICATION.md`
**Scope:** **Scope:** Operators and GTM owners publishing the transactable Azure Marketplace SaaS offer; not webhook protocol deep-dive (see linked billing docs).
**Title:** Azure Marketplace — publication checklist (operator)
**Summary:** Track **Partner Center** and repository steps so a transactable SaaS offer can go live without ad-hoc gaps. Technical webhook behavior is documented in [AZURE_MARKETPLACE_SAAS_OFFER.md](../AZURE_MARKETPLACE_SAAS_OFFER.md) and [BILLING.md](../library/BILLING.md). 1. **Microsoft Partner Center** account in **Commercial Marketplace** program — **seller / legal verification complete** (**owner-recorded**). 2. **Landing page URL** aligned with `Billing:AzureMarketplace:LandingPageUrl` (accepts query parameters documented in [AZURE_MARKETPLACE_SAAS_OFFER.md](../AZURE_MARKETPLACE_SAAS_OFFER.md)). 3. **Webhook URL** reachable from Microsoft: `https://<api-host>/v1/billing/webhooks/marketplace` with
**Headings:** Azure Marketplace — publication checklist (operator); Objective; Preconditions (owner); Publication steps; Default Azure region; Blockers requiring human owner

#### `go-to-market/MSA_TEMPLATE.md`
**Scope:** **Scope:** Master Service Agreement template — internal starting point for sales-led contract negotiation; not legal advice; owner must review with counsel before external use.
**Title:** ArchLucid — Master Service Agreement (Template)
**Summary:** **Important — not legal advice:** This is a **working template** to accelerate sales-led contract negotiation. It **does not** constitute legal advice. **Qualified legal counsel** must review and adapt it before execution with any customer. **Last reviewed:** 2026-04-26 | Term | Meaning | |------|---------| | **"Agreement"** | This MSA together with all Order Forms, DPA, SLA, and policies incorporated by reference. | | **"Customer"** | The legal entity identified in the Order Form. | | **"Vendor"** | [ArchLucid vendor legal entity]. | | **"Services"** | The ArchLucid cloud platform, including API, operator UI, agent pipeline, and related hosted functionality, as described in the applicable O
**Headings:** ArchLucid — Master Service Agreement (Template); 1. Definitions; 2. Grant of access; 3. Customer obligations; 4. Fees and payment; 5. Term and termination; 6. Data handling; 7. Service levels

#### `go-to-market/NOT_A_FIT.md`
**Scope:** **Scope:** When ArchLucid is *not* a fit (blunt filter) - full detail, tables, and links in the sections below.
**Title:** When ArchLucid is *not* a fit (blunt filter)
**Summary:** **Purpose:** Save buyers and our team time. Disqualify early; do **not** promise roadmap to close bad-fit deals. - Teams that **only** need **diagrams** or **wiki pages** with **no** intention to adopt a **manifest-led** workflow. - Organizations that **cannot** use **Azure** (hosting, identity, or data residency) for a pilot **and** will not accept a **bring-your-own-Azure** model aligned to [../FIRST_AZURE_DEPLOYMENT.md](../library/FIRST_AZURE_DEPLOYMENT.md). - Buyers expecting **100% automated compliance sign-off** — ArchLucid produces **evidence and structured outputs**; **human accountability** remains (see [EXECUTIVE_SPONSOR_BRIEF.md](EXECUTIVE_SPONSOR_BRIEF.md)). - **Unacceptable** te
**Headings:** When ArchLucid is *not* a fit (blunt filter); Product / scope; Security / compliance posture; Commercial / maturity; When to re-open the conversation

#### `archive/gtm-internal/OPENAI_UI_SCREENSHOT_ASSESSMENT_PROMPT.md`
**Scope:** **Scope:** External (e.g., ChatGPT) UI assessment prompt — screenshot review for commercial demo credibility only; not product architecture or API contracts.
**Title:** OpenAI UI screenshot assessment prompt (ArchLucid)
**Summary:** Paste the block below as the user message when submitting a new batch of ArchLucid UI screenshots. Update the **Screenshot capture** subsection first so it matches how the batch was actually captured.
**Headings:** OpenAI UI screenshot assessment prompt (ArchLucid); Context you must use before evaluating; What to assess; What to focus on; What to avoid; API / data concerns (separate section)

#### `go-to-market/OPERATIONAL_TRANSPARENCY.md`
**Scope:** **Scope:** ArchLucid — Operational transparency plan - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Operational transparency plan
**Summary:** **Audience:** Product and engineering teams planning the public status page; buyers who ask "how will we know if the service is down?" **Last reviewed:** 2026-04-15 SaaS buyers — especially in enterprise and regulated environments — need confidence that service disruptions will be **visible**, **communicated**, and **resolved transparently**. A public status page is table stakes for trust. The [Incident Communications Policy](INCIDENT_COMMUNICATIONS_POLICY.md) defines **what** we communicate; this document defines **where** and **how**. | Option | Pros | Cons | Cost | |--------|------|------|------| | **Atlassian Statuspage** | Industry standard, subscriber notifications, API, components/gro
**Headings:** ArchLucid — Operational transparency plan; 1. Why; 2. Status page options; 3. Components to track; 4. Mapping to incident severity; 5. Integration points; 6. Implementation plan; 7. Status URL alignment references

#### `go-to-market/ORDER_FORM_TEMPLATE.md`
**Scope:** **Scope:** ArchLucid — Subscription order form (template) - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Subscription order form (template)
**Summary:** **Important — not legal advice:** This is a **working template** to reduce friction for SMB-midmarket deals (< $50K ARR). It **does not** constitute legal advice. **Qualified legal counsel** must review and adapt it before use. **Last reviewed:** 2026-04-22 **Pricing source:** All current list prices (platform fee, seat price, run overage, pilot fee) are in [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md). The worked examples in this document compute totals from those locked prices — the numbers are derived here for convenience, but the prices themselves live only in that file. The CI guard `scripts/ci/check_pricing_single_source.py` allows price literals in this file. | Role | Detail | |--
**Headings:** ArchLucid — Subscription order form (template); 1. Parties; 2. Subscription details; 3. Run overage; Run overage worked example — Professional at 150 % of included allowance; 4. Worked pricing examples; Example A — Team tier, 3 seats, 1 workspace, monthly billing; Example B — Professional tier, 8 seats, 1 workspace, monthly billing

#### `go-to-market/OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md`
**Scope:** **Scope:** Owner security self-assessment — procurement pack excerpt (no customer names).
**Title:** Owner-conducted security assessment — procurement excerpt
**Summary:** This document is the **buyer-shareable excerpt** for procurement bundles. It summarizes the **same programme** as the in-repo canonical file [`../security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md`](../security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md) but **must not** be edited with customer-specific names in the pack — use `PROCUREMENT_PACK_COVER.md` for deal context only. - **Is:** Internal **owner / engineering** security self-assessment structured for transparency until third-party artefacts exist. - **Is not:** A SOC 2 report, ISO certificate, or third-party penetration-test result. 1. **Automated CI gates** — SAST, dependency and container scanning, contract testing, secret scanning, and docum
**Headings:** Owner-conducted security assessment — procurement excerpt; What this is (and is not); Method (summary); Full draft under NDA

#### `go-to-market/PEN_TEST_SUMMARY_PROCUREMENT_INTERIM.md`
**Scope:** **Scope:** Penetration test summary — procurement interim statement (no third-party test results claimed).
**Title:** Penetration test summary — interim statement
**Summary:** **Status:** **Pending — Q2 2026 third-party engagement** (owner-funded external assessor per [`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) item **20**). ArchLucid does **not** represent this file as a completed penetration test. When a redacted customer-facing summary exists, it will be published under [`docs/security/pen-test-summaries/`](../security/pen-test-summaries/README.md) and surfaced via the operator **Security & trust** workflow described in [`TRUST_CENTER.md`](TRUST_CENTER.md). **Templates available today:** [`../security/PEN_TEST_SOW_TEMPLATE.md`](../security/PEN_TEST_SOW_TEMPLATE.md), [`../security/PEN_TEST_REDACTED_SUMMARY_TEMPLATE.md`](../security/PEN_TEST_REDACTED_S
**Headings:** Penetration test summary — interim statement

#### `go-to-market/PILOT_BUYER_SAFE_EVIDENCE_TEMPLATE.md`
**Scope:** **Scope:** Buyer-safe pilot evidence capture — anonymized fields, no fabricated numerics, cross-links to PMF tracker and ROI model; internal and NDA channels only unless policy says otherwise.
**Title:** Pilot evidence — buyer-safe capture template
**Summary:** **Audience:** Pilot leads filling **Pilot A / B / …** rows in [PMF_VALIDATION_TRACKER.md](archive/gtm-internal/PMF_VALIDATION_TRACKER.md) and sponsor packs in [PILOT_ROI_MODEL.md](../library/PILOT_ROI_MODEL.md) / [PROOF_OF_VALUE_SNAPSHOT.md](../library/PROOF_OF_VALUE_SNAPSHOT.md). **Rules:** - Use **Pilot A**, **Pilot B** identifiers in shared docs — map to real programs only in restricted systems (CRM, charter). - **Do not** invent **Baseline** or **Result** numerics. Use **TBD** until measured, **See scorecard** for qualitative capture per [PMF_VALIDATION_TRACKER.md](archive/gtm-internal/PMF_VALIDATION_TRACKER.md) §2.2, or **Unknown** when deliberately not measured (note why). - Redact tenant, people, and identifiable quotes befor
**Headings:** Pilot evidence — buyer-safe capture template; Evidence row (copy per hypothesis / pilot); Afterward

#### `go-to-market/PILOT_SUCCESS_SCORECARD.md`
**Scope:** **Scope:** ArchLucid pilot success scorecard - full detail, tables, and links in the sections below.
**Title:** ArchLucid pilot success scorecard
**Summary:** **Audience:** Pilot champions, architecture team leads, and sales engineers who need to measure whether a pilot succeeded — and present the results to leadership for a purchase decision. **Last reviewed:** 2026-04-15 **Grounding rule:** Metrics reference shipped V1 capabilities per [V1_SCOPE.md](../library/V1_SCOPE.md) and existing data collection per [PRODUCT_LEARNING.md](../library/PRODUCT_LEARNING.md). This scorecard defines **what to measure, when to measure it, and what "good" looks like** during an ArchLucid pilot. Use it alongside the [ROI_MODEL.md](ROI_MODEL.md) to translate pilot results into a business case. Measure these before the pilot (baseline) and at pilot end (actual). The d
**Headings:** ArchLucid pilot success scorecard; 1. Purpose; 2. Quantitative metrics; 2.1 Efficiency metrics; 2.2 Quality metrics; 2.3 Governance metrics; 2.4 Operational metrics; 3. Qualitative metrics

#### `archive/gtm-internal/PMF_VALIDATION_TRACKER.md`
**Scope:** **Scope:** ArchLucid — Product-market fit validation tracker - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Product-market fit validation tracker
**Summary:** **Audience:** Product, sales, and leadership teams validating PMF hypotheses with pilot evidence. **Last reviewed:** 2026-05-01 This is a **living document**. Use **anonymous pilot identifiers** only (**Pilot A**, **Pilot B**, …)—never customer, company, or employee names here. Populate rows as pilots execute; aggregate into §6 after synthesis. **Measurement grounding:** Numeric and qualitative pilot measures align with **[PILOT_ROI_MODEL.md](../library/PILOT_ROI_MODEL.md)** — **§3** (baseline before the pilot), **§4** (during the pilot), and **§4.1** (primary pilot metrics table: time to committed manifest, findings, LLM calls, audit rows, etc.). The PMF scorecard columns below are a **hypo
**Headings:** ArchLucid — Product-market fit validation tracker; 1. PMF hypotheses; 2. Evidence tracker; 2.1 Identifiers and population cadence; 2.2 Column semantics (Pending / Unknown / TBD); 2.3 Evidence rows; 3. Ethics / confidentiality (pre–reference-customer); 4. Synthesis rules

#### `go-to-market/POSITIONING.md`
**Scope:** **Scope:** ArchLucid positioning - full detail, tables, and links in the sections below.
**Title:** ArchLucid positioning
**Summary:** **Audience:** Anyone who needs to explain what ArchLucid is and why it matters — in a sentence, a paragraph, or a two-minute conversation. **Last reviewed:** 2026-05-07 **Grounding rule:** Every claim maps to a shipped V1 capability. See [V1_SCOPE.md](../library/V1_SCOPE.md) and [COMPETITIVE_LANDSCAPE.md](COMPETITIVE_LANDSCAPE.md) for evidence. **Relationship to the sponsor brief:** [EXECUTIVE_SPONSOR_BRIEF.md](EXECUTIVE_SPONSOR_BRIEF.md) is the **dominant outward-facing buyer narrative**. This page supports **short explanations and proof-backed pillars** for conversations and datasheets; it must **not contradict** the brief. If wording here drifts broader than the brief, **tighten here** or
**Headings:** ArchLucid positioning; 1. Positioning statement; 2. Three value pillars; Pillar 3: Enterprise governance; 3. Elevator pitches; 4. Key proof points from the codebase; 5. Category definition; 6. Taglines (options for testing)

#### `go-to-market/PRICING_PHILOSOPHY.md`
**Scope:** **Scope:** ArchLucid — Pricing philosophy and packaging - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Pricing philosophy and packaging
**Summary:** **Audience:** Product leadership, sales, and finance — internal alignment before external pricing publication. **Last reviewed:** 2026-05-01 (interim Stripe Team bundled monthly — § 3.2) **Grounding:** Pricing anchors to the ROI model in [ROI_MODEL.md](ROI_MODEL.md) (break-even at ~180 architect-hours/year) and buyer personas in [BUYER_PERSONAS.md](BUYER_PERSONAS.md). **Single source of truth:** All price figures live **only** in this file, [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md), [TRIAL_AND_SIGNUP.md](TRIAL_AND_SIGNUP.md), and [docs/CHANGELOG.md](../CHANGELOG.md). Every other doc must **link here** rather than restate numbers; the CI check `scripts/ci/check_pricing_single_source.py
**Headings:** ArchLucid — Pricing philosophy and packaging; 1. Pricing principles; 2. Pricing model evaluation; 3. Packaging tiers; Tier overview; Feature gates; 3.1 Canonical Marketplace tier names; 3.2 Interim Stripe Team self-serve (bundled SKU)

#### `go-to-market/PRIVACY_POLICY.md`
**Scope:** **Scope:** Public-facing privacy policy for archlucid.net visitors and ArchLucid product users. Covers GDPR and CCPA. Not legal advice — owner has reviewed and approved; no external law firm engagement.
**Title:** ArchLucid Privacy Policy
**Summary:** <!-- PRIVACY_POLICY_LAST_REVIEWED_UTC:2026-05-10 --> **Effective date:** 2026-04-26 **Last reviewed (UTC):** 2026-05-10 This privacy policy describes how ArchLucid ("we", "us", "our") collects, uses, shares, and protects personal information when you visit our website at `archlucid.net` or use the ArchLucid platform (the "Service"). It applies to all visitors, trial users, and paying customers. For operator-facing processing activity records (GDPR Article 30), see [`docs/security/PRIVACY_NOTE.md`](../security/PRIVACY_NOTE.md). For data processing agreement terms, see [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md). ArchLucid is a B2B SaaS platform that provides AI-assisted architecture workflow tools.
**Headings:** ArchLucid Privacy Policy; 1. Who we are; 2. What personal information we collect; 2.1 Information you provide directly; 2.2 Information collected automatically; 2.3 Information we do not collect (defaults); 2.4 Optional marketing analytics (Microsoft Clarity); 3. How we use personal information

#### `go-to-market/PROCUREMENT_EVIDENCE_PACKET.md`
**Scope:** **Scope:** One-page procurement evidence packet for V1 buyer diligence. This is a concise routing artifact, not a new assurance claim, certification, or product promise.
**Title:** Procurement evidence packet
**Summary:** **Audience:** Procurement reviewers, security reviewers, GRC teams, architecture sponsors, and enterprise buyers who need to understand what ArchLucid V1 proves, which evidence exists, and which items are explicitly deferred. **Use this when:** A buyer asks, "What can I give my CIO, security team, architecture review board, or procurement committee so they can evaluate ArchLucid without reading the whole repository?" **Buyer-safe rule:** This packet only points to existing evidence. It does **not** claim SOC 2 Type II, a third-party penetration test, a published public reference customer, live Stripe production transactability, or a published Marketplace offer unless a linked source explicit
**Headings:** Procurement evidence packet; 1. One-page buyer summary; 2. What V1 proves; 3. Procurement reviewer checklist; 4. Evidence map by stakeholder; CIO / CTO / executive sponsor; Architecture review board / chief architect; Security / GRC / procurement

#### `go-to-market/PROCUREMENT_EVIDENCE_PACK_INDEX.md`
**Scope:** **Scope:** Index of reviewer-facing procurement and assurance artifacts — navigation only; not legal advice.
**Title:** Procurement evidence pack — index
**Summary:** > > **Canonical buyer evidence table:** **[`PROCUREMENT_PACK_INDEX.md`](PROCUREMENT_PACK_INDEX.md)** — CI-validated columns (evidence type, freshness, paths, buyer-safe claims). **Fast skim:** [`PROCUREMENT_FAST_LANE.md`](PROCUREMENT_FAST_LANE.md) (subset of the same source paths). **Audience:** Security reviewers, procurement, and GRC contacts evaluating ArchLucid. **Purpose:** Single checklist of **available** artifacts and **planned** attestations without restating SOC 2 roadmaps verbatim. | Artifact | Location | Notes | |-----------|----------|--------| | Security overview | [docs/library/SECURITY.md](../library/SECURITY.md) | Threat surface, scanning, auth modes | | STRIDE summary | [do
**Headings:** Procurement evidence pack — index; Governance and security posture; Commercial and legal drafts; Operational transparency; What is intentionally not bundled here

#### `go-to-market/PROCUREMENT_FAQ.md`
**Scope:** **Scope:** Procurement FAQ for enterprise buyers — honest answers anchored to shipped V1 materials; not legal advice.
**Title:** Procurement FAQ (Enterprise)
**Summary:** **Audience:** procurement, InfoSec questionnaires, resilience reviews preparing **SOC 2** / SIG / CAIQ spreadsheets. **Evidence index:** **[trust-center.md](trust-center.md)** **Canonical assurance wording:** **[ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md)** **SIG / CAIQ row acceleration:** **[PROCUREMENT_RESPONSE_ACCELERATOR.md](PROCUREMENT_RESPONSE_ACCELERATOR.md)** — fifty Shared-Assessments-style prompts mapped to **in-repo** evidence links and honesty labels (**Implemented / Self-asserted / In flight / Deferred V1.1**); **SOC 2 Type II “issued” is not claimed** there—see **[SOC2_STATUS_PROCUREMENT.md](SOC2_STATUS_PROCUREMENT.md)**. **Answer:** Today we publish a **SOC 2
**Headings:** Procurement FAQ (Enterprise); Q & A; 1. Do you have SOC 2 Type II?; 2. Can we see the latest penetration-test report?; 3. Where is customer **data processed / stored**?; 4. Can we authenticate with **Okta / Ping / Auth0** instead of Microsoft Entra ID?; 5. What **SLA** do you publish?; 6. Can we execute the **Data Processing Agreement**?

#### `go-to-market/PROCUREMENT_FAST_LANE.md`
**Scope:** **Scope:** Five-minute procurement skim — outbound links duplicate **`PROCUREMENT_PACK_INDEX.md`** and the buyer **`docs/go-to-market/trust-center.md`** index only (no artefacts beyond those inventories). Claims here are labels, not attestations; **legal-only** artefacts are explicitly **template-only** until executed.
**Title:** Procurement fast lane
**Summary:** **Audience:** Procurement and security reviewers with a short clock. **How to use:** Open the canonical table for full buyer-safe wording and freshness columns: **`[PROCUREMENT_PACK_INDEX.md](PROCUREMENT_PACK_INDEX.md)`** — CI enforces link resolution, review-date budgets on **Implemented** / **Self-asserted** rows, and placeholder/assurance wording (see **`scripts/ci/check_procurement_pack_index.py`**). Use the **`Procurement artifact status map`** section there for spreadsheet-friendly **`Status`** tokens (`Implemented`, `Self-attested`, `Template`, `Deferred`, `Not applicable`, `External/NDA-gated`). Use **`[trust-center.md](trust-center.md)`** for web/posture summaries. Spreadsheet-align
**Headings:** Procurement fast lane

#### `go-to-market/PROCUREMENT_OBJECTION_PLAYBOOK.md`
**Scope:** **Scope:** High-frequency procurement objection responses with approved short/long answers, evidence links, and escalation triggers; designed to reduce deal-cycle friction while avoiding over-claims.
**Title:** Procurement Objection Playbook
**Summary:** **Audience:** Sales engineering, security contacts, and procurement responders. **Last reviewed:** 2026-05-01 - Use the short answer first. - Expand with the long answer when reviewers request detail. - Escalate when the trigger condition is met. - Keep claims aligned with `ASSURANCE_STATUS_CANONICAL.md`. - **Short answer:** No. We provide a SOC2 self-assessment and technical evidence pack; external attestation is not currently issued. - **Long answer:** SOC2 Type II is not issued. Current posture is explicit self-assessment plus control evidence in-repo. We do not represent this as a CPA opinion. - **Evidence:** [SOC2_STATUS_PROCUREMENT.md](SOC2_STATUS_PROCUREMENT.md), [../security/SOC2_SEL
**Headings:** Procurement Objection Playbook; Usage; Objections; 1) "Do you have SOC2 Type II today?"; 2) "Where is the third-party pen-test report?"; 3) "Your DPA has placeholders. Is it executable?"; 4) "How do we know incident communication is real?"; 5) "What are your data residency commitments?"

#### `go-to-market/PROCUREMENT_PACK_COVER.md`
**Scope:** **Scope:** Procurement pack cover letter — **owner-completed scaffold only** (no deal-specific names in repo).
**Title:** Procurement pack — cover letter (scaffold)
**Summary:** **Instructions (owner / sales engineering):** Duplicate this file **outside** the repository (or into a non-committed attachment) before adding **customer name**, **deal ID**, **DPA effective date**, and **contact emails**. **Do not** commit buyer-specific names into `main` without legal approval. Date: `<<YYYY-MM-DD>>` To: `<<PROCUREMENT_TEAM_OR_LEGAL>>` Subject: ArchLucid — security & compliance documentation pack Body scaffold: 1. **Purpose** — Attached / linked ZIP (`manifest.json` lists SHA-256 for every file) assembled from ArchLucid’s public engineering documentation set. 2. **What is included** — Policies, tenant isolation (RLS), audit coverage matrix, integration catalogue, API cont
**Headings:** Procurement pack — cover letter (scaffold)

#### `archive/gtm-internal/PROCUREMENT_PACK_DRYRUN_RESULTS.md`
**Scope:** **Scope:** Single-pass dry-run audit of the canonical buyer procurement ZIP (synthetic enterprise questionnaire lens). **Not** CPA, SIG, or STAR registry submission — operational notes for owners only.
**Title:** Procurement pack dry-run results (2026-05-11)
**Summary:** - **Command:** `python scripts/build_procurement_pack.py` (same pipeline as `archlucid procurement-pack`) with **`--strict`** after edits. - **Output inspected:** flat list under `dist/procurement-pack/` and **`manifest.json`** inside the bundle (30 tracked Markdown/text/JSON entries plus generated **`README.md`**, **`manifest.json`**, **`versions.txt`**, **`redaction_report.md`**, **`artifact_status_index.json`**, **`ARTIFACT_STATUS_INDEX.md`**). - **Pre-fill inputs cited in the assessment brief:** the repository uses **`docs/security/CAIQ_LITE_2026.md`** and **`docs/security/SIG_CORE_2026.md`** (there are no `docs/go-to-market/caiq-lite-prefill.*` or `sig-core-prefill.*` files today). Both
**Headings:** Procurement pack dry-run results (2026-05-11); What was exercised; Placeholder / marker scan; CAIQ Lite v4 cross-check; SIG Core cross-check; DPA template; Internal links (ZIP-only reviewer); Packaging / provenance files

#### `go-to-market/PROCUREMENT_PACK_INDEX.md`
**Scope:** **Scope:** Single canonical procurement evidence index — file paths are source of truth for CI; statuses are buyer-safe labels aligned with **`PROCUREMENT_RESPONSE_ACCELERATOR.md`**, not attestations. The **Procurement artifact status map** below uses a fixed vocabulary (`Implemented`, `Self-attested`, `Template`, `Deferred`, `Not applicable`, `External/NDA-gated`) enforced by **`scripts/ci/check_procurement_pack_index.py`** (links, **90-day** freshness on **Implemented** / **Self-asserted** canonical rows, buyer-placeholder strictness, and forbidden assurance wording). Release operators: **`docs/library/RELEASE_EVIDENCE_SUMMARY.md`** §8.
**Title:** Procurement evidence pack — buyer index (canonical)
**Summary:** **Audience:** Security, procurement, and GRC reviewers. **How to cite:** Prefer **Evidence Artifact** titles and **`Source File`** links below rather than improvising statuses in questionnaires. Use **`trust-center.md`** for high-level posture; use this file for granular artifact inventory. **Five-minute skim (same paths as this table):** [`PROCUREMENT_FAST_LANE.md`](PROCUREMENT_FAST_LANE.md). Use this table for RFP spreadsheets and security portals that need a **single status column**. Labels are **not** attestations: **Deferred** items follow **[`V1_DEFERRED.md`](../library/V1_DEFERRED.md)** (especially **section 6c** for assurance). **Template** means legal or vendor execution is still re
**Headings:** Procurement evidence pack — buyer index (canonical); Procurement artifact status map (buyer-safe classification)

#### `go-to-market/PROCUREMENT_RESPONSE_ACCELERATOR.md`
**Scope:** **Scope:** Procurement questionnaire accelerator — fifty SIG-themed prompts mapped **only** to in-repo evidence links; statuses are labels, not attestations.
**Title:** Procurement response accelerator
**Summary:** > > **Canonical procurement artefact/status table:** **[`PROCUREMENT_PACK_INDEX.md`](PROCUREMENT_PACK_INDEX.md)** — CI validates paths, **Implemented** review-age freshness, and **Procurement artifact status map** tokens (`scripts/ci/check_procurement_pack_index.py`). **Audience:** Teams pasting questionnaire rows (SIG / CAIQ-style) into spreadsheets who need **fast, honest** citations into this repository. **How to use:** Copy the question text into customer worksheets; cite the **Evidence** links as append-only references. **`Status`** is one of **`Implemented`** (engineering / shipped behavior documented), **`Self-asserted`** (internal narrative or matrices), **`Deferred V1.1`** (deferral
**Headings:** Procurement response accelerator; Status legend; Questions (SIG-aligned families — 50 prompts); A — Governance & programme; B — Risk management & assurance; C — People & organizational security; D — Technical security controls; E — Assets, configuration & change

#### `go-to-market/PRODUCT_DATASHEET.md`
**Scope:** **Scope:** ArchLucid — Product Datasheet - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Product Datasheet
**Summary:** <!-- Layout: designed for PDF export at US Letter or A4. Keep under 2 pages rendered. --> **ArchLucid** | Architecture Proof Engine *Defensible architecture, on demand — evidence-linked reviews your architects can defend and your CTO can act on.* Architecture review in most enterprises is **slow, inconsistent, and undocumented**. Reviews depend on a small team of senior architects who apply different standards across projects. Decisions happen in meetings and emails with no durable record. Compliance gaps surface in production — or during audits — long after the design was approved. When regulators ask "who reviewed this design and what did they find?", the answer is often "we are not sure."
**Headings:** ArchLucid — Product Datasheet; The problem; The solution; Key capabilities; Architecture; Deployment options; Security and compliance; Integration points

#### `go-to-market/README.md`
**Scope:** **Scope:** Buyer-facing go-to-market index — procurement, trust, positioning, and marketplace artefacts.
**Title:** Go-to-market documentation
**Summary:** **Start here for buyers and procurement:** narrative index [`TRUST_CENTER.md`](TRUST_CENTER.md), consolidated assurance table [`trust-center.md`](trust-center.md) (mirrored in-product at **`/trust`**), sponsor story [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md), evaluation guide [`../onboarding/EVALUATION_GUIDE.md`](../onboarding/EVALUATION_GUIDE.md). **Evidence inventory:** [`PROCUREMENT_PACK_INDEX.md`](PROCUREMENT_PACK_INDEX.md) — artefact paths validated in CI (`scripts/ci/check_procurement_pack_index.py`). **Related:** [`../runbooks/README.md`](../runbooks/README.md) (operations), [`../library/DOCUMENTATION_BY_AUDIENCE.md`](../library/DOCUMENTATION_BY_AUDIENCE.md) (role rout
**Headings:** Go-to-market documentation

#### `go-to-market/REFERENCE_NARRATIVE_TEMPLATE.md`
**Scope:** **Scope:** ArchLucid — Customer reference narrative template - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Customer reference narrative template
**Summary:** **Audience:** Marketing, sales, and customer success teams creating case studies. **Last reviewed:** 2026-04-15 **Note:** The three narratives below are **fictional but realistic**, grounded in ICP criteria ([IDEAL_CUSTOMER_PROFILE.md](IDEAL_CUSTOMER_PROFILE.md)) and buyer personas ([BUYER_PERSONAS.md](BUYER_PERSONAS.md)). Replace with real customer data as pilots complete. **Alignment:** Outcomes and quotes should stay plausible against **[EXECUTIVE_SPONSOR_BRIEF.md](EXECUTIVE_SPONSOR_BRIEF.md)** and **[PILOT_ROI_MODEL.md](../library/PILOT_ROI_MODEL.md)**—especially §8 of the brief (what not to over-claim in V1). Every reference narrative follows this pattern: 1. **Customer profile** — Indu
**Headings:** ArchLucid — Customer reference narrative template; Template structure; Narrative A — Financial services: compliance-driven governance; Customer profile; Challenge; Solution; Results; Quote

#### `go-to-market/RENEWAL_EXPANSION_PLAYBOOK.md`
**Scope:** **Scope:** ArchLucid — Renewal and expansion playbook - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Renewal and expansion playbook
**Summary:** **Audience:** Customer success, account management, and sales leadership. **Last reviewed:** 2026-04-15 | Milestone | Action | Owner | |-----------|--------|-------| | **R-90 days** | Review health score ([CUSTOMER_HEALTH_SCORING.md](CUSTOMER_HEALTH_SCORING.md)); analyze usage trends; identify expansion signals | CSM | | **R-60 days** | Renewal conversation with champion; review ROI model actuals vs pilot projections ([ROI_MODEL.md](ROI_MODEL.md)); discuss tier alignment | CSM + Account Exec | | **R-30 days** | Commercial terms finalized; pricing adjustment if tier change; order form prepared ([ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md)) | Account Exec | | **Renewal date** | Signed orde
**Headings:** ArchLucid — Renewal and expansion playbook; 1. Renewal timeline (annual subscription); 2. Expansion triggers; 3. Expansion motion; 4. Churn prevention; At-risk intervention; Exit interview; Win-back

#### `go-to-market/REVIEW_CADENCE.md`
**Scope:** **Scope:** Review cadence and role ownership for buyer-facing procurement documentation, including stale-document escalation expectations.
**Title:** Procurement Documentation Review Cadence
**Summary:** **Audience:** Maintainers of procurement/trust documents and release managers. **Last reviewed:** 2026-05-01 | Document | Owner role | Review frequency | Escalation when stale | |---|---|---|---| | `TRUST_CENTER.md` | Security lead | Every 30 days | Raise in release checklist and update before procurement pack release | | `CURRENT_ASSURANCE_POSTURE.md` | Security lead | Every 30 days | Block procurement deal-ready mode until refreshed | | `SLA_SUMMARY.md` | Platform lead | Every 45 days | Escalate to product + ops owner for confirmation | | `INCIDENT_COMMUNICATIONS_POLICY.md` | Incident manager role | Every 45 days | Escalate to on-call manager; confirm channels and timelines | | `SUBPROCESS
**Headings:** Procurement Documentation Review Cadence; Cadence matrix; Process; CI linkage

#### `go-to-market/ROI_MODEL.md`
**Scope:** **Scope:** ArchLucid ROI model - full detail, tables, and links in the sections below.
**Title:** ArchLucid ROI model
**Summary:** **Audience:** Pilot champions, enterprise architects, and engineering leaders who need to justify an ArchLucid purchase to their CFO or procurement team. **Last reviewed:** 2026-04-17 **Grounding rule:** Value claims are mapped to shipped V1 capabilities per [V1_SCOPE.md](../library/V1_SCOPE.md). Estimates are conservative. Adjust all numbers to your organization's actuals. **Pricing:** Current list prices (seat, platform fee, run overage, pilot) are in [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md) — the single source of truth. The value model in this document is the input that justifies those prices; the prices themselves live only in that file. Provide a **reusable template** for build
**Headings:** ArchLucid ROI model; 1. Objective; 2. Cost of the status quo; Status quo annual cost formula; Example: 200-person engineering organization; 3. ArchLucid value model; 3.1 Review cycle time reduction; 3.2 Compliance shift-left

#### `go-to-market/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md`
**Scope:** **Scope:** Synthetic aggregate ROI bulletin sample. **FORBIDDEN (repository hygiene):** Do not append this document to `docs/CHANGELOG.md`. Do not add a `## YYYY-MM-DD — ROI bulletin signed:` section for this synthetic artefact. Sign-off audit format applies only to real published bulletins (see `docs/go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md`).
**Title:** ArchLucid — aggregate review-cycle baseline bulletin (SYNTHETIC EXAMPLE)
**Summary:** **Quarter:** Q1-2026 (illustrative label only) **Generated:** (static sample — not tied to a live SQL window) **Qualifying tenants (N):** 5 (synthetic floor matching the real minimum-N gate) | Metric | Hours | Note | |--------|------:|------| | Mean | 22.4 | synthetic example — never published as a real bulletin | | p50 | 20 | synthetic example — never published as a real bulletin | | p90 | 46 | synthetic example — never published as a real bulletin | - These figures are **illustrative** so buyers can see table shape before **N ≥ 5** paying tenants with captured baselines exist. - They are **not** ArchLucid runtime measurements and **not** SQL-sourced aggregates. - Per-run sponsor deltas (fi
**Headings:** ArchLucid — aggregate review-cycle baseline bulletin (SYNTHETIC EXAMPLE); Headline numbers (tenant-supplied baseline hours only); Interpretation guardrails; Related

#### `go-to-market/SCREENSHOT_GALLERY.md`
**Scope:** **Scope:** ArchLucid screenshot gallery — capture brief - full detail, tables, and links in the sections below.
**Title:** ArchLucid screenshot gallery — capture brief
**Summary:** **Audience:** Anyone producing screenshots for the marketing site, sales decks, product documentation, or demo recordings. **Last reviewed:** 2026-04-15 This document is a **capture brief**: it describes exactly what to show on screen, what state the data should be in, what annotations to overlay, and what caption to use. Follow it with a running ArchLucid environment (demo seed data recommended) to produce a consistent, professional screenshot set. - ArchLucid API running against SQL with **demo seed data** (`Demo:Enabled=true`, `Demo:SeedOnStartup=true`, or `POST /v1.0/demo/seed`). Fastest path: **`scripts/demo-start.ps1`** / **`scripts/demo-start.sh`** with **`docker-compose.demo.yml`** —
**Headings:** ArchLucid screenshot gallery — capture brief; Purpose; Prerequisites; Screenshot 1: First-run wizard — Preset selection; Screenshot 2: First-run wizard — Review step; Screenshot 3: Run detail with pipeline stages; Screenshot 4: Provenance graph visualization; Screenshot 5: Run comparison — structured deltas

#### `go-to-market/SEO_AND_PAID_ACQUISITION.md`
**Scope:** **Scope:** Organic search optimization and disciplined web-paid acquisition for `archlucid.net` — aligns with **`IDEAL_CUSTOMER_PROFILE.md`** and **`POSITIONING.md`**. Not procurement legal advice.
**Title:** SEO and paid web acquisition playbook
**Summary:** **Audience:** Founder, marketing, and product — deciding where to spend time vs money before measurable conversion exists. **Last reviewed:** 2026-05-10 Increase **qualified trial signups** (and eventual paid pilots) from people who fit the ICP (**`IDEAL_CUSTOMER_PROFILE.md`**) by stacking **technical crawlability**, **problem-aware content**, **honest trust pages**, and **small, measurable paid experiments** — without fragmenting infra or drifting claims beyond **`POSITIONING.md`** and **`docs/library/V1_SCOPE.md`**. - Canonical public origin **`https://archlucid.net`** ( **`ArchLucid.Core.Configuration.PublicSiteOptions`**, **`NEXT_PUBLIC_ARCHLUCID_SITE_URL`** in **`archlucid-ui`**) aligns
**Headings:** SEO and paid web acquisition playbook; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 5.1 Technical SEO; 5.2 Content SEO (discovery layer)

#### `go-to-market/SHOULD_YOU_EVALUATE.md`
**Scope:** **Scope:** One-page buyer routing — answers "Is ArchLucid right for me?" in under 2 minutes; not a substitute for the executive sponsor brief or pilot guide.
**Title:** Should you evaluate ArchLucid?
**Summary:** Work through the questions in order. **Q1.** Does your team produce architecture review packages for stakeholders? - **No** → ArchLucid may not be a fit today. See [go-to-market/NOT_A_FIT.md](go-to-market/NOT_A_FIT.md). - **Yes** → Continue. **Q2.** Do you run workloads on Azure (or plan to within 6 months)? - **No** → ArchLucid V1 targets Azure workloads. Contact us for multi-cloud roadmap. - **Yes** → Continue. **Q3.** Do you spend 20+ hours per architecture review cycle? - **No** → You may still benefit from governance and compliance features. Start with a quick scan. - **Yes** → Strong fit — proceed to evaluation. **Q4.** Do you need governance, audit trails, or compliance evidence from
**Headings:** Should you evaluate ArchLucid?; Decision tree; 15-minute evaluation path; Next reads

#### `go-to-market/SIEM_EXPORT.md`
**Scope:** **Scope:** ArchLucid — Audit log export for SIEM integration (buyer summary); full payload examples and KQL live in the library SIEM guide linked below.
**Title:** ArchLucid — Audit log export for SIEM integration
**Summary:** **Audience:** Security engineers and SOC teams evaluating ArchLucid's audit data for SIEM ingestion. **Last reviewed:** 2026-05-05 **Technical detail:** Copy-paste **Splunk HEC** and **Microsoft Sentinel / Log Analytics** JSON mappings for **audit rows** (`AuditEvent`) are in **[`../library/SIEM_EXPORT.md`](../library/SIEM_EXPORT.md)** (§4). ArchLucid maintains a **durable, append-only audit trail** in SQL (`dbo.AuditEvents`) with a typed event catalog. The catalog currently contains **81 event types** (CI-tracked; see [../library/AUDIT_COVERAGE_MATRIX.md](../library/AUDIT_COVERAGE_MATRIX.md)). Each audit event includes: | Field | Description | |-------|-------------| | `eventType` | Typed s
**Headings:** ArchLucid — Audit log export for SIEM integration; 1. What is exported; 2. Export methods available today; 3. SIEM integration patterns; Splunk; Microsoft Sentinel; Generic SIEM (scheduled pull); 4. Retention

#### `go-to-market/SLA_SUMMARY.md`
**Scope:** **Scope:** ArchLucid — Service level objectives (buyer summary) - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Service level objectives (buyer summary)
**Summary:** **Audience:** Procurement, security reviewers, and technical evaluators assessing ArchLucid's reliability commitments. **Last reviewed:** 2026-04-29 ArchLucid targets **high availability and low latency** for the production API. This document translates internal engineering objectives into buyer-readable commitments. For engineering depth (Prometheus rules, OTel metrics, burn-rate math), see [../API_SLOS.md](../library/API_SLOS.md). **Important:** These are **service level objectives** (targets), not contractual guarantees. Contractual SLA terms, including service credits, will be defined in the commercial agreement. See [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) for contract framing.
**Headings:** ArchLucid — Service level objectives (buyer summary); 1. Availability; Error rate (5xx); 2. Latency; 3. Planned maintenance; 4. Service credits; 5. Exclusions; 6. How we measure

#### `go-to-market/SOC2_ROADMAP.md`
**Scope:** **Scope:** ArchLucid — SOC 2 readiness roadmap - full detail, tables, and links in the sections below.
**Title:** ArchLucid — SOC 2 readiness roadmap
**Summary:** **Audience:** Customers, prospects, and internal GRC stakeholders. **Last reviewed:** 2026-04-15 This document describes **controls and evidence** already reflected in the product and repo, **typical gaps** for a SOC 2 Type I / II program, and a **milestone roadmap**. It is **not** an auditor’s report. **2026-04-21 — Readiness vs attestation:** **SOC 2 Type I readiness** (consultant shortlist + observation-period planning) is **in scope for Q2–Q3 2026**; a **CPA opinion** remains gated on executed attestation agreement and budget. Interim artifacts: **owner-led self-assessment** ([`../security/SOC2_SELF_ASSESSMENT_2026.md`](../security/SOC2_SELF_ASSESSMENT_2026.md)), CAIQ/SIG pre-fills, and
**Headings:** ArchLucid — SOC 2 readiness roadmap; 1. Current strengths (engineering and operations); 2. Typical gaps for SOC 2 (to close with process and policy); 3. Milestone roadmap (illustrative quarters); 4. What customers can request today; Related documents

#### `go-to-market/SOC2_STATUS_PROCUREMENT.md`
**Scope:** **Scope:** SOC 2 attestation — procurement-facing status (deferred).
**Title:** SOC 2 status (procurement statement)
**Summary:** **Last reviewed:** 2026-05-01 **Canonical wording source:** [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md) **Formal SOC 2 Type II attestation:** **Not yet issued** — programme deferred until funded CPA / assessor engagement (see [`TRUST_CENTER.md`](TRUST_CENTER.md) compliance table and [`../security/SOC2_SELF_ASSESSMENT_2026.md`](../security/SOC2_SELF_ASSESSMENT_2026.md) for interim self-assessment posture under internal ownership). **SOC 2 Type I engagement:** Not started; deferred until funded assessor engagement. Procurement teams should treat the self-assessment document as **non-attestation** evidence alongside this pack’s technical controls references (`MULTI_TENANT_R
**Headings:** SOC 2 status (procurement statement)

#### `go-to-market/STEERING_DECISION_MEMO_TEMPLATE.md`
**Scope:** **Scope:** One-page steering / ARB memo template aligned to pilot scorecard language; internal drafts only until filled by the customer team.
**Title:** Steering decision memo — ArchLucid pilot (template)
**Summary:** **Audience:** Architecture review board, IT steering, or innovation gate **before** expanding paid use. Copy into your wiki; **remove** rows you do not need. **Recommendation:** ☐ Proceed with bounded pilot ☐ Defer ☐ Reject (capture short reason below) **Rationale (3–5 bullets):** - - | Option | Pros | Cons | Why not chosen | |--------|------|------|----------------| | Status quo (manual packages) | | | | | Generic LLM chat / ad-hoc Copilot | | | | | ArchLucid pilot | | | | | Field | Value | |-------|-------| | **Start (UTC date)** | | | **End (UTC date)** | | | **Primary use case** | | | **Out of scope for pilot** | (e.g. full Operate governance — optional) | | **Success owner** | Name / ro
**Headings:** Steering decision memo — ArchLucid pilot (template); Decision; Alternatives considered; Pilot scope (time-boxed); Success measures (mapped to [`docs/library/PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) §4); Commercial / procurement notes (optional); Sign-off

#### `go-to-market/STRIPE_CHECKOUT.md`
**Scope:** **Scope:** Stripe Checkout for Team tier — engineering hand-off.
**Title:** Stripe Checkout — Team tier (hosted)
**Summary:** Provide a **low-friction conversion path** from self-serve trial to paid Team tier using **Stripe Checkout**, in parallel with Azure Marketplace SaaS. **Operator checklist (configuration + webhook + proof):** [`docs/runbooks/STRIPE_OPERATOR_CHECKLIST.md`](../runbooks/STRIPE_OPERATOR_CHECKLIST.md). Independent assessments should link that file whenever commercial gaps cite Stripe. 1. Populate Stripe secrets per `ArchLucid.Api` billing configuration (`Billing:Stripe:*` in Key Vault / environment). 2. Create or select a Stripe **Product**/**Price** for Team with the recurring USD amount recorded in **`PRICING_PHILOSOPHY.md` § 3.2**, and bind it to **`Billing:Stripe:PriceIdTeam`**. 3. Set `teamS
**Headings:** Stripe Checkout — Team tier (hosted); Goal; Configuration; Webhooks; Staging end-to-end — Stripe **TEST** mode (`staging.archlucid.net/signup`); 1. Configure the staging API; 2. Register the Stripe **test** webhook; 3. Buyer journey on staging UI

#### `go-to-market/SUBPROCESSORS.md`
**Scope:** **Scope:** ArchLucid — Subprocessors - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Subprocessors
**Summary:** **Audience:** Customers and prospects who need a **subprocessor list** for security questionnaires and DPAs. **Last reviewed:** 2026-04-15 ArchLucid uses the following **subprocessors** to deliver the hosted service. The list is derived from the **Azure-first** architecture described in [../CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md), [../security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md), and repository `infra/` modules. We will notify customers **at least 30 days** before engaging a **new** subprocessor that processes customer content or personal data, unless a shorter period is required by law or the change is immaterial (e.g., rename of an exi
**Headings:** ArchLucid — Subprocessors; Subprocessor table; Data residency; Change notification; Related documents

#### `go-to-market/SYNTHETIC_CASE_STUDY_CONTOSO_RETAIL.md`
**Scope:** **Scope:** Go-to-market and sales-enablement readers reviewing a synthetic Contoso Retail modernization vignette; it is not real customer results, tenant SQL metrics, or a measured pilot write-up.
**Title:** Synthetic case study — Contoso Retail (demo tenant)
**Summary:** > **SYNTHETIC — NOT REAL CUSTOMER DATA.** This narrative is fabricated for sales-enablement and DOCX examples. Do not cite figures as observed outcomes without replacing them with measured pilot data. > **Measurement companion:** [PILOT_ROI_MODEL.md](../library/PILOT_ROI_MODEL.md) **Label:** SYNTHETIC · Contoso Retail Modernization (aligned with trusted-baseline demo seed) Contoso Retail is modernizing checkout onto Azure while preserving its existing payment-processor integration. This **synthetic** vignette shows how the same measurement scaffolding used in `ValueReportRawMetrics` can tell a conservative before/after story: shorter review cycles, fewer re-review loops, and less manual evid
**Headings:** Synthetic case study — Contoso Retail (demo tenant); Executive summary; Baseline (pre-ArchLucid) — illustrative; After ArchLucid — illustrative (conservative); Indicative deltas (non-claim); Illustrative throughput and FTE levers (synthetic); Disclaimer

#### `go-to-market/TENANT_ISOLATION.md`
**Scope:** **Scope:** ArchLucid — Tenant isolation (buyer overview) - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Tenant isolation (buyer overview)
**Summary:** **Audience:** Security reviewers who need a **short** explanation before diving into engineering docs. **Last reviewed:** 2026-04-15 **Headline:** Your data is **logically isolated** at **identity**, **application**, and **database** layers when ArchLucid is deployed with the recommended Azure posture. This page summarizes; deep references are linked below. **Healthcare / PHI:** ArchLucid is for **architecture and governance evidence** about systems you describe; **do not upload PHI** into product briefs or unstructured context fields. Posture and contractual questions (including BAA) are summarized under **[`docs/go-to-market/trust-center.md`](../go-to-market/trust-center.md)** (**Healthcar
**Headings:** ArchLucid — Tenant isolation (buyer overview); 1. Three layers; 2. Encryption; 3. Network; 4. Audit and accountability; 5. What we do not claim here; 6. Deep dives; Related documents

#### `go-to-market/TRIAL_AND_SIGNUP.md`
**Scope:** **Scope:** ArchLucid — Trial and signup experience design - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Trial and signup experience design
**Summary:** **Audience:** Product and engineering teams planning the self-serve trial path. **Last reviewed:** 2026-05-12 (**§3.2** — trial infra marginal cost vs AOAI + **no** gated Azure **subscription-commitment milestone** for prospects; §4 infra-purge urgency; §3 AOAI bands; prior §2 PLG/email stance unchanged). **Pricing:** Trial parameters (seats, runs, duration) are governed by the free trial row in [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) §4. Prices for conversion are in [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md) — do not restate numbers here. Prospect → active trial in **< 5 minutes** with no sales contact required. The trial should deliver the same "first impression" as the selle
**Headings:** ArchLucid — Trial and signup experience design; 1. Goal; 2. Signup flow; 2.1 Baseline review-cycle (soft-required UX); 2.2 Team Stripe checkout (`NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED`); 3. Trial parameters; 3.1 Duration economics (operator, 2026-05-11); 3.2 Azure OpenAI spend (hosted trial, operator stance 2026-05-11)

#### `go-to-market/TRIAL_BASELINE_PRIVACY_NOTE.md`
**Scope:** **Scope:** How ArchLucid uses the optional trial-signup “baseline review-cycle hours” field — audience: prospects, security reviewers, and legal; not a substitute for your organization’s full privacy policy.
**Title:** Trial baseline review-cycle — privacy note
**Summary:** When you choose **“I will enter our median review-cycle hours”** on the self-serve signup form, we store: - **BaselineReviewCycleHours** — a positive decimal you supply (median wall-clock hours for an architecture review cycle *before* ArchLucid). - **BaselineReviewCycleSource** (optional) — a short free-text note you supply (for example “team estimate” or “last five reviews”). When you stay on **“Use model default (modeled estimate)”**, we **do not** store tenant-specific hours at signup; the product uses the conservative default described in [`docs/PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) for “before” comparisons until you commit runs. - **Delta computation only** — we compare y
**Headings:** Trial baseline review-cycle — privacy note; What we collect; How we use it; What we do not do; Retention and access; Related

#### `go-to-market/TRUST_CENTER.md`
**Scope:** **Scope:** ArchLucid Trust Center - full detail, tables, and links in the sections below.
**Title:** ArchLucid Trust Center
**Summary:** **Buyer posture table (single index):** [`docs/go-to-market/trust-center.md`](trust-center.md) — same evidence links; rendered in-product at **`/trust`**. **Audience:** Security reviewers, procurement, and legal teams evaluating ArchLucid as a **vendor-operated (SaaS)** service. **Last reviewed:** 2026-05-01 **Canonical assurance wording:** [ASSURANCE_STATUS_CANONICAL.md](ASSURANCE_STATUS_CANONICAL.md) ArchLucid is built so that **security, privacy, and operational transparency** are first-class: identity-backed access, defense-in-depth on the data plane, measurable reliability targets, and documentation you can trace to the product and infrastructure code. This page is the **buyer-facing in
**Headings:** ArchLucid Trust Center; Security overview at a glance; Azure connectivity (extractor posture); What we will never ask you to assign; Data residency and sovereignty; Penetration testing and security assessments; Recent assurance activity; Hosted staging probes (internal rollup)

#### `go-to-market/UI_GLOSSARY_V1.md`
**Scope:** **Scope:** Canonical buyer-facing ↔ technical vocabulary for the operator shell, product UI, and go-to-market collateral. This document does not rename HTTP contracts, CLI verbs, or audit journal identifiers.
**Title:** UI Glossary V1
**Summary:** **Single source of truth:** Linked from [`docs/library/operator-shell.md`](../library/operator-shell.md). Cross-reference **improvement #27** in [`docs/assessments/LATEST.md`](../assessments/LATEST.md). | Buyer-facing UI | Technical / unchanged | |----------------|----------------------| | **Review** | Run, run ID, `ArchitectureRun`, API `/v1/architecture/run/...` | | **Finalize review** / **Finalize** (when context clear) | Commit, `POST .../commit`, golden manifest persistence | | **Architecture snapshot** / **Snapshot** | Manifest, golden manifest, `GoldenManifest` | | **Evidence graph** | Knowledge graph internally; URL path `/graph` | **Capture system → Add evidence → Review → Resolve f
**Headings:** UI Glossary V1; Glossary table (verbatim — owner Q&A 2026-05-15); Workflow copy (target wizard, review detail, exports); Constraints (do not change without ADR)

#### `go-to-market/WELCOME_HERO_CTA_ANALYTICS.md`
**Scope:** **Scope:** `/welcome` hero — three CTAs, Microsoft Clarity custom events, environment variables, copy/legal posture, and links to demo workspaces (#31) and product FAQ.
**Title:** Welcome hero — CTAs, analytics, and compliance
**Summary:** **Code:** [`archlucid-ui/src/components/marketing/WelcomeMarketingPage.tsx`](../../archlucid-ui/src/components/marketing/WelcomeMarketingPage.tsx) (layout + copy), primary [`WalkthroughRequestCta.tsx`](../../archlucid-ui/src/components/marketing/WalkthroughRequestCta.tsx), secondary [`SelfDemoRequestCta.tsx`](../../archlucid-ui/src/components/marketing/SelfDemoRequestCta.tsx), tertiary [`HeroEarlyAccessCta.tsx`](../../archlucid-ui/src/components/marketing/HeroEarlyAccessCta.tsx). Analytics helpers: [`marketing-clarity-custom-event.ts`](../../archlucid-ui/src/lib/marketing/marketing-clarity-custom-event.ts). **Demo workspaces (canonical URLs, env):** [`DEMO_WORKSPACES.md`](DEMO_WORKSPACES.md)
**Headings:** Welcome hero — CTAs, analytics, and compliance; Microsoft Clarity — custom events (staging / production); Configuration (deployment); Copy / legal checklist (hero); Explicitly out of scope on `/welcome`; Playwright (optional smoke)

#### `go-to-market/WORKED_EXAMPLE_ROI.md`
**Scope:** **Scope:** Reproducible sample-data ROI artifact (PDF + parsed Markdown table) generated from a fictional Contoso tenant via the existing value-report path; for buyer/seller demo conversations only. Not a real customer outcome and not a citable benchmark.
**Title:** Worked example ROI (Contoso sample)
**Summary:** > **Honesty:** This is sample data from a fictional Contoso tenant; numbers are reproducible from `scripts/ops/generate-worked-example-roi.ps1` (Docker demo profile + `POST /v1/demo/seed` + per-tenant `POST /v1/value-report/{tenantId}/generate`). **Do not cite as customer ROI.** **Download:** [WORKED_EXAMPLE_ROI.pdf](/WORKED_EXAMPLE_ROI.pdf) (same bytes under `docs/go-to-market/WORKED_EXAMPLE_ROI.pdf` in the repository). - **PDF:** `DocxValueReportRenderer` output from the **existing** value-report DOCX path, converted to PDF (LibreOffice, Word COM, or pandoc — see the script header). - **Markdown table below:** Parsed from the **same DOCX bytes** as the PDF (`scripts/ops/value_report_docx_e
**Headings:** Worked example ROI (Contoso sample); What this is; Inline metrics mirror (from value-report DOCX)

#### `go-to-market/reference-customers/DESIGN_PARTNER_NEXT_CASE_STUDY.md`
**Scope:** **Scope:** DESIGN_PARTNER_NEXT — ArchLucid design-partner case study (placeholders) - full detail, tables, and links in the sections below.
**Title:** `<<CUSTOMER_NAME>>` — ArchLucid design-partner case study
**Summary:** > **STATUS: PLACEHOLDER.** Every `<<...>>` token must be replaced with real, customer-approved content **before** moving the corresponding row in [`README.md`](README.md) past `Drafting`. Do not commit a populated version of this file under any tier other than `Drafting` until the customer has signed a reference agreement. **Audience:** Prospective ArchLucid buyers (architecture practice leads, CIO / CTO sponsors, procurement). **Tier:** `<<TIER>>` (design-partner price band — see [`PRICING_PHILOSOPHY.md` § 5.2](../PRICING_PHILOSOPHY.md#52-locked-price-table-do-not-edit-without-re-rate-gate-decision) "Design partner discount" row) **Design-partner term start:** `<<DESIGN_PARTNER_TERM_START>>
**Headings:** `<<CUSTOMER_NAME>>` — ArchLucid design-partner case study; Customer profile; Challenge; Solution; Results; Quote; What's next; Reference-availability commitments

#### `go-to-market/reference-customers/EXAMPLE_DESIGN_PARTNER_CASE_STUDY.md`
**Scope:** **Scope:** <<CUSTOMER_NAME>> — ArchLucid design-partner case study - full detail, tables, and links in the sections below.
**Title:** `<<CUSTOMER_NAME>>` — ArchLucid design-partner case study
**Summary:** > **STATUS: PLACEHOLDER.** Every `<<...>>` token must be replaced with real, customer-approved content **before** moving the corresponding row in [`README.md`](README.md) past `Drafting`. Do not commit a populated version of this file under any tier other than `Drafting` until the customer has signed a reference agreement. **Audience:** Prospective ArchLucid buyers (architecture practice leads, CIO / CTO sponsors, procurement). **Tier:** `<<TIER>>` (design-partner price band — see [`PRICING_PHILOSOPHY.md` § 5.2](../PRICING_PHILOSOPHY.md#52-locked-price-table-do-not-edit-without-re-rate-gate-decision) "Design partner discount" row) **Design-partner term start:** `<<DESIGN_PARTNER_TERM_START>>
**Headings:** `<<CUSTOMER_NAME>>` — ArchLucid design-partner case study; Customer profile; Challenge; Solution; Results; Quote; What's next; Reference-availability commitments

#### `go-to-market/reference-customers/PUBLICATION_CHECKLIST.md`
**Scope:** **Scope:** Human gates before a reference-customer row may use **Published** status — checklist only; not legal advice.
**Title:** Reference customer — publication checklist
**Summary:** **Audience:** Product marketing, sales leadership, and customer success before external publication. Complete these gates **before** changing any [`README.md`](README.md) table row to **`Status: Published`**. This list does not replace counsel; it mirrors operational requirements cited in-repo. - **Logo permission** — Written approval for the customer’s logo (and associated brand marks) on the marketing site, decks, Marketplace copy, and any other surfaces named in the reference agreement. - **Quote approval** — Every attributable quote, metric, or endorsement in the case study is approved for **public** use under the same agreement (no paraphrased “approval” without sign-off). - **Case stud
**Headings:** Reference customer — publication checklist; Checklist; Related

#### `go-to-market/reference-customers/README.md`
**Scope:** **Scope:** ArchLucid — reference-customers index - full detail, tables, and links in the sections below.
**Title:** ArchLucid — reference-customers index
**Summary:** **Audience:** Marketing, sales, customer success, and product leadership. **Purpose:** Single source of truth for **real**, **publishable** reference-customer assets. This file replaces "no published reference customer" as a discount-stack assumption (see [`PRICING_PHILOSOPHY.md` § 5.4](../PRICING_PHILOSOPHY.md#54-discount-stack-work-down)). The CI guard [`scripts/ci/check_reference_customer_status.py`](../../../scripts/ci/check_reference_customer_status.py) parses the table below and (today) **warns** when zero rows have `Status: Published`. The same guard becomes **merge-blocking** the day the first real customer is `Published`, at which point the **−15% reference discount** in [`PRICING_P
**Headings:** ArchLucid — reference-customers index; Status lifecycle; Reference-customer table; How to add a real reference; Related documents

#### `go-to-market/reference-customers/REFERENCE_EVIDENCE_PACK_DEMO_SCAFFOLD.md`
**Scope:** **Scope:** Internal GTM authoring scaffold — shows the structure a real customer evidence pack must follow, populated with placeholder cells from the demo tenant. **Not** a publishable customer artefact; every cell in a real pack must trace to a customer-approved source per `REFERENCE_PUBLICATION_RUNBOOK.md`.
**Title:** Reference evidence pack — demo tenant scaffold (internal only)
**Summary:** **Status:** Scaffold — **not** a customer evidence pack. Every numeric and narrative cell in a real pack must come from **customer-approved** sources; see [`REFERENCE_PUBLICATION_RUNBOOK.md`](REFERENCE_PUBLICATION_RUNBOOK.md). 1. Open [`REFERENCE_EVIDENCE_PACK_TEMPLATE.md`](REFERENCE_EVIDENCE_PACK_TEMPLATE.md). 2. For the **Measured deltas** table, paste field values from a real `pilot-run-deltas` export (`GET /v1/pilots/runs/{runId}/pilot-run-deltas`). 3. Until a paying PLG customer exists, you may copy **shape only** from [`samples/pilot-run-deltas.demo-tenant.json`](samples/pilot-run-deltas.demo-tenant.json) — keep the literal banner **demo tenant — replace before publishing** on every Ar
**Headings:** Reference evidence pack — demo tenant scaffold (internal only); How to use this file; Mapping (template row → JSON field)

#### `go-to-market/reference-customers/REFERENCE_EVIDENCE_PACK_TEMPLATE.md`
**Scope:** **Scope:** One-page **template** for a single customer reference pack. Replace `<<…>>` placeholders. Every **computed** line must map to `pilot-run-deltas.json` produced by `archlucid reference-evidence` (or the admin ZIP).
**Title:** Reference evidence pack — `<<CUSTOMER_NAME>>`
**Summary:** **Status:** Draft — internal only until legal sign-off. `<<LOGO_URI_OR_ATTACH>>` `<<2_4_SENTENCES_CUSTOMER_VOICE>>` > Fill from the CLI export. Property names refer to **camelCase** JSON from `GET /v1/pilots/runs/{runId}/pilot-run-deltas`. **Internal format-only sample:** [`samples/pilot-run-deltas.demo-tenant.json`](samples/pilot-run-deltas.demo-tenant.json) (must remain **demo tenant — replace before publishing** until a customer export replaces it). | Metric | Value | JSON field | |--------|------:|------------| | Wall-clock request → committed manifest | `<<HH:MM:SS>>` | `timeToCommittedManifestTotalSeconds` (convert from seconds) | | Manifest committed at (UTC) | `<<ISO8601>>` | `manife
**Headings:** Reference evidence pack — `<<CUSTOMER_NAME>>`; Logo; Problem statement (before ArchLucid); Measured deltas (from `pilot-run-deltas.json`); Customer quote; Screenshot; Links

#### `go-to-market/reference-customers/REFERENCE_PUBLICATION_RUNBOOK.md`
**Scope:** **Scope:** Operational runbook for moving a real customer reference from internal drafting to a **Published** row in [`README.md`](README.md), including computed-ROI evidence extraction and the CI discount re-rate gate.
**Title:** Reference customer — publication runbook
**Summary:** **Audience:** Product marketing, customer success, sales engineering, and the owner who signs legal agreements. **Related:** [`PRICING_PHILOSOPHY.md` § 5.4](../PRICING_PHILOSOPHY.md#54-discount-stack-work-down) · [`scripts/ci/check_reference_customer_status.py`](../../../scripts/ci/check_reference_customer_status.py) · [`REFERENCE_EVIDENCE_PACK_TEMPLATE.md`](REFERENCE_EVIDENCE_PACK_TEMPLATE.md) · [`../REFERENCE_NARRATIVE_TEMPLATE.md`](../REFERENCE_NARRATIVE_TEMPLATE.md) Ship **one** publishable reference backed by **measured** pilot deltas (time-to-commit, findings, audit rows, LLM calls) so finance can re-rate the **−15% reference discount** when the table first reaches `Status: Published`
**Headings:** Reference customer — publication runbook; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview (evidence flow); 5. Step-by-step — Drafting → Customer review → Published; Step 1 — Confirm legal sign-off (owner-blocked); Step 2 — Extract computed evidence

#### `go-to-market/reference-customers/TRIAL_FIRST_REFERENCE_CASE_STUDY.md`
**Scope:** **Scope:** First paying tenant (PLG) — ArchLucid reference case study template - full detail, tables, and links in the sections below.
**Title:** `<<CUSTOMER_NAME>>` — First self-serve paying tenant (PLG reference)
**Summary:** | Placeholder | Real value needed | Typical source | |-------------|-------------------|----------------| | `<<CUSTOMER_NAME>>` | Legal customer name for external publication | Order form / MSA / billing entity | | `<<TIER>>` | Commercial tier at conversion | Subscription record + [`PRICING_PHILOSOPHY.md` § 5.2](../PRICING_PHILOSOPHY.md#52-locked-price-table-do-not-edit-without-re-rate-gate-decision) | | `<<TRIAL_START_DATE>>`, `<<CONVERSION_DATE>>`, `<<LAST_REVIEW_DATE>>` | UTC dates | CRM + Stripe/Marketplace subscription events | | `<<INDUSTRY>>`, `<<TEAM_SIZE>>`, `<<CLOUD_POSTURE>>`, `<<ACQUISITION_CHANNEL>>` | Firmographics | Champion interview | | `<<CHALLENGE_NARRATIVE>>`, `<<SOLUTION
**Headings:** Owner substitution checklist — fill before customer review; `<<CUSTOMER_NAME>>` — First self-serve paying tenant (PLG reference); Why PLG reference matters; Customer profile; Challenge; Solution; Results; Quote

#### `go-to-market/samples/README.md`
**Scope:** **Scope:** Synthetic DOCX/PDF samples for buyers and partners previewing collateral formats; not customer exports, signed legal deliverables, or authoritative product specs.
**Title:** Go-to-market samples
**Summary:** Sanitized artifacts for procurement, landing pages, and format previews. | File | Description | |------|-------------| | [`architecture-review-report-sample.docx`](architecture-review-report-sample.docx) | Fictitious **Contoso Architecture Partners** / **Northwind Corp** whitelabel; placeholder logo. | | [`architecture-review-report-sample.pdf`](architecture-review-report-sample.pdf) | PDF parity for the same synthetic model. | **Regeneration:** from repo root, set `ARCHLUCID_WRITE_GTM_ARB_SAMPLES=1` and run the tooling test (see [`ARCHITECTURE_REVIEW_BOARD_EXPORT.md`](../ARCHITECTURE_REVIEW_BOARD_EXPORT.md#regenerating-samples)). **Data hygiene:** samples must remain synthetic; do not subst
**Headings:** Go-to-market samples; Architecture review board packet (DOCX/PDF)

#### `go-to-market/trust-center.md`
**Scope:** **Scope:** Consolidated security and procurement posture for buyers — links only to in-repo evidence; no third-party attestation claims beyond what cited files state.
**Title:** ArchLucid Trust Center
**Summary:** <!-- TRUST_CENTER_LAST_REVIEWED_UTC:2026-05-01 --> **Last reviewed (UTC):** 2026-05-01 This page is the **single buyer-facing index** for security questionnaires, self-assessments, and procurement artifacts. Status labels are honest about evidence type: **self-asserted** documentation, **V1.1-scheduled** work, **engagements in flight**, or **third-party confirmed** only where a linked file states that explicitly. **Canonical artefact/status table:** [PROCUREMENT_PACK_INDEX.md](PROCUREMENT_PACK_INDEX.md) (`scripts/ci/check_procurement_pack_index.py` validates paths, **90-day** freshness on **Implemented** and **Self-asserted** canonical rows, buyer-placeholder strictness, forbidden false-assu
**Headings:** ArchLucid Trust Center; Procurement questionnaire accelerator; Healthcare and PHI; Azure connectivity (extractor); Download the evidence pack; Posture summary; Automated freshness posture; Self-asserted controls

### `integrations`

#### `integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md`
**Scope:** **Scope:** Azure Pipelines — manifest delta job summary (ArchLucid) — buyer-facing runbook.
**Title:** Azure Pipelines — manifest delta (job summary)
**Summary:** > **Picking a vendor:** [GitHub job summary](GITHUB_ACTION_MANIFEST_DELTA.md) · [GitHub PR comment](GITHUB_ACTION_MANIFEST_DELTA_PR_COMMENT.md) · [Azure DevOps job summary](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md) · [Azure DevOps PR comment](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) · [Azure DevOps server-side](AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) **Audience:** Platform engineers wiring ArchLucid into **Azure DevOps Pipelines** who want the same **`GET /v1/compare`** Markdown as the GitHub composite action, but rendered on the **pipeline run** summary page (the ADO equivalent of GitHub Actions’ job summary). **Purpose:** Surface structured golden-manifest delta betw
**Headings:** Azure Pipelines — manifest delta (job summary); Prerequisites; Markdown source of truth; Secrets; Soft compare failures (optional); Example (copy-paste); Related

#### `integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md`
**Scope:** **Scope:** Azure Pipelines — sticky PR comment + PR status for manifest delta (ArchLucid) — buyer-facing runbook.
**Title:** Azure Pipelines — manifest delta (sticky PR comment + PR status)
**Summary:** > **Picking a vendor:** [GitHub job summary](GITHUB_ACTION_MANIFEST_DELTA.md) · [GitHub PR comment](GITHUB_ACTION_MANIFEST_DELTA_PR_COMMENT.md) · [Azure DevOps job summary](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md) · [Azure DevOps PR comment](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) · [Azure DevOps server-side](AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) **Audience:** Platform engineers wiring ArchLucid into **Azure DevOps Repos** pull-request review who want the same outcome as the GitHub **sticky PR comment** action: **one** comment that is rewritten on every run, plus an **informational** PR status check — both ultimately driven by the same **`GET /v1/compare`** Markdow
**Headings:** Azure Pipelines — manifest delta (sticky PR comment + PR status); 1. How it works; 2. Sticky marker contract; 3. Auth modes (Azure DevOps); 4. PR status semantics; 5. Example (copy-paste); 6. Parity with server-side Worker decoration; Related

#### `integrations/AZURE_DEVOPS_PR_DECORATION.md`
**Scope:** **Scope:** Redirect — Azure DevOps PR decoration documentation moved.
**Title:** Azure Devops Pr Decoration
**Summary:** > Moved. Pick your path: [pipeline task (recommended for ADO-shop pilots)](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) · [server-side handler (zero pipeline changes)](AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md).

#### `integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md`
**Scope:** **Scope:** Azure DevOps — server-side PR decoration when an authority run completes (Worker integration handler).
**Title:** Azure DevOps — server-side PR decoration (manifest commit)
**Summary:** > **Picking a vendor:** [GitHub job summary](GITHUB_ACTION_MANIFEST_DELTA.md) · [GitHub PR comment](GITHUB_ACTION_MANIFEST_DELTA_PR_COMMENT.md) · [Azure DevOps job summary](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md) · [Azure DevOps PR comment](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) · **Azure DevOps server-side (this page)** | Path | When to use | Doc | | --- | --- | --- | | **Pipeline task (recommended for most ADO-shop pilots)** | You want a **YAML snippet** in `azure-pipelines.yml`, same inputs as the GitHub Actions, no Worker config. | [AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) | | **Server-side f
**Headings:** Azure DevOps — server-side PR decoration (manifest commit); Two paths — which one is yours?; Objective; Configuration; Runtime wiring; Security; Related

#### `integrations/CICD_INTEGRATION.md`
**Scope:** **Scope:** ArchLucid — CI/CD integration guide - full detail, tables, and links in the sections below.
**Title:** ArchLucid — CI/CD integration guide
**Summary:** **Audience:** DevOps engineers and platform teams who want to integrate architecture review into their PR or build pipelines. **Last reviewed:** 2026-04-15 Architecture review traditionally happens in meetings — after the code is written and the PR is merged. ArchLucid can shift architecture review **left** into the PR workflow, giving developers feedback on architecture decisions **before** they merge.
**Headings:** ArchLucid — CI/CD integration guide; 1. Why; 2. Pattern; 3. Setup; GitHub Actions; Azure DevOps; 4. Configuration options; 5. Security

#### `integrations/CONNECTOR_SMOKE_INDEX.md`
**Scope:** **Scope:** Operator smoke index for first-party integration surfaces — maps each smoke recipe to conformance tests and states what is automated vs live-only.
**Title:** Connector smoke recipes (index)
**Summary:** Each recipe under [smoke/](smoke/) is written so an operator can execute it **without reading source** — prerequisites, secret discipline, minimal API actions, and **expected durable audit types**. Recipes do **not** embed tenant ids, webhook URLs, or credentials. **Catalog entry point:** [go-to-market/INTEGRATION_CATALOG.md](../go-to-market/INTEGRATION_CATALOG.md) · **Readiness matrix (status, tests, code):** [library/CONNECTOR_READINESS_MATRIX.md](../library/CONNECTOR_READINESS_MATRIX.md) **Scope contract (V1):** [library/V1_SCOPE.md](../library/V1_SCOPE.md) §2.13–§2.16 (ITSM, Slack, Confluence, Azure extractor). **Customer-owned bridges** (Logic Apps / Power Automate) stay under [integrat
**Headings:** Connector smoke recipes (index); Evidence types (legend); V1 first-party connectors — smoke doc ↔ tests; Related — Azure extractor smoke

#### `integrations/GITHUB_ACTION_MANIFEST_DELTA.md`
**Scope:** **Scope:** GitHub Action — manifest delta PR check (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** GitHub Action — manifest delta PR check
**Summary:** > **Picking a vendor:** [GitHub job summary](GITHUB_ACTION_MANIFEST_DELTA.md) · [GitHub PR comment](GITHUB_ACTION_MANIFEST_DELTA_PR_COMMENT.md) · [Azure DevOps job summary](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md) · [Azure DevOps PR comment](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) · [Azure DevOps server-side](AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) **Audience:** Platform engineers wiring ArchLucid into GitHub pull-request review. **Purpose:** Surface **`GET /v1/compare`** (structured golden-manifest delta between two **committed** runs) in the Actions job summary so reviewers see added/removed/changed counts without opening the operator UI first. **Action path:** [`i
**Headings:** GitHub Action — manifest delta PR check; Prerequisites; Secrets; Example (copy-paste); Operator deep link; Related

#### `integrations/GITHUB_ACTION_MANIFEST_DELTA_PR_COMMENT.md`
**Scope:** **Scope:** GitHub Action — sticky PR comment for the ArchLucid manifest delta - full detail, contract, and links in the sections below.
**Title:** GitHub Action — manifest delta PR comment (sticky)
**Summary:** > **Picking a vendor:** [GitHub job summary](GITHUB_ACTION_MANIFEST_DELTA.md) · [GitHub PR comment](GITHUB_ACTION_MANIFEST_DELTA_PR_COMMENT.md) · [Azure DevOps job summary](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA.md) · [Azure DevOps PR comment](AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) · [Azure DevOps server-side](AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) **Audience:** Platform engineers wiring ArchLucid into GitHub pull-request review who want the delta inline on the PR (not just on the Actions job-summary page). **Purpose:** Surface **`GET /v1/compare`** (structured golden-manifest delta between two **committed** runs) as a **single sticky pull-request comment** that is r
**Headings:** GitHub Action — manifest delta PR comment (sticky); 1. How it works; 2. Sticky marker contract; 3. Prerequisites; 4. Secrets; 5. Inputs; 6. Example workflow; 7. Tests

#### `integrations/GITHUB_PR_MANIFEST_DELTA.md`
**Scope:** **Scope:** GitHub Actions pattern for comparing **two exported golden manifest JSON** files inside a PR job (for example base branch artifact vs head artifact). Complements Azure DevOps PR decoration docs; this path is **GitHub-native** and uses only repository files.
**Title:** GitHub — PR manifest delta (offline diff)
**Summary:** - **`base-manifest.json`** — manifest export from the PR base (or prior review). - **`head-manifest.json`** — manifest export from the PR head (or target review). Exports should match the same shape your team already uses with **`archlucid manifest validate`** or UI “export manifest” — the diff script looks for common fields (`status` / `manifestStatus`, `decisionCount`, `warningCount`, `systemName`) and prints whatever is present.
**Headings:** GitHub — PR manifest delta (offline diff); Inputs; Local; Composite action; Security; Related

#### `integrations/JIRA_WEBHOOK_BRIDGE.md`
**Scope:** **Scope:** Jira Cloud webhook bridge pattern — runnable reference scripts plus operational recipe; complements **V1** first-party Jira ([`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13); **not** a substitute for customer security review.
**Title:** Jira webhook bridge (reference implementation)
**Summary:** **Audience:** Platform engineers integrating ArchLucid **`com.archlucid.authority.run.completed`** and **`com.archlucid.alert.fired`** [CloudEvents 1.0](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/formats/json-format.md) deliveries into Atlassian **Jira Cloud** using **customer-operated** code paths alongside—or **before** enabling—the **[first-party Jira connector](../library/V1_SCOPE.md)** (§2.13). Canonical contracts remain **[INTEGRATION_EVENTS_AND_WEBHOOKS.md](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md)** (HMAC **`X-ArchLucid-Webhook-Signature`** signs the UTF-8 envelope), **[catalog.json](../../schemas/integration-events/catalog.json)**, and the deep-cut template **`
**Headings:** Jira webhook bridge (reference implementation); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `integrations/MICROSOFT_TEAMS_NOTIFICATIONS.md`
**Scope:** **Scope:** Operator-configured **Microsoft Teams Incoming Webhook** delivery for selected integration events, with webhook material held in **Azure Key Vault** and only a **secret name reference** stored in ArchLucid SQL. Audience: tenant operators wiring a Teams channel + on-call engineers diagnosing fan-out. **Not** a two-way Teams app (no Bot Framework / M365 manifest in v1).
**Title:** Microsoft Teams notification connector
**Summary:** | Node | Role | |------|------| | ArchLucid API | `POST /v1/integrations/teams/connections` stores `KeyVaultSecretName` + optional `Label` per tenant (`ExecuteAuthority`). | | Azure Key Vault | Holds the actual Teams incoming webhook URL as a secret value. | | Logic Apps Standard | Subscribes to Service Bus; resolves secret; POSTs Adaptive Card to Teams (see `infra/terraform-logicapps/workflows/teams-notifications/README.md`). | | Service Bus | Topics per [`schemas/integration-events/catalog.json`](../../schemas/integration-events/catalog.json). | The v1 production workflow subscribes to the following `eventType` values. Owner approved the expanded set on **2026-04-21** (PENDING_QUESTIONS.md
**Headings:** Microsoft Teams notification connector; Architecture; v1 default trigger set (2026-04-21 — six events); Per-trigger opt-in matrix (added 2026-04-21); API; List the canonical trigger catalog (Read+); Configure (Execute+); Read (Read+)

#### `integrations/SCIM_ENTRA_ID_SETUP.md`
**Scope:** **Scope:** For operators configuring Microsoft Entra ID enterprise application provisioning into ArchLucid via SCIM 2.0; not general IdP architecture, non-Microsoft IdPs, or a substitute for the SCIM threat model and admin API docs.
**Title:** SCIM 2.0 — Microsoft Entra ID provisioning recipe
**Summary:** Configure **automated inbound provisioning** from **Microsoft Entra ID** (Enterprise Application → provisioning) to ArchLucid using **SCIM 2.0** ([RFC 7644](https://www.rfc-editor.org/rfc/rfc7644.html)), **without** granting Entra administrative access to ArchLucid operator APIs beyond the SCIM surface. This document is written for operators who understand Entra Enterprise Applications but may be new to SCIM. ArchLucid exposes SCIM **under `/scim/v2`** with **`application/scim+json`** responses. | Capability | HTTP | Notes | |------------|------|--------| | **Service provider configuration** | `GET /scim/v2/ServiceProviderConfig` | Declares **PATCH** support, **filter** support (`maxResults`
**Headings:** SCIM 2.0 — Microsoft Entra ID provisioning recipe; Objective; What ArchLucid implements (protocol surface); Prerequisites; SCIM base URL; Authentication configuration; 1) Mint a SCIM bearer token (ArchLucid admin); 2) Configure Entra provisioning credentials

#### `integrations/SCIM_OPERATOR_RUNBOOK.md`
**Scope:** **Scope:** Platform and tenant operators configuring SCIM bearer tokens, IdP provisioning, and rotation; not a buyer-facing product overview (see `SCIM_PROVISIONING.md`) or legal terms.
**Title:** SCIM operator runbook
**Summary:** 1. Sign in as **tenant admin** with permission to call **`POST /v1/admin/scim/tokens`**. 2. Call the endpoint; capture the **plaintext token** from the JSON response **once** — it is not shown again. 3. Store the secret in your **IdP vault** (Entra enterprise app credential, Okta API token secret, etc.). - Issuing a **new** token does **not** invalidate older tokens until you **revoke** them explicitly. - Revoke with **`DELETE /v1/admin/scim/tokens/{id}`** (id from the list response). 1. Create an **enterprise application** with **automatic provisioning** enabled. 2. Set the SCIM URL to `https://<host>/scim/v2` and paste the bearer token. 3. Map **user** attributes (`userName`, `emails`, `ac
**Headings:** SCIM operator runbook; Issue a tenant SCIM token; Rotate / coexistence; Entra ID (Microsoft) checklist; TODO (owner-only): Microsoft Entra application gallery; Okta / OneLogin; Seat troubleshooting; References

#### `integrations/SCIM_PROVISIONING.md`
**Scope:** **Scope:** Security, procurement, and IT stakeholders evaluating inbound SCIM automation and IdP integration; not operator runbooks, SQL DDL, or the full threat model (those live in linked docs).
**Title:** SCIM 2.0 inbound provisioning (buyer overview)
**Summary:** ArchLucid acts as a **SCIM 2.0 Service Provider** (RFC 7644). Your identity provider (Microsoft Entra ID, Okta, OneLogin, or any SCIM client speaking core User/Group semantics) can **provision, update, and deactivate** users mapped into ArchLucid **tenant-scoped** SCIM tables. | Setting | Value | |--------|--------| | **SCIM base URL** | `https://<your-host>/scim/v2` | | **Authentication** | HTTP `Authorization: Bearer <token>` using the plaintext token issued from ArchLucid (see operator runbook). | | **Users resource** | `/Users` | | **Groups resource** | `/Groups` (membership drives **role hints** via configured group→role mapping). | 1. **Tenant tier** must support enterprise automation
**Headings:** SCIM 2.0 inbound provisioning (buyer overview); What you configure in your IdP; Enterprise prerequisites; Behaviour highlights; Further reading

#### `integrations/SSO_AUTH0_CONFIGURATION.md`
**Scope:** **Scope:** Auth0 OIDC/JWT SSO configuration for ArchLucid API; covers Auth0 tenant/application setup, custom claims via Actions, ArchLucid `ArchLucidAuth` config, token verification, and common troubleshooting. Audience: enterprise IT / identity administrators using Auth0 as their primary IdP. **Entra ID is the primary supported IdP** — this guide is for organizations that use Auth0 instead. Does **not** modify ArchLucid auth code; references existing auth paths for contributor context.
**Title:** SSO configuration — Auth0
**Summary:** **Last reviewed:** 2026-04-26 ArchLucid authenticates API requests via **JWT bearer tokens** validated by the ASP.NET Core `JwtBearer` middleware. When `ArchLucidAuth:Mode` is set to `JwtBearer`, the API downloads OIDC metadata from the configured `Authority`, validates the token signature, audience, issuer, and lifetime, then maps the `roles` claim to internal authorization policies. > **Primary IdP:** Microsoft Entra ID is the primary supported identity provider. ArchLucid's multi-tenant Entra support, SCIM provisioning, and trial authentication features are built and tested against Entra. This guide covers **Auth0** for organizations whose workforce identity is managed there. The JWT bear
**Headings:** SSO configuration — Auth0; 1. Overview; What ArchLucid expects from the IdP; 2. Auth0-side configuration; 2.1 Register an API; 2.2 Create an application; 2.3 Add a custom `roles` claim via Auth0 Actions; 2.4 Create Auth0 roles

#### `integrations/SSO_OKTA_CONFIGURATION.md`
**Scope:** **Scope:** Okta OIDC/JWT SSO configuration for ArchLucid API; covers Okta application setup, ArchLucid `ArchLucidAuth` config, token verification, and common troubleshooting. Audience: enterprise IT / identity administrators using Okta as their primary IdP. **Entra ID is the primary supported IdP** — this guide is for organizations that use Okta instead. Does **not** modify ArchLucid auth code; references existing auth paths for contributor context.
**Title:** SSO configuration — Okta
**Summary:** **Last reviewed:** 2026-04-26 ArchLucid authenticates API requests via **JWT bearer tokens** validated by the ASP.NET Core `JwtBearer` middleware. When `ArchLucidAuth:Mode` is set to `JwtBearer`, the API downloads OIDC metadata from the configured `Authority`, validates the token signature, audience, issuer, and lifetime, then maps the `roles` claim to internal authorization policies. > **Primary IdP:** Microsoft Entra ID is the primary supported identity provider. ArchLucid's multi-tenant Entra support, SCIM provisioning, and trial authentication features are built and tested against Entra. This guide covers **Okta** for organizations whose workforce identity is managed there. The JWT beare
**Headings:** SSO configuration — Okta; 1. Overview; What ArchLucid expects from the IdP; 2. Okta-side configuration; 2.1 Create an API authorization server (or use the default); 2.2 Create an OIDC application; 2.3 Add a custom `roles` claim; 2.4 Create Okta groups

#### `integrations/TERRAFORM_STATE_IMPORT.md`
**Scope:** **Scope:** Operators and API integrators importing Terraform state via `terraform-show-json` on architecture requests — wire format, parser behavior, and limits; not host Terraform CLI installation or non-Azure provider guarantees beyond documented mappings.
**Title:** Terraform state (`terraform show -json`) as infrastructure context
**Summary:** **Purpose:** ingest **existing Terraform state** without running `terraform` on the ArchLucid host, by attaching a **full** `terraform show -json` document to an architecture request. **Audience:** Operators automating onboarding from IaC repos and integrators aligning with **`POST /v1/architecture/request`**. Set each `infrastructureDeclarations[]` row to: | Field | Value | |-------|--------| | **`format`** | **`terraform-show-json`** (case-insensitive) | | **`content`** | String body of **`terraform show -json`** (UTF-8) | Public API validation: **`InfrastructureDeclarationRequestValidator`** in **`ArchLucid.Api`** permits **`terraform-show-json`** alongside **`json`** and **`simple-terraf
**Headings:** Terraform state (`terraform show -json`) as infrastructure context; Supported wire format; What becomes a canonical object; Usage patterns; A. Direct API (`terraform-show-json`); B. Scripted conversion (`json` DTO interop); Limitations (V1); Operational notes

#### `integrations/WEBHOOK_SCHEMAS.md`
**Scope:** **Scope:** Buyers wiring outbound subscribers (Logic Apps, API gateways, partner buses) to ArchLucid HTTP webhooks and integration-event payloads — JSON shapes + canonical event strings; **not** Entra token-exchange tutorials.
**Title:** Webhook and integration-event JSON payloads
**Summary:** > **See also:** [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md) (CloudEvents envelope + `X-ArchLucid-Webhook-Signature`), [`schemas/integration-events/catalog.json`](../../schemas/integration-events/catalog.json). - **`GovernanceApprovalRequested`** appears as **`dbo.AuditEvents.EventType`** / buyer-facing audit timelines when operators request governance review (see [`AuditEventTypes`](../../ArchLucid.Core/Audit/AuditEventTypes.cs)). - **`com.archlucid.governance.approval.submitted`** (`IntegrationEventTypes.GovernanceApprovalSubmittedV1`) is the **integration-event / webhook** string emitted after an approval request is persisted — use this constant wh
**Headings:** Webhook and integration-event JSON payloads; Naming note: audit vs integration types; HTTP webhook envelope; Primary payloads; `com.archlucid.authority.run.completed`; Governance approval submitted (`GovernanceApprovalSubmittedV1`); Additional schemas; Verification hooks in-repo

#### `integrations/recipes/CONFLUENCE_PAGE_VIA_LOGIC_APPS.md`
**Scope:** **Scope:** Step-by-step Azure Logic Apps recipe to publish Confluence pages from ArchLucid CloudEvents webhooks — no custom code required.
**Title:** Confluence page via Logic Apps (no-code recipe)
**Summary:** **Audience:** V1 customers who want to push architecture run summaries or advisory scan results to a Confluence space without writing a custom webhook consumer. **V1 interim bridge.** A first-party Confluence connector is planned for **V1.1** — see [V1_DEFERRED.md §6](../../library/V1_DEFERRED.md) and [INTEGRATION_CATALOG.md §2](../../go-to-market/INTEGRATION_CATALOG.md). V1.1 minimum viable shape: one-way publish to a single fixed `Confluence:DefaultSpaceKey`. This recipe bridges the gap using **Azure Logic Apps (Standard)**. **Contracts:** [catalog.json](../../../schemas/integration-events/catalog.json) · [INTEGRATION_EVENTS_AND_WEBHOOKS.md](../../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md
**Headings:** Confluence page via Logic Apps (no-code recipe); 1. Prerequisites; 2. Event types to subscribe to; 3. Flow overview; 4. Step-by-step flow configuration; Step 1 — Create a Logic App Standard workflow; Step 2 — Validate HMAC signature; Step 3 — Parse CloudEvents body

#### `integrations/recipes/JIRA_ISSUE_VIA_LOGIC_APPS.md`
**Scope:** **Scope:** Azure Logic Apps (Standard) companion to the Power Automate Jira recipe — same CloudEvents payload and Jira REST calls, Azure-first operational model preferred for V1 evaluator docs.
**Title:** Jira issue via Azure Logic Apps (Logic Apps–first recipe)
**Summary:** **Audience:** Teams standardized on **Azure Logic Apps Standard** who need Jira issues from ArchLucid findings or alerts **without Power Automate Premium HTTP connectors.** **Optional customer-owned bridge.** **First-party Jira** is **in scope for V1 GA** ([`V1_SCOPE.md`](../../library/V1_SCOPE.md) §2.13). Same Automation-platform variant as [JIRA_ISSUE_VIA_POWER_AUTOMATE.md](JIRA_ISSUE_VIA_POWER_AUTOMATE.md). > **Customer-owned:** Workflow runs in **your** Azure subscription; calls **your** Jira Cloud REST API using **your** Atlassian credentials. Not an Atlassian Marketplace “ArchLucid” app. **Canonical narrative, JSON schema on the HTTP trigger, field tables, severity mapping, example `PO
**Headings:** Jira issue via Azure Logic Apps (Logic Apps–first recipe); Logic Apps–specific outline

#### `integrations/recipes/JIRA_ISSUE_VIA_POWER_AUTOMATE.md`
**Scope:** **Scope:** Step-by-step Power Automate recipe to create Jira issues from ArchLucid CloudEvents webhooks — no custom code required.
**Title:** Jira issue via Power Automate (no-code recipe)
**Summary:** **Audience:** V1 customers who need Jira issues from ArchLucid findings or alerts but do not want to write an Azure Function or custom webhook receiver. **Optional customer-owned bridge.** **First-party Jira** is **in scope for V1 GA** ([`V1_SCOPE.md`](../../library/V1_SCOPE.md) §2.13, [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md)). Use this recipe when you prefer **Power Automate** or need automation **before** managed connector enablement. > **Customer-owned:** This flow runs in **your** Microsoft tenant and calls **your** Jira Cloud REST API with **your** Atlassian identity. It is **not** the managed ArchLucid→Jira connector—see §7 for differences versus first-party
**Headings:** Jira issue via Power Automate (no-code recipe); 1. Prerequisites; 2. Event types to subscribe to; 3. Flow overview; 4. Step-by-step flow configuration; Step 1 — Create flow and add HTTP trigger; Step 2 — Initialize variables; Step 3 — Validate HMAC signature (recommended)

#### `integrations/recipes/README.md`
**Scope:** **Scope:** Index of **customer-owned** no-code webhook integration recipes: ArchLucid CloudEvents to third-party tools via Power Automate or Logic Apps **you** maintain — complements optional **or interim** coverage alongside **V1** first-party **Jira** / **ServiceNow** / **Confluence** ([`V1_SCOPE.md`](../../library/V1_SCOPE.md) §2.13–§2.15).
**Title:** Readme
**Summary:** **Audience:** Customers and integration engineers who prefer **customer-operated** automation (Microsoft Power Automate or Azure Logic Apps) for ITSM/documentation bridges — whether **before** first-party connectors are enabled, **instead of** them for operational preference, or when you need an **Azure-first** no-code path during rollout. **Customer-owned means:** These documents are **reference recipes only**. They are **not** marketplace listings, vendor-certified apps, or ArchLucid-managed integrations. ArchLucid publishes CloudEvents (or Service Bus messages); **your** tenant wires webhooks and calls third-party REST APIs under **your** contracts with Microsoft, Atlassian, and ServiceNo
**Headings:** Recipes; Event catalog; Relationship to existing bridge templates; First-party roadmap vs these recipes

#### `integrations/recipes/SERVICENOW_INCIDENT_VIA_LOGIC_APPS.md`
**Scope:** **Scope:** Azure Logic Apps (Standard) variant of the ServiceNow incident recipe — same CloudEvents contracts as the Power Automate flow, Azure-first operational model.
**Title:** ServiceNow incident via Azure Logic Apps (Logic Apps–first recipe)
**Summary:** **Audience:** Teams standardized on **Azure Logic Apps Standard** (single-tenant) who want ServiceNow incidents from ArchLucid without Power Automate Premium HTTP connectors. **Optional customer-owned bridge.** Same posture as [SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md](SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md): **first-party ServiceNow** is **V1 GA** ([`V1_SCOPE.md`](../../library/V1_SCOPE.md) §2.13). > **Customer-owned:** Workflow runs in **your** Azure subscription; calls **your** ServiceNow Table API. ArchLucid delivers signed webhooks per [INTEGRATION_EVENTS_AND_WEBHOOKS.md](../../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md). **Canonical field mapping and JSON schema for the HTTP trigge
**Headings:** ServiceNow incident via Azure Logic Apps (Logic Apps–first recipe); Logic Apps–specific outline

#### `integrations/recipes/SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md`
**Scope:** **Scope:** Step-by-step Power Automate recipe to create ServiceNow incidents from ArchLucid CloudEvents webhooks — no custom code required.
**Title:** ServiceNow incident via Power Automate (no-code recipe)
**Summary:** **Audience:** V1 customers who need ServiceNow incidents from ArchLucid findings or alerts but do not want to write an Azure Function or custom webhook receiver. **Optional customer-owned bridge.** **First-party ServiceNow** is **in scope for V1 GA** ([`V1_SCOPE.md`](../../library/V1_SCOPE.md) §2.13, [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md)). Use this recipe when you prefer **Power Automate** or need automation **before** managed connector enablement. > **Customer-owned:** This flow runs in **your** Microsoft 365 / Power Platform tenant and calls **your** ServiceNow Table API. It is **not** a ServiceNow Store or ArchLucid-certified integration pack. ArchLucid only
**Headings:** ServiceNow incident via Power Automate (no-code recipe); 1. Prerequisites; 2. Event types to subscribe to; 3. Flow overview; 4. Step-by-step flow configuration; Step 1 — Create flow and add HTTP trigger; Step 2 — Initialize variables; Step 3 — Validate HMAC signature (recommended)

#### `integrations/recipes/recipe-azure-logic-apps-webhook-to-ado-work-item.md`
**Scope:** **Scope:** Copy-paste Azure integration recipe — Logic Apps (and supporting Azure components) consuming ArchLucid CloudEvents webhooks to create Azure DevOps work items; customer-operated bridge only.
**Title:** Azure Logic Apps: webhook → Azure DevOps work item
**Summary:** **Audience:** V1 platform engineers who want **work items in Azure DevOps** from the same CloudEvents payloads ArchLucid posts to HTTPS subscribers, without waiting for a first-party ArchLucid connector. **Not a product connector.** This recipe wires together **your** Logic App, **your** Azure DevOps organization/project, and optional **API Management** or **Azure Functions** for signature verification. It does **not** change ArchLucid.Api routing or imply a shipped ArchLucid “Azure DevOps connector.” The connector row for **Azure DevOps Work Items** in [INTEGRATION_CATALOG.md §2](../../go-to-market/INTEGRATION_CATALOG.md) remains **[Planned]** for first-party scope. **Contracts:** [`schemas
**Headings:** Azure Logic Apps: webhook → Azure DevOps work item; V1 scope boundary (ITSM / connectors); 1. Objective; 2. Authentication choices; 3. Example payload pointers (`schemas/integration-events/`); 4. Idempotency guidance; 5. Flow overview; 6. Failure modes

#### `integrations/recipes/recipe-event-grid-webhook-hardening-checklist.md`
**Scope:** **Scope:** Checklist for hardening HTTPS endpoints that receive integration traffic — Azure Event Grid subscription validation, optional ArchLucid HMAC, and idempotent processing; no ArchLucid product changes.
**Title:** Event Grid & webhook receiver — hardening checklist
**Summary:** **Audience:** Security and platform engineers placing **Azure Event Grid**, **API Management**, **Logic Apps**, or **Functions** between enterprise networking zones and automation that ultimately consumes **ArchLucid-compatible CloudEvents** (directly from ArchLucid or after fan-out). **Not ArchLucid configuration.** This document describes **subscriber-side** controls only. It does not add routes or connectors to ArchLucid.Api. **Contracts:** [INTEGRATION_EVENTS_AND_WEBHOOKS.md](../../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md) · [`schemas/integration-events/catalog.json`](../../../schemas/integration-events/catalog.json) [`V1_SCOPE.md` §2.13](../../library/V1_SCOPE.md) commits **first-part
**Headings:** Event Grid & webhook receiver — hardening checklist; V1 scope boundary (ITSM / connectors); 1. Topology — which checks apply?; 2. Event Grid subscription validation; 3. ArchLucid HMAC (when ArchLucid POSTs directly); 4. Event Grid delivery authentication (subscriber-facing); 5. TLS, quotas, and abuse; 6. Idempotency guidance

#### `integrations/smoke/CONNECTOR_SMOKE_AZURE_EXTRACTOR.md`
**Scope:** **Scope:** Smoke validation for Azure architecture extractor upload path.
**Title:** Smoke — Azure extractor upload
**Summary:** **Primary enterprise demo connector (owner decision 2026-05-07):** customer-run extractor package + `POST /v1/azure-extractor/upload`. - Hosted ArchLucid API reachable with an operator API key or equivalent auth used in your environment. - Extractor package built from in-repo guidance — [runbooks/AZURE_EXTRACTOR_INGEST.md](../../runbooks/AZURE_EXTRACTOR_INGEST.md). - Store API keys in **Key Vault** (production) or environment-specific secret stores — never in the recipe file. - Local/dev may use `ARCHLUCID_API_KEY` when consistent with your `archlucid.json` / CLI configuration. 1. Obtain a valid bearer/API-key combination for a tenant with extractor entitlement (per environment policy). 2. `
**Headings:** Smoke — Azure extractor upload; Prerequisites; Secrets; Happy path (API); Verification; Troubleshooting

#### `integrations/smoke/CONNECTOR_SMOKE_CONFLUENCE.md`
**Scope:** **Scope:** Operator smoke — first-party Confluence Cloud page publish from Authority Markdown; no tenant secrets.
**Title:** Smoke — Confluence Cloud (first-party publish)
**Summary:** Verify **one-way publish** of the canonical first-value **Markdown** for a run into a configured space ([V1_SCOPE.md](../../library/V1_SCOPE.md) §2.15). The publisher sends **Authority-shaped** Markdown from the in-product report builder to the connector — there is no duplicate “Confluence document schema” stored in ArchLucid beyond **`RunId`** and link base for URLs. - **Confluence Cloud** space for pilot content (`Confluence:DefaultSpaceKey` or tenant-equivalent configuration). - API token + user (basic auth to Cloud) per [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md); secrets in **Key Vault**, not operator docs. - A **committed** run id suitable for smoke (non-prod sp
**Headings:** Smoke — Confluence Cloud (first-party publish); Purpose; Prerequisites; Auth and secret pattern; Test payload (Authority-shaped); Expected ArchLucid audit events; Expected external artifact; Rollback and cleanup

#### `integrations/smoke/CONNECTOR_SMOKE_JIRA.md`
**Scope:** **Scope:** Operator smoke — first-party Jira outbound issue create and optional inbound status sync; no tenant secrets or live keys.
**Title:** Smoke — Jira (first-party ITSM)
**Summary:** Confirm that a persisted **Authority-shaped finding** drives a **Jira issue** with correlation suitable for **inbound status sync**, matching [V1_SCOPE.md](../../library/V1_SCOPE.md) §2.13. ArchLucid maps from the standard finding inspect surface; smoke does **not** introduce a Jira-only request schema beyond the single outbound API envelope. - **Jira Cloud** (or supported variant in your build) with a **non-production** project for pilot use. - A **committed** architecture run whose manifest includes at least one finding eligible for export (severity and connector rules per deployment). - `Integrations:ItsmOutbound` Jira settings populated (cloud base URL, credentials or token path per host
**Headings:** Smoke — Jira (first-party ITSM); Purpose; Prerequisites; Auth and secret pattern; Test payload (Authority-shaped); Expected ArchLucid audit events; Expected external artifact; Rollback and cleanup

#### `integrations/smoke/CONNECTOR_SMOKE_SERVICENOW.md`
**Scope:** **Scope:** Operator smoke — first-party ServiceNow incident create and optional inbound status sync; no tenant secrets or live keys.
**Title:** Smoke — ServiceNow (first-party ITSM)
**Summary:** Confirm that a persisted **Authority-shaped finding** creates a **ServiceNow `incident`** with CMDB correlation rules and **inbound status-only sync** as committed in [V1_SCOPE.md](../../library/V1_SCOPE.md) §2.13. Mapping uses the standard finding inspect surface; smoke does **not** define a ServiceNow-only ArchLucid schema beyond the outbound API envelope. - **ServiceNow** instance (pilot/non-prod) with Table API access and **`incident`** create permission for the integration user. - A **committed** run with at least one finding suitable for outbound create. - `Integrations:ItsmOutbound` ServiceNow block (instance URL, credentials) and optional **`dbo.TenantItsmOutboundSettings`** (`Servic
**Headings:** Smoke — ServiceNow (first-party ITSM); Purpose; Prerequisites; Auth and secret pattern; Test payload (Authority-shaped); Expected ArchLucid audit events; Expected external artifact; Rollback and cleanup

#### `integrations/smoke/CONNECTOR_SMOKE_SLACK.md`
**Scope:** **Scope:** Operator smoke — first-party Slack incoming-webhook delivery for alerts/digests; no webhook URLs or tenant ids.
**Title:** Smoke — Slack (first-party chat-ops)
**Summary:** Confirm **Slack incoming webhook** delivery with the same **Authority-shaped** text payloads and trigger opt-in model as Microsoft Teams per [V1_SCOPE.md](../../library/V1_SCOPE.md) §2.14 and [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md). Slack uses **subscription rows** (alert routing and digest routing) that reference webhook destinations — there is **no** parallel “Slack JSON finding schema”; alerts/digests reuse the product’s canonical delivery payload shapes. - Slack workspace with an **incoming webhook** URL for a **pilot channel** (rotate after smoke if the URL was exposed). - **Standard** (or entitled) tenant tier where integration controllers apply; operator ro
**Headings:** Smoke — Slack (first-party chat-ops); Purpose; Prerequisites; Auth and secret pattern; Test payload (Authority-shaped); Expected ArchLucid audit events; Expected external artifact; Rollback and cleanup

### `library`

#### `library/ACCESSIBILITY.md`
**Scope:** **Scope:** Accessibility — operator UI patterns (supplement) - full detail, tables, and links in the sections below.
**Title:** Accessibility — operator UI patterns (supplement)
**Summary:** **Purpose:** Operator-shell patterns that complement the repo-wide accessibility baseline in **[`ACCESSIBILITY.md`](../../ACCESSIBILITY.md)** (WCAG 2.2 AA target, axe Playwright gates, eslint-plugin-jsx-a11y). The **`ConfirmationDialog`** wrapper uses **`@radix-ui/react-alert-dialog`** (see **`archlucid-ui/src/components/ui/alert-dialog.tsx`**), not the generic **`Dialog`**: - **Focus is trapped** inside the modal while it is open; focus returns to a sensible trigger when it closes. - **No passive dismiss:** users cannot complete the flow by clicking the overlay. They must choose **Cancel** or the labeled confirm action — appropriate for **irreversible or significant** operations (e.g. gover
**Headings:** Accessibility — operator UI patterns (supplement); Destructive and high-impact confirmations (Radix Alert Dialog); Live region — run pipeline progress; Related documents

#### `library/ACCESSIBILITY_AUDIT.md`
**Scope:** **Scope:** Operator-shell WCAG 2.2 AA–aligned axe coverage — what is enforced in CI and how to run locally.
**Title:** Accessibility audit (operator shell)
**Summary:** Document how **critical** and **serious** WCAG 2.2 AA-aligned violations are blocked on the **operator shell** (Next.js app under `archlucid-ui/`) using **@axe-core/playwright** in merge-blocking live E2E. | Surface | Config | Spec | WCAG tags | |---------|--------|------|-----------| | Operator + marketing routes used in live E2E | `archlucid-ui/playwright.config.ts` | `archlucid-ui/e2e/live-api-accessibility.spec.ts` | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice` (see `e2e/helpers/axe-helper.ts`) | The live suite builds the UI, starts the **live API + SQL** harness (`e2e/start-e2e-live-api.ts`), then visits each path in the spec’s `PAGES` array, waits for `main`,
**Headings:** Accessibility audit (operator shell); Objective; What CI enforces; Pages covered (operator shell); Local commands; Related

#### `library/AGENT_EVAL_CORPUS.md`
**Scope:** **Scope:** Maintain authors of the synthetic **`tests/eval-corpus`** and **`eval_agent_corpus.py`** heuristic — structure, thresholds, CI posture; not ground-truth human labels from production tenants or Azure OpenAI cost accounting.
**Title:** Agent evaluation corpus (synthetic)
**Summary:** This document describes **`tests/eval-corpus/`** — a deliberately **small, synthetic** set of scenarios used to regress **finding-quality expectations** offline without Azure OpenAI or customer payloads. Companion scripts: - **`scripts/ci/eval_agent_corpus.py`** — synthetic scenarios under **`tests/eval-corpus/`** (finding recall vs recordings). - **`scripts/ci/eval_agent_quality.py`** — validates **`tests/eval-datasets/`** (manifest **`schemaVersion` 2**): topology/cost/compliance/critic eval JSON **must** include per-case **`architecturalContext`**, **`expect.requiredCategories`**, and **`expect.forbiddenCategories`**. Prompt-injection fixtures declare **`expectedBlockedAt`** as **`prechec
**Headings:** Agent evaluation corpus (synthetic); Structure; V1 customer-like brief slice (2026-05); Markdown report (structural, semantic, gate); Metrics (V1 heuristic); CI posture; Adding a scenario; Related documents

#### `library/AGENT_OUTPUT_EVALUATION.md`
**Scope:** **Scope:** Agent output structural evaluation - full detail, tables, and links in the sections below.
**Title:** Agent output structural evaluation
**Summary:** Provide a **cheap, deterministic** check that persisted agent **`AgentExecutionTrace.ParsedResultJson`** still looks like a serialized **`AgentResult`**: correct JSON root shape and expected **top-level property names** (camelCase, matching **`JsonSerializerDefaults.Web`**). Support **on-demand HTTP inspection** per run and **optional OTEL metrics** for batch or post-run jobs—without calling an LLM. - **Traces** store **`ParsedResultJson`** only when **`ParseSucceeded`** is true (handlers serialize the validated **`AgentResult`**). - **Schema validation** already ran at execution time; this layer catches **drift**, **manual SQL edits**, or **future serializer changes** that leave traces read
**Headings:** Agent output structural evaluation; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture Overview; 5. Component Breakdown; 6. Data Flow; 7. Security Model

#### `library/AGENT_TRACE_FORENSICS.md`
**Scope:** **Scope:** Agent execution trace forensics (full prompt storage) - full detail, tables, and links in the sections below.
**Title:** Agent execution trace forensics (full prompt storage)
**Summary:** Enable **replayable** inspection of exact LLM inputs and outputs for a single agent step when investigations or quality regressions require more than the **8 192-character** truncated fields on **`AgentExecutionTrace`**. | Element | Behavior | |---------|----------| | **Full prompts (Real LLM)** | After each trace insert, **`AgentExecutionTraceRecorder`** writes full system prompt, user prompt, and raw response to blob with retries; on failure or timeout, **`Full*Inline`** SQL columns are patched so each field has **either** a blob key **or** inline text (never both absent for Real execution). **`AgentExecution:TraceStorage:BlobPersistenceTimeoutSeconds`** caps blob wall time (default **30**
**Headings:** Agent execution trace forensics (full prompt storage); Objective; Model; Sentinel values (nullable columns, non-null strings); Host startup (Production / Staging, Real mode); Retrieving content for a trace; Privacy and retention; Reliability

#### `library/AI_AGENT_PROMPT_REGRESSION.md`
**Scope:** **Scope:** Agent prompt regression guard - full detail, tables, and links in the sections below.
**Title:** Agent prompt regression guard
**Summary:** Provide a **repeatable** local/CI hook that fails when simulator-mode agent outputs drift materially after prompt or handler changes — complementary to **Stryker** (mutation) and **line coverage**. | Layer | Role | |--------|------| | **`scripts/ci/prompt_regression_baseline.json`** | Committed **`minStructuralCompletenessByAgentType`** / **`minSemanticScoreByAgentType`** floors (**0.95** structural / **0.85** semantic for all four **`AgentType`** values today). **`assert_prompt_regression.py`** enforces Topology ≥ **0.9** / **0.5** minimums plus Cost / Compliance / Critic ≥ **0.85** / **0.7** minimums so the file cannot regress to placeholders. | | **`scripts/ci/assert_prompt_regression.py`
**Headings:** Agent prompt regression guard; Objective; Current state; Usage; Evolution; Related

#### `library/AI_SEARCH_SKU_GUIDANCE.md`
**Scope:** **Scope:** Azure AI Search — SKU notes for ArchLucid retrieval - full detail, tables, and links in the sections below.
**Title:** Azure AI Search — SKU notes for ArchLucid retrieval
**Summary:** **Objective:** Pick a search tier that matches environment (dev vs prod), network boundaries, and cost. **Assumptions:** Retrieval uses `Retrieval:VectorIndex=AzureSearch` with private connectivity preferred in production. **Constraints:** Do not expose SMB (port 445) for file-based alternatives; use Azure-native private endpoints where policy requires. - **Free** or lowest **Basic** tier is acceptable when vector volume is tiny and latency spikes are tolerable. - Run without private endpoints on isolated subscriptions only; treat indexes as non-production data. - Pair with **Azurite** or emulator-backed storage for local compose; AI Search itself has no official local emulator — use a small
**Headings:** Azure AI Search — SKU notes for ArchLucid retrieval; Dev / test; Production; Operational notes

#### `library/ALERTS.md`
**Scope:** **Scope:** Alerts, advisory scans, and related HTTP surface - full detail, tables, and links in the sections below.
**Title:** Alerts, advisory scans, and related HTTP surface
**Summary:** This note ties together **operator-facing HTTP routes** and where behavior is implemented. For C# XML comment conventions and the incremental doc **piece tracker**, see [METHOD_DOCUMENTATION.md](METHOD_DOCUMENTATION.md). For policy-pack effects on alerts/compliance, see [API_CONTRACTS.md](API_CONTRACTS.md). | Area | Route prefix (typical) | Controller | |------|------------------------|------------| | Define/list metric rules | `v{version}/alert-rules` | `AlertRulesController` | | List/act on fired alerts | `v{version}/alerts` | `AlertsController` | Rules are stored per tenant/workspace/project. At evaluation time, enabled rules are **filtered by effective governance** (`PolicyPackGovernance
**Headings:** Alerts, advisory scans, and related HTTP surface; Simple alert rules; Composite alert rules; Routing & delivery; Outbound webhook HMAC (digest + alert channels); Simulation & tuning; Advisory (plans, recommendations, schedules); Scope debug

#### `library/API_CONTRACTS.md`
**Scope:** **Scope:** API contracts (notable behaviors) - full detail, tables, and links in the sections below.
**Title:** API contracts (notable behaviors)
**Summary:** **Error bodies (RFC 9457 Problem Details, obsoletes RFC 7807):** See **[API_ERROR_CONTRACT.md](API_ERROR_CONTRACT.md)** for Problem+JSON shape, stable **`type`** URIs, and correlation behavior. - **URL path:** Major version is in the path: **`/v1/...`** (see controller routes `v{version:apiVersion}`). - **Alternate readers:** Clients may also send **`api-version`** as a query string or request header (same major.minor as the URL segment, e.g. **`1.0`**) — wired in **`ArchLucid.Api/Startup/MvcExtensions.cs`** via **`ApiVersionReader.Combine`** alongside **`UrlSegmentApiVersionReader`**. - **Default:** Version **1.0** is assumed when not specified; clients should still use **`/v1`** in URLs. -
**Headings:** API contracts (notable behaviors); API versioning; Deprecation policy; Contract artifacts; LLM cost signals — wire contract vs vendor economics; Operator artifacts (`/v1/artifacts`); Changing the HTTP contract (PR checklist); Azure extractor ingest (`/v1/azure-extractor`)

#### `library/API_CONTROLLER_MAP.md`
**Scope:** **Scope:** API controller map (filename alias) - full detail, tables, and links in the sections below.
**Title:** API controller map (filename alias)
**Summary:** Some materials refer to **`API_CONTROLLER_MAP.md`**. The maintained controller-area reference is **[CONTROLLER_AREA_MAP.md](CONTROLLER_AREA_MAP.md)** (physical **`ArchLucid.Api/Controllers/{Area}/`** folders, namespaces **`ArchLucid.Api.Controllers.{Area}`**, controller type names, and bulk operator APIs). Keep substantive edits in **CONTROLLER_AREA_MAP.md** only; this file stays a stable alternate path.
**Headings:** API controller map (filename alias)

#### `library/API_ERROR_CONTRACT.md`
**Scope:** **Scope:** API error contract (RFC 9457 Problem Details) - full detail, tables, and links in the sections below.
**Title:** API error contract (RFC 9457 Problem Details)
**Summary:** Give API clients a **stable, machine-readable** error shape for failures: **`application/problem+json`** with **`type`**, **`title`**, **`detail`**, **`status`**, and **`correlationId`** where the global pipeline attaches it. **Normative reference:** [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) (*Problem Details for HTTP APIs*), which **obsoletes** [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807). The media type and JSON fields are unchanged; cite **9457** for new documentation and reviews. - Clients use **`GET /openapi/v1.json`** or the checked-in contract snapshot for response schemas. - Operators may read **`correlationId`** from response bodies or **`X-Correlation-ID`** headers (
**Headings:** API error contract (RFC 9457 Problem Details); Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `library/API_EXPLORER.md`
**Scope:** **Scope:** API explorer (Scalar + OpenAPI) - full detail, tables, and links in the sections below.
**Title:** API explorer (Scalar + OpenAPI)
**Summary:** Give developers and operators an interactive, browser-based way to discover and try ArchLucid HTTP endpoints without leaving the documented OpenAPI surface. - Non-production environments may enable the explorer; production keeps it off unless explicitly configured. - **`GET /openapi/v1.json`** is the **canonical** OpenAPI document (contract tests, APIM import, npm/PyPI/.NET client generation). **`GET /swagger/v1/swagger.json`** exists **only** so Scalar can render the explorer (schema IDs, tags, examples, auth metadata aligned via shared mutators — but not a second contract of record). - Microsoft `MapOpenApi()` serves the canonical document; Swashbuckle serves the explorer-facing sibling. -
**Headings:** API explorer (Scalar + OpenAPI); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture Overview; 5. Component Breakdown; 6. Data Flow; 7. Security Model

#### `library/API_FUZZ_TESTING.md`
**Scope:** **Scope:** API fuzz testing (Schemathesis) - full detail, tables, and links in the sections below.
**Title:** API fuzz testing (Schemathesis)
**Summary:** This document describes **Schemathesis**-based property testing of the ArchLucid HTTP API against the **OpenAPI** document. It complements contract snapshots ([OPENAPI_CONTRACT_DRIFT.md](OPENAPI_CONTRACT_DRIFT.md)), PR CI, and the weekly **ZAP** baseline ([security/ZAP_BASELINE_RULES.md](../security/ZAP_BASELINE_RULES.md)). **Workflow:** [`.github/workflows/schemathesis-scheduled.yml`(../../.github/workflows/schemathesis-scheduled.yml) **Upstream:** [Schemathesis](https://github.com/schemathesis/schemathesis) (official Docker image `schemathesis/schemathesis:stable`) Schemathesis performs **property-based API fuzzing** driven by the **OpenAPI specification**. It generates large numbers of re
**Headings:** API fuzz testing (Schemathesis); Purpose; When it runs; What it checks; How to run locally; A — CI-parity (recommended to reproduce the workflow); Wait until the API responds (same probe as CI); B — Against `docker compose` full-stack API

#### `library/API_PERFORMANCE_TARGETS.md`
**Scope:** **Scope:** ArchLucid HTTP API — merge-blocking k6 p95 latency ceilings tied to measured baselines — not customer SLA text (see **`API_SLOS.md`**) and not SQL named-query allowlists (**TB-003** / **`OBSERVABILITY.md`**).
**Title:** API performance targets (k6-enforced p95)
**Summary:** Publish **route-oriented** p95 ceilings enforced by **k6 `thresholds`** on merge-blocking CI jobs and duplicated by **`scripts/ci/assert_k6_ci_smoke_summary.py`**, so regressions fail the workflow without changing runtime API code. - **Synthetic CI profile:** **`tests/load/ci-smoke.js`** (**`k6-ci-smoke`**) and **`tests/load/k6-api-smoke.js`** (**`k6-smoke-api`**) against **`ArchLucid.Api`** on GitHub Actions with SQL Server service container and DevelopmentBypass (**`.github/workflows/ci.yml`**). - Targets are **ceilings** for **external HTTP latency** on those profiles; production paths differ (network, auth, data volume). - Thresholds apply **only** where k6 already tags requests (**`k6ci
**Headings:** API performance targets (k6-enforced p95); Objective; Assumptions; Constraints; Architecture overview; Named-query pattern reference (TB-003); Top routes — targets and k6 mapping; Auxiliary endpoints already gated (same Tier 2 / Tier 3 buckets)

#### `library/API_SLOS.md`
**Scope:** **Scope:** ArchLucid API — service level objectives (SLOs) - full detail, tables, and links in the sections below.
**Title:** ArchLucid API — service level objectives (SLOs)
**Summary:** This document defines **customer-visible** HTTP objectives for the ArchLucid API and how they are **measured**. It complements `docs/runbooks/SLO_PROMETHEUS_GRAFANA.md` (Prometheus burn-rate math from OpenTelemetry) with an **external synthetic** view. - State explicit **SLOs** (availability, error rate, latency) so reliability is **quantified**, not subjective. - Align **internal** SLIs (Prometheus from `http.server.request.duration`) with **external** checks (scheduled probes from outside the cluster). - Give operators a single place to answer: “Are we meeting the contract, from both the server’s and the internet’s perspective?” - The HTTP availability SLO is **99.9%** over a **30-day** ro
**Headings:** ArchLucid API — service level objectives (SLOs); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `library/API_VERSIONING.md`
**Scope:** **Scope:** API versioning (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** API versioning (ArchLucid)
**Summary:** Document how **Asp.Versioning** is wired for `ArchLucid.Api`, how clients should call versioned routes, and how to introduce a future **v2** without breaking v1. - Primary contract remains **OpenAPI document** `openapi/v1.json` (see CI contract snapshot tests). - Breaking changes require a new **major** API version (URL segment or explicit header). - Anonymous infrastructure endpoints (`/health/*`, `/version`) and static docs remain **version-neutral**. - Auth debug (`/api/auth/me`) and HTML docs (`DocsController`) are **version-neutral** by design. Registration lives in **`ArchLucid.Api/Startup/MvcExtensions.cs`**: - **Default version:** `1.0` with `AssumeDefaultVersionWhenUnspecified = tru
**Headings:** API versioning (ArchLucid); Objective; Assumptions; Constraints; Current configuration; Adding v2 (future); Related

#### `library/ARCHITECTURE_COMPONENTS.md`
**Scope:** **Scope:** ArchLucid architecture (Components) - full detail, tables, and links in the sections below.
**Title:** Architecture Components
**Summary:** **Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) **Product name:** **ArchLucid**. Solution/projects use **`ArchLucid.*`**; configuration may still show legacy **`ArchLucid:*`** / **`ArchLucidAuth`** keys until Phase 7 (`docs/library/V1_DEFERRED.md`). This document zooms into the most important components inside each container/library. It is not exhaustive; it focuses on the pieces engineers tend to touch when extending “run → export → compare → replay”. | Area | Role | Typical types | |------|------|----------------| | **`ArchLucid.Persistence.Data.*`** | ADO.NET/Dapper for the **run/commit
**Headings:** ArchLucid architecture (Components); Workflow data access vs authority persistence (both in `ArchLucid.Persistence`); `ArchLucid.Api` components; Connection bridging (SQL); Dual manifest / trace repository interfaces; Governance persistence; Rate limiting on controllers; Production configuration safety

#### `library/ARCHITECTURE_CONSTRAINTS.md`
**Scope:** **Scope:** Architecture constraint tests (NetArchTest) - full detail, tables, and links in the sections below.
**Title:** Architecture constraint tests (NetArchTest)
**Summary:** Automated checks that selected **ArchLucid** assemblies respect layering and dependency boundaries. Implementation: **`ArchLucid.Architecture.Tests`** ([`DependencyConstraintTests.cs`(../../ArchLucid.Architecture.Tests/DependencyConstraintTests.cs)), using **[NetArchTest.Rules](https://github.com/BenMorris/NetArchTest)** (central version in [`Directory.Packages.props`(../../Directory.Packages.props)). **See also:** [ARCHITECTURE_COMPONENTS.md](ARCHITECTURE_COMPONENTS.md) (what each module is for), [TEST_EXECUTION_MODEL.md](TEST_EXECUTION_MODEL.md) (how `Suite=Core` and fast-core filters run in CI and locally). Catch **accidental coupling** early: foundation assemblies pulling in hosts, domai
**Headings:** Architecture constraint tests (NetArchTest); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; Why Tier 4 uses assembly metadata for `ArchLucid.Api`; 5. Component breakdown; 6. Data flow

#### `library/ARCHITECTURE_CONTAINERS.md`
**Scope:** **Scope:** ArchLucid architecture (Containers) - full detail, tables, and links in the sections below.
**Title:** Architecture Containers
**Summary:** **Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) **Product name:** **ArchLucid**. **`ArchLucid.*`** below refers to deployable projects and libraries until the bulk rename phases in `docs/library/V1_DEFERRED.md`. This is a pragmatic C4 “containers” view: **deployable processes** and major libraries, with their responsibilities and relationships. **Responsibility** - HTTP surface for all run/execution/export/compare/replay workflows. - API versioning (`/v1/...`), rate limiting, and API-key auth. - Wires up DI for Application, Persistence (workflow `Data.*` + authority SQL), Decisioning (merg
**Headings:** ArchLucid architecture (Containers); Container: `ArchLucid.Api` (ASP.NET Core Web API); Container: `ArchLucid.Cli` (dotnet tool / CLI); Library: `ArchLucid.Application` (application services); Library: `ArchLucid.Decisioning` (governance, advisory, merge, domain models); Library: `ArchLucid.Persistence` (SQL Server authority + operational data); Library: `ArchLucid.KnowledgeGraph` (graph snapshots); Library: `ArchLucid.ContextIngestion` (context pipeline)

#### `library/ARCHITECTURE_CONTEXT.md`
**Scope:** **Scope:** ArchLucid architecture (Context) - full detail, tables, and links in the sections below.
**Title:** Architecture Context
**Summary:** **Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) **Product name:** **ArchLucid**. Legacy identifiers may still read **ArchLucid** in code and configuration (incremental rename; see `docs/library/V1_DEFERRED.md`). Project and namespace names below use **`ArchLucid.*`** until bulk rename phases in V1_DEFERRED §3 complete. ArchLucid is a .NET API that orchestrates AI-assisted architecture design. It accepts an `ArchitectureRequest`, coordinates agent tasks/results, merges results into a versioned manifest, and produces exports, comparisons, and replayable artifacts. This document is written for **internal engin
**Headings:** ArchLucid architecture (Context); Purpose; Primary capabilities; System boundary and actors; External dependencies (runtime); Key quality attributes (what we optimize for); Context ingestion; Where to go next

#### `library/ARCHITECTURE_FLOWS.md`
**Scope:** **Scope:** ArchLucid architecture (Key flows) - full detail, tables, and links in the sections below.
**Title:** Architecture Flows
**Summary:** **Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) This doc describes the main runtime flows in “sequence narrative” form. It’s meant to be readable without diagrams. **Goal:** Turn an `ArchitectureRequest` into a committed, versioned golden manifest. **Important:** There are **two ways** the product reaches that outcome. **`POST /v1/architecture/request`** always persists the run and, on **SQL storage**, enters **`IAuthorityRunOrchestrator`** (context ingestion → knowledge graph → findings → decisioning → artifact synthesis) via **`AuthorityPipelineStagesExecutor`**. Separately, a **legacy coordina
**Headings:** ArchLucid architecture (Key flows); Flow A: Run lifecycle (request → committed manifest); A0 — Authority pipeline (ingestion → graph → findings → artifacts); A0b — Legacy coordinator path (`execute` / `result` / `commit`); Flow A1: Decision tree (which path am I on?); Flow B: Export lifecycle (build → persist record → replay); Flow C: Comparison lifecycle (compare → persist record → replay/export → verify drift); C1: Create and persist an end-to-end run comparison

#### `library/ARCHITECTURE_INVARIANTS.md`
**Scope:** **Scope:** Engineering-maintained catalog of cross-cutting architecture invariants ArchLucid intends to enforce via code, tests, and ops; audience is contributors and reviewers; not buyer-facing trust claims or a substitute for ADRs.
**Title:** Architecture invariant catalog
**Summary:** **Last updated:** 2026-05-09 **Normative decisions** that conflict with this catalog belong in a new or amended [Architecture Decision Record](../architecture/adrs/README.md); this file is the **checklist and ID registry** for enforcement work tracked in [`TECH_BACKLOG.md`](TECH_BACKLOG.md). **Conformance today:** Mixed. Several invariants partially hold by convention only. Rows below state **intent**, **why it matters**, **enforcement sketch**, and **relation to shipped decisions** where applicable. | ID | Invariant (one sentence) | Tier | Enforcement sketch | |----|--------------------------|------|---------------------| | [INV-001](#inv-001-tenant-identity-boundary) | Tenant identity is e
**Headings:** Architecture invariant catalog; INV-001: Tenant identity boundary; INV-002: Structural execution mode; INV-003: Audit path contracts; INV-004: Durable cost guardrails; INV-005: Production host fail-closed; INV-006: Single composition root; INV-007: Injected time

#### `library/ARCHITECTURE_ON_A_PAGE.md`
**Scope:** **Scope:** Architecture on a page (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** Architecture on a page (ArchLucid)
**Summary:** **Prefer for C4 + ownership:** **[ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md)** (Prompt 12 canonical poster). This page keeps the **structured architecture-output** narrative (objective → operational considerations) and the **legacy flowchart** block. Give architects and operators a **single-page** view of **nodes, edges, and trust boundaries** so the system can be redrawn as a C4 or sequence diagram without re-reading the whole repo. - Deployments use **Azure-first** patterns (Container Apps, SQL, private networking) unless a pilot explicitly diverges. - **Incomplete requirements** and **imperfect rollout** are normal; the design favors **observable backlogs** (outboxes, he
**Headings:** Architecture on a page (ArchLucid); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `library/ARCHITECTURE_REQUEST_WIRE_FORMAT.md`
**Scope:** **Scope:** Wire-format summary for **`POST /v1/architecture/request`** — integrators should treat **`GET /openapi/v1.json`** as authoritative for property names, required fields, and validation rules. This page orients readers to the C# contract type and starter JSON.
**Title:** Architecture request wire format
**Summary:** The HTTP body is **`ArchLucid.Contracts.Requests.ArchitectureRequest`** ([`ArchitectureRequest.cs`](../../ArchLucid.Contracts/Requests/ArchitectureRequest.cs)). The API does not use a separate `CreateRunRequest` DTO for this route. - **`POST /v1/architecture/request`** — see OpenAPI **`GET /openapi/v1.json`** for response codes, auth, and schemas. | Area | Members | |------|---------| | Identity | **`requestId`** (required, client-stable id), **`systemName`**, **`environment`** (default `prod`) | | Narrative | **`description`** (required, min length 10), **`inlineRequirements`** | | Target | **`cloudProvider`** (defaults to Azure in the contract) | | Lists | **`constraints`**, **`requiredCap
**Headings:** Architecture request wire format; Binding type; Endpoint; Field overview (human-oriented); Starter JSON on disk; Related

#### `library/ASSESSMENT_INPUTS.md`
**Scope:** **Scope:** Minimal read list for LLM-driven weighted readiness / first-principles assessments; audience is coding agents and the owner; not a customer or operator deliverable. Expand beyond this list only when the user asks a scoped question (for example UI-only or billing-only).
**Title:** Assessment inputs (canonical read list)
**Summary:** Use this sequence so **headline readiness** never mixes with **historical narrative**: 1. **Inputs** — This file’s table is the **evaluation contract** (what evidence counts before broad repo scans). 2. **Boundary** — **`(A)` headline V1 readiness** vs **`(B)` procurement realism** follows **`Assessment-Scope-V1_1.mdc`** (**`@Assessment-Scope-V1_1`**) and the standing boundary bullets in the **rolling weighted pass** under **`docs/assessments/`**. 3. **Score** — **One current weighted outcome:** that **rolling pass file** only (executive summary + dimensions). Do not cite archived snapshots as today’s number. 4. **Backlog** — Action queue and improvement ID
**Headings:** Assessment inputs (canonical read list); One workflow (current score vs history)

#### `library/AUDIT_COVERAGE_MATRIX.md`
**Scope:** **Scope:** Audit coverage matrix - full detail, tables, and links in the sections below.
**Title:** Audit coverage matrix
**Summary:** This document maps **state-changing** workflows to the audit signals they emit. ArchLucid has two parallel **channels** that share one **string catalog** in `ArchLucid.Core.Audit.AuditEventTypes`: 1. **Durable SQL audit** — `IAuditService.LogAsync` → `IAuditRepository.AppendAsync` → `dbo.AuditEvents` (`ArchLucid.Core.Audit.AuditEvent`). Event types use **top-level** `AuditEventTypes.*` constants (e.g. `RunStarted`, `GovernanceApprovalSubmitted`). 2. **Baseline mutation log** — `IBaselineMutationAuditService.RecordAsync` → structured **ILogger** lines only (`ArchLucid.Application.Common.BaselineMutationAuditService`). Event types use **`AuditEventTypes.Baseline.Architecture.*`** and **`AuditE
**Headings:** Audit coverage matrix; Design notes (ADR-style); Indexes on `dbo.AuditEvents`; Audit retrieval and export (read paths; no new `IAuditService` row); Operations → durable audit (`IAuditService` → `dbo.AuditEvents`); Baseline mutation logging only (`IBaselineMutationAuditService` — not `dbo.AuditEvents`); Known gaps (mutating behavior without durable `IAuditService` event); Mutating / lifecycle — verified

#### `library/AUDIT_RETENTION_POLICY.md`
**Scope:** **Scope:** Audit retention policy - full detail, tables, and links in the sections below.
**Title:** Audit retention policy
**Summary:** This document exists to make the **audit data lifecycle** explicit for three audiences: 1. **Regulatory / assurance** — Auditors and security reviewers need a written statement of how long audit evidence remains queryable in the primary database, how bulk extraction works, and where long-term copies should live. 2. **Operations** — Platform operators need a default tiering model (hot / warm / cold) so capacity planning, backup scope, and export automation are aligned. 3. **Cost** — `dbo.AuditEvents` is **append-only** (see **Database enforcement**). Without exports and eventual archival, the table grows without bound, increasing storage, backup size, and index maintenance cost. Related mater
**Headings:** Audit retention policy; Purpose; Retention tiers; Database enforcement; Export workflow; Example: periodic CSV export (`curl`); Regulatory considerations; Future enhancements

#### `library/AZURE_APP_CONFIGURATION_FUTURE_ADOPTION.md`
**Scope:** **Scope:** Azure App Configuration — future adoption plan - full detail, tables, and links in the sections below.
**Title:** Azure App Configuration — future adoption plan
**Summary:** **Companion to:** [ADR 0017](../architecture/adrs/0017-azure-app-configuration-deferred.md) **Status:** Plan-only (not yet adopted) **Last reviewed:** 2026-04-18 Provide a low-risk migration path to **Azure App Configuration** when one of the **revisit triggers** in ADR 0017 fires, without rewriting host bootstrap or breaking local development. - The team accepts the recurring spend documented in ADR 0017. - Key Vault is already provisioned per env (it is; `appsettings.KeyVault.sample.json`, `SECRET_AND_CERT_ROTATION.md`). - All host paths use `IConfiguration` only — no static config singletons (verified in current code). - Must remain **fully runnable offline** (inner loop, CI). No mandator
**Headings:** Azure App Configuration — future adoption plan; Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow (boot); Security model

#### `library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`
**Scope:** **Scope:** Engineering backlog for the customer Azure extractor ZIP path, Terraform export, and citations — extends `docs/library/V1_SCOPE.md` sections 2.16–2.17; not procurement copy.
**Title:** Azure extractor and Terraform export — technical backlog
**Summary:** This file tracks **remaining** work after the initial ingest API, MVP PowerShell collector, CLI `aztfexport` wrapper, citation helper, and buyer-facing trust/runbook text. - `POST /v1/azure-extractor/upload` with `manifest.json` schema **1** enforcement, **52 MiB** ZIP cap, optional `runId` association, SQL persistence (`dbo.AzureExtractorPackages`), audit events (`AzureExtractorPackage.*`). - `scripts/azure/Get-ArchLucidAzurePackage.ps1`: **read-only** `Get-AzResource` inventory to `manifest.json`, `resources.json`, `README.txt` (cost/advisor/retail flags warn-only until extended). - `archlucid azure terraform-export`: non-interactive **resource-group** mode wrapping `aztfexport`, adds `ADV
**Headings:** Azure extractor and Terraform export — technical backlog; Shipped in this iteration (baseline); Backlog (prioritized)

#### `library/AZURE_PRODUCTION_PROFILE.md`
**Scope:** **Scope:** Canonical Azure production profile for multi-tenant ArchLucid SaaS — summary only; advanced roots remain documented separately.
**Title:** Azure production profile (ArchLucid multi-tenant SaaS)
**Summary:** **Objective:** Give platform engineers **one** default production posture aligned with recorded 2026-05-07 decisions (**multi-tenant production SaaS** first). **Assumptions:** Hosting targets Azure; Terraform is the infrastructure language of record; no SMB/445 public exposure (see workspace security rule). 1. **Profile orchestration:** start from [`infra/terraform-pilot/README.md`](../../infra/terraform-pilot/README.md) — `terraform plan`/`apply` for sequencing outputs (this root validates ordering; it does not emit resources). 2. **Private foundation:** [`infra/terraform-private`](../../infra/terraform-private) for VNet, private endpoints, and DNS **before** data planes that require privat
**Headings:** Azure production profile (ArchLucid multi-tenant SaaS); Default path (apply order); Security, scale, cost; Where this doc lives in the map

#### `library/AZURE_SUBSCRIPTIONS.md`
**Scope:** **Scope:** Canonical mapping of ArchLucid Azure subscriptions, the regions and tenants they target, and where each ID is consumed (CD pipeline, Terraform, runbooks).
**Title:** Azure subscriptions (ArchLucid)
**Summary:** **Last updated:** 2026-04-25 **Owner:** Platform / Operations (decision recorded by repo owner) **Status:** Single source of truth — every other doc links here. Do not duplicate the production GUID anywhere else in the repo. Give platform engineers and CD/CI authors **one** place to look up: - Which Azure subscription each ArchLucid environment lives in. - Which **GitHub Environment secret** in [`cd.yml`(../../.github/workflows/cd.yml) maps to which subscription. - Where (and where **not**) the subscription ID is allowed to appear in source. This file replaces the prior "ask a person" pattern and resolves item 1 of [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md). - ArchLucid runs in **two*
**Headings:** Azure subscriptions (ArchLucid); 1. Objective; 2. Assumptions; 3. Constraints; 4. Subscription map; 5. Where the subscription ID is consumed; 5.1 CD pipeline (GitHub Actions); 5.1.1 GitHub Environment `dev` (ArchLucid DEV subscription)

#### `library/BACKGROUND_JOB_CORRELATION.md`
**Scope:** **Scope:** Background job correlation (Activity + Serilog) - full detail, tables, and links in the sections below.
**Title:** Background job correlation (Activity + Serilog)
**Summary:** Keep **end-to-end traceability** when work leaves the HTTP pipeline: every background processor that drains an outbox or runs retention must expose the same **logical correlation id** in **OpenTelemetry spans** and in **structured logs** (Serilog `CorrelationId`), so operators can jump from a log line to a trace or vice versa. - HTTP correlation is already correct (`CorrelationIdMiddleware` → `Activity` tag `correlation.id` → Serilog `LogContext`). This document covers **non-HTTP** entry points only. - **Serilog does not read OTel tags automatically** (`Enrich.FromLogContext()` only sees pushed properties). Both channels must be set. - **No new SQL columns** for correlation: synthetic ids ar
**Headings:** Background job correlation (Activity + Serilog); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `library/BILLING.md`
**Scope:** **Scope:** Billing — provider abstraction (Stripe + Azure Marketplace) - full detail, tables, and links in the sections below.
**Title:** Billing — provider abstraction (Stripe + Azure Marketplace)
**Summary:** Provide a **single** `IBillingProvider` surface for trial conversion checkout and provider webhooks so HTTP controllers stay stable when payment channels change. - Operators may start with **Stripe** (broad SaaS default) and later prefer **Azure Marketplace** for Azure-native procurement. - Webhooks are **unauthenticated HTTP** endpoints; trust is established only via **cryptographic verification** (Stripe signature or Microsoft-issued JWT). - **No run content** or architecture payloads are sent to payment providers; only commercial metadata (tier, seat counts, scope ids). - **Migration 078** (`078_BillingSubscriptions.sql`) is the forward migration; **074** is already used for trial seat oc
**Headings:** Billing — provider abstraction (Stripe + Azure Marketplace); Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `library/BILLING_WEBHOOKS.md`
**Scope:** **Scope:** Short entry for operators: webhook URLs and where the full billing design lives — not a substitute for the canonical architecture doc in `docs/library/`.
**Title:** Billing documentation (entry)
**Summary:** **Canonical reference:** [Billing — provider abstraction (Stripe + Azure Marketplace)](library/BILLING.md) (architecture, data flow, security, provider matrix). Register these on the public API host in Stripe Dashboard and Partner Center: - `POST /v1/billing/webhooks/stripe` - `POST /v1/billing/webhooks/marketplace` Implementation: `ArchLucid.Api` billing webhook controllers under route prefix `v{version}/billing/webhooks`.
**Headings:** Billing documentation (entry); Webhook routes (API)

#### `library/BUILD.md`
**Scope:** **Scope:** Redirect — moved 2026-04-23 to **`docs/engineering/BUILD.md`** as part of the SaaS-framing reconciliation (build & test hygiene is contributor / internal-engineer scope).
**Title:** Build & project hygiene — moved
**Summary:** The contributor / internal-engineer build & project hygiene reference now lives at: **[docs/engineering/BUILD.md](../engineering/BUILD.md)** This stub stays so existing bookmarks keep resolving. New links should point at the new path.
**Headings:** Build & project hygiene — moved

#### `library/BUYER_SCALABILITY_FAQ.md`
**Scope:** **Scope:** Buyer-facing scalability FAQ — V1 single-region posture, explicit non-promises, practical scale levers, and in-repo load evidence (no marketing SLA claims).
**Title:** Buyer scalability FAQ
**Summary:** **Audience:** Procurement, solution architecture, and platform buyers who need short answers tied to repository sources. **Last reviewed:** 2026-04-29 This page summarizes what the **V1** contract does and does **not** promise for scale and geography, where to read **RTO/RPO planning targets** (not automatic product SLAs), which **operational knobs** the docs describe, and what **load-test evidence** exists in CI and baselines. - **V1 describes supportable product scope today**, not a roadmap of net-new scale guarantees — see the opening framing in [`V1_SCOPE.md`](V1_SCOPE.md) (**Status** / §1). - **Multi-region active/active SaaS is not a V1 guarantee.** [`V1_SCOPE.md`](V1_SCOPE.md) §3 list
**Headings:** Buyer scalability FAQ; 1. V1 posture and explicit non-promises; 2. Practical scale-up levers (documentation pointers); 3. Load and performance evidence in-repo; 4. Related

#### `library/CANONICAL_PIPELINE.md`
**Scope:** **Scope:** Canonical operator pipeline — request through commit; links to deeper architecture docs below.
**Title:** Canonical run pipeline (operator view)
**Summary:** **Objective:** Give operators and sponsors a single mental model for how work flows from request to committed manifest and artifacts, without implementation seam vocabulary. **Assumptions:** You use the operator UI or public APIs with a normal tenant scope. Storage is SQL-backed with row-level security. **Constraints:** Detailed contributor maps and ADR receipts live under `docs/architecture/adrs/` and `docs/archive/dual-pipeline-navigator-superseded.md` for engineering-only deep dives.
**Headings:** Canonical run pipeline (operator view); Architecture overview; Where to read next; Security model; Operational considerations

#### `library/CAPACITY_AND_COST_PLAYBOOK.md`
**Scope:** **Scope:** Capacity and cost playbook - full detail, tables, and links in the sections below.
**Title:** Capacity and cost playbook
**Summary:** Give operators a **first-principles** way to scale ArchLucid/ArchLucid and control **Azure spend** without over-provisioning from day one. - **Traffic grows unevenly**; teams may lack perfect forecasts. - **Private networking** and **managed identity** are preferred over shared keys. - **Reliability** targets are environment-specific; this playbook suggests **indicators**, not universal SLOs. - **FinOps** tags (`llm_provider`, `llm_deployment`) exist on token counters when enabled — watch **cardinality** in Prometheus. **Bottleneck classes:** API CPU/memory, Worker throughput, **SQL DTU/vCore**, **LLM token rate**, **Service Bus** throughput, **egress** from blob/diagnostic logs. | Layer | S
**Headings:** Capacity and cost playbook; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `library/CHAOS_TESTING.md`
**Scope:** **Scope:** Chaos-style resilience tests - full detail, tables, and links in the sections below.
**Title:** Chaos-style resilience tests
**Summary:** **Objective**: Catch regressions in retry and circuit-breaker wiring before production incidents. | Mechanism | When | Purpose | |-----------|------|---------| | **Main CI — job `Resilience: Simmy chaos tests` (`chaos-tests`)** | Every push / PR to `main` or `master`, after **`.NET: full regression (SQL)`** succeeds | Runs `ArchLucid.AgentRuntime.Tests` and `ArchLucid.Persistence.Tests` with the same Simmy/Chaos FQN filter as `simmy-chaos-scheduled.yml`; uploads TRX as artifact **`chaos-test-results`**. | | **`.github/workflows/simmy-chaos-scheduled.yml`** | Quarterly cron (**14:00 UTC** on calendar dates in [`docs/quality/game-day-log/README.md`](../quality/game-day-log/README.md)) + manual
**Headings:** Chaos-style resilience tests; CI and scheduled runs; CI enforcement

#### `library/CI_MIGRATION_CHECKLIST.md`
**Scope:** **Scope:** CI migration and demo seeding regression loop - full detail, tables, and links in the sections below.
**Title:** CI migration and demo seeding regression loop
**Summary:** This document describes the minimum checks that must pass whenever a SQL migration, a demo seeding change, or a `DemoSeedService` / `IDemoSeedService` change lands. Run these locally before pushing; they must also run in CI on every PR. - `DemoSeedService` is idempotent by design — running it twice must not throw or duplicate data. - Every DbUp migration must be idempotent (`IF NOT EXISTS`, `IF OBJECT_ID IS NULL`, etc.). - `ArchLucid.sql` (greenfield SQL Server) must stay in sync with migration `0NN_*.sql` files, or greenfield bootstrap drifts from DbUp-upgraded databases. Run these commands from the repo root before every push that touches SQL or seeding:
**Headings:** CI migration and demo seeding regression loop; Why this matters; Local pre-push loop; 1. Build everything — catches CS errors in seeding or repo changes; 2. Run the DemoSeedService idempotency test; 3. Run the migration ordering / content tests; 3b. Forward migration + consolidated DDL co-touch (merge-blocking in CI; needs full git history); 4. Run all unit-category tests (fast, no API stack)

#### `library/CLI_API_IMPLEMENTATION_PLAN.md`
**Scope:** **Scope:** Step-by-Step Implementation Plan: CLI–API Architecture - full detail, tables, and links in the sections below.
**Title:** Step-by-Step Implementation Plan: CLI–API Architecture
**Summary:** Repository-specific plan for **ArchLucid**: CLI calling the ArchLucid API. Includes order of work, files to create or modify, and tests to add. | Component | Status | Location | |-----------|--------|----------| | Config + URL resolution | Done | `ArchLucid.Cli/ArchLucidProjectScaffolder.cs`, `ArchLucid.Cli/Program.cs` | | HTTP client (ArchLucidApiClient) | Done | `ArchLucid.Cli/ArchLucidApiClient.cs` | | CLI commands (run, status, submit, commit, seed, artifacts, health, dev up, new) | Done | `ArchLucid.Cli/Program.cs` | | CLI test project | Done | `ArchLucid.Cli.Tests/ArchLucid.Cli.Tests.csproj` | | Config / URL resolution tests | Done | `ArchLucid.Cli.Tests/ArchLucidCliConfigTests.cs` (`A
**Headings:** Step-by-Step Implementation Plan: CLI–API Architecture; Current State; Order of Work; Phase 1: Create CLI Test Project; Files to create; Files to modify; Tests to add; Validation

#### `library/CLI_USAGE.md`
**Scope:** **Scope:** ArchLucid CLI Reference - full detail, tables, and links in the sections below.
**Title:** ArchLucid CLI Reference
**Summary:** Reference for the ArchLucid CLI: commands, configuration, and API URL behavior. From the solution root:
**Headings:** ArchLucid CLI Reference; Running the CLI; Global `--json`; API URL; Commands; archlucid try; What it does, in order; Flags

#### `library/CODEQL_MERGE_AND_LOCAL.md`
**Scope:** **Scope:** Operators & developers — branch protection, strict SARIF gate in CI, and local CodeQL CLI parity; not per-alert triage (see [CODEQL_TRIAGE.md](CODEQL_TRIAGE.md)).
**Title:** CodeQL merge gates and local runs (ArchLucid)
**Summary:** The workflow [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml) runs on pull requests to **`main`** / **`master`**. After analysis it writes SARIF under **`csharp-sarif/`** and **`javascript-sarif/`** and runs [`scripts/ci/assert_codeql_sarif_clean.py`](../../scripts/ci/assert_codeql_sarif_clean.py), which **fails the job** if any non-suppressed SARIF result exists (excluding **`note`** / **`none`** severities). **Branch protection (recommended):** In the GitHub repo, open **Settings → Branches → Branch protection rule** for **`main`** (and **`master`** if used). Under **Require status checks to pass before merging**, require at least: - **`CodeQL (csharp)`** — C# job (incl
**Headings:** CodeQL merge gates and local runs (ArchLucid); 1. Merge-blocking checks (GitHub — no Cursor usage); 2. Cursor / VS Code extension (local IDE); 3. Local CLI (C#) — mirror CI before you push; Related

#### `library/CODEQL_TRIAGE.md`
**Scope:** **Scope:** CodeQL triage (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** CodeQL triage (ArchLucid)
**Summary:** Short guide for **security-and-quality** (or **javascript-typescript-security-and-quality**) workflows. Use this when alerts look like noise after mitigations are in place. Treat as a **real issue** when an **`ILogger`** call logs a **`string`-typed** parameter that comes from untrusted HTTP surface area, for example: - **`[FromBody]`** DTO string properties - **`[FromQuery]`** / **`[FromHeader]`** string parameters - **`HttpContext.Request.Path`** (or **`.Path.Value`**) and similar raw path strings **Fix:** pass the value through **`LogSanitizer.Sanitize()`** from **`ArchLucid.Core.Diagnostics`** before logging. See **`docs/SECURITY.md`** (Log injection / CWE-117). Built-in **`cs/log-forgin
**Headings:** CodeQL triage (ArchLucid); Log entries created from user input (CWE-117); True positives; CodeQL model pack (`cs/log-forging` and `LogSanitizer`); `LoggerExtensions.LogWarning(ILogger, Exception?, string?, params object?[])` (boxing); False positives; Known alerts to triage (run / approval identifiers); Operational keys and `cs/exposure-of-sensitive-information`

#### `library/CODE_MAP.md`
**Scope:** **Scope:** Code map (where to open first) - full detail, tables, and links in the sections below.
**Title:** Code map (where to open first)
**Summary:** Reduce time-to-orientation for a developer or SRE by listing **high-signal paths** aligned to **interfaces → services → data → orchestration**. - You build with **.NET 10** and **C#**; UI with **Next.js** under `archlucid-ui/`. - This map is **not** exhaustive; grep and `docs/DI_REGISTRATION_MAP.md` fill gaps. - **Change checklist (controller → app → SQL → audit):** [GOLDEN_CHANGE_PATH.md](GOLDEN_CHANGE_PATH.md). **Flow:** `ArchLucid.Api` / `ArchLucid.Worker` → `Host.Composition` (DI) → `Application` + `Persistence` → SQL / Azure services. | Concern | Path | |---------|------| | API startup | `ArchLucid.Api/Program.cs`, `ArchLucid.Api/Startup/` | | Auth + ArchLucid bridge | `ArchLucid.Api/Au
**Headings:** Code map (where to open first); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `library/COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md`
**Scope:** **Scope:** ArchLucid Commercial Boundary Hardening Sequence - full detail, tables, and links in the sections below.
**Title:** ArchLucid Commercial Boundary Hardening Sequence
**Summary:** **Audience:** product, sales, architecture, and go-to-market stakeholders who need a practical sequence for turning ArchLucid’s current layer model into stronger commercial boundaries over time. **Status:** Future-state commercialization guidance. This document does **not** implement licensing, billing, entitlement, or pricing enforcement. It explains **how boundary hardening should happen in sequence** so the product gains commercial discipline without damaging the Core Pilot wedge. **Related:** [FUTURE_PACKAGING_ENFORCEMENT.md](FUTURE_PACKAGING_ENFORCEMENT.md) · [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) · [EXECUTIVE_SPONSOR_BRIEF.md](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) · [PILOT_
**Headings:** ArchLucid Commercial Boundary Hardening Sequence; 1. Why sequencing matters; 2. Guiding rule; 3. What should stay soft for now; 4. Stage 1 hardening — stronger role clarity and UI-native shaping; Objective; Hardening moves; Why this comes first

#### `library/COMMERCIAL_ENFORCEMENT_DEBT.md`
**Scope:** **Scope:** For engineers and reviewers: documents current commercial-tier API enforcement behavior; not an entitlement matrix, SKU roadmap, or policy for changing 404 vs 402 semantics.
**Title:** Commercial tier enforcement (`[RequiresCommercialTenantTier]`) — as-built
**Summary:** **Date:** 2026-04-30 Endpoints decorated with `[RequiresCommercialTenantTier(TenantTier.Standard)]` (or **`Enterprise`** where noted) are filtered by **`CommercialTenantTierFilter`**, which loads **`dbo.Tenants.Tier`** for the current scope. When the authenticated principal’s tenant tier is **below** the required tier: - **`TenantTier.Standard`** minimum → **`HTTP 403 Forbidden`** with **`ProblemTypes.PackagingTierInsufficient`** via **`PackagingTierProblemDetailsFactory.CreateTenantProductInsufficientTier`** — explicit tenant-visible entitlement signal (not **`402 Payment Required`**). - **`TenantTier.Enterprise`** minimum → **`HTTP 404 Not Found`** via **`PackagingTierProblemDetailsFactory
**Headings:** Commercial tier enforcement (`[RequiresCommercialTenantTier]`) — as-built; Behavior; Controllers / routes using the attribute — inventory; `TenantTier.Standard` (controller scope); `TenantTier.Standard` (selected action only — Pilot host); `TenantTier.Enterprise` (action scope); Debt / follow-ons (not in this doc’s scope); References

#### `library/COMMERCIAL_TIER_CODE_ALIGNMENT.md`
**Scope:** **Scope:** Audit mapping `docs/go-to-market/PRICING_PHILOSOPHY.md` packaging rows to implemented API tier enforcement (`dbo.Tenants.Tier`).
**Title:** Commercial tier ↔ code alignment audit
**Summary:** **Pricing source of truth:** [PRICING_PHILOSOPHY.md](../go-to-market/PRICING_PHILOSOPHY.md) (feature gate table §3). **Runtime tier model:** [`TenantTier`](../../ArchLucid.Core/Tenancy/TenantTier.cs) persisted on `dbo.Tenants.Tier` (`Free`, `Standard`, `Enterprise`). **`[RequiresCommercialTenantTier]`** + [`CommercialTenantTierFilter`](../../ArchLucid.Api/Filters/CommercialTenantTierFilter.cs) enforce minimum tier on decorated controllers. | Packaging label (PRICING_PHILOSOPHY) | Typical `TenantTier` after conversion | Notes | |--------------------------------------|---------------------------------------|-------| | Team (incl. self-serve trial posture) | `Free` | Trial / Team-equivalent wor
**Headings:** Commercial tier ↔ code alignment audit; Mapping (product labels → stored enum); Feature gates declared in pricing vs primary code anchor; Authority commit / golden manifest schema

#### `library/COMPARISON_REPLAY.md`
**Scope:** **Scope:** Comparison replay in ArchLucid - full detail, tables, and links in the sections below.
**Title:** Comparison Replay
**Summary:** Comparison replay lets you take a **previously persisted comparison record** and: - Regenerate the comparison summary from the stored payload - Export the comparison again in various formats (Markdown / HTML / DOCX / PDF\*) - Optionally **persist the replay** as a new comparison record - Optionally **verify** that a regenerated comparison still matches the stored payload Supported comparison types: - **End-to-end replay** – full run‑vs‑run comparison (`ComparisonType = "end-to-end-replay"`) - **Export-record diff** – diff between two export records (`ComparisonType = "export-record-diff"`) \*PDF is currently supported for end‑to‑end replay only. - **Comparison record** (`ComparisonRecord`) C
**Headings:** Comparison replay in ArchLucid; Core concepts; Replay request models; Replay endpoints; 1. Replay as file; Comparison record search (paging + sorting); 2. Replay metadata only; Typical flows

#### `library/CONCEPTS_IN_5_MINUTES.md`
**Scope:** **Scope:** One-page conceptual map for new evaluators/contributors — not a substitute for ARCHITECTURE_ON_ONE_PAGE.md or detailed runbooks.
**Title:** ArchLucid concepts in five minutes
**Summary:** **Audience:** first-time operators, pilot engineers, or sponsors skimming before a guided session.
**Headings:** ArchLucid concepts in five minutes; Diagram (mental model); Seven terms (plain language); What happens when I create a run?; Where to go next

#### `library/CONCEPT_VOCABULARY.md`
**Scope:** **Scope:** Writer-facing canonical-vs-rejected vocabulary for docs and copy — not the five-minute mental model (`CONCEPTS_IN_5_MINUTES.md`); not term definitions (`GLOSSARY.md`).
**Title:** Concept vocabulary (canonical forms)
**Summary:** **Relationship:** - **[`GLOSSARY.md`](GLOSSARY.md)** — *"What does X mean?"* - **[`CONCEPTS_IN_5_MINUTES.md`](CONCEPTS_IN_5_MINUTES.md)** — quick mental model for new readers - **This file** — *"If two phrasings exist, which is canonical in our docs?"* > **CI guard.** [`scripts/ci/check_concept_vocabulary.py`](../../scripts/ci/check_concept_vocabulary.py) enforces the rules in **§ 1.1** only. This file may quote rejected forms in rationale text and is excluded from the scan. § 1.1 tabulates canonical wording vs. rejected alternatives (full rejected spellings only in [`CONCEPT_VOCABULARY.md`](CONCEPT_VOCABULARY.md); example canonical: **Microsoft Entra ID**).
**Headings:** Concept vocabulary (canonical forms); 1 Canonical vocabulary; 1.1 CI-enforced rules; 1.2 Reviewer-enforced rules (not yet automated); 2 Promoting a new rule; 3 Related

#### `library/CONFIGURATION_KEY_VAULT.md`
**Scope:** **Scope:** Key Vault references for secrets (Azure) - full detail, tables, and links in the sections below.
**Title:** Key Vault references for secrets (Azure)
**Summary:** Production and shared environments should **not** store SQL connection strings, OpenAI API keys, or long-lived API keys in `appsettings.*.json` committed to git. 1. Create an Azure Key Vault and store each secret (e.g. `archlucid-sql-connection-string`, `archlucid-azure-openai-api-key`). 2. Grant the API’s managed identity **Get** permission on secrets. 3. In **Azure App Service** → **Configuration** → **Application settings**, set each setting to a [Key Vault reference](https://learn.microsoft.com/azure/app-service/app-service-key-vault-references): - `ConnectionStrings__ArchLucid` → `@Microsoft.KeyVault(VaultName=...;SecretName=archlucid-sql-connection-string)` - `AzureOpenAI__ApiKey` → `@
**Headings:** Key Vault references for secrets (Azure); Pattern; Local first-real-value (`docker-compose.real-aoai.yml`); Sample file; Terraform

#### `library/CONFIGURATION_REFERENCE.md`
**Scope:** ﻿> **Scope:** Operators and integrators looking up recognized configuration keys and host roles — not secret material, deployment order, or full environment architecture.
**Title:** Configuration reference
**Summary:** ﻿> **Scope:** Operators and integrators looking up recognized configuration keys and host roles — not secret material, deployment order, or full environment architecture. This document lists operator-facing configuration **keys** (colon paths or environment names) recognized by `archlucid config check` and by `GET /v1/admin/config-summary` / `GET /v1/admin/configuration/summary` (presence plus optional redacted scalars; never raw secrets). **`GET /v1/admin/config-lint`** returns structured blocking/advisory lint rows (`OperatorConfigurationLintEvaluator` parity with `archlucid config lint`, optional advisor warnings). The **canonical registry** is `ConfigurationKeyCatalog` in `ArchLucid.Core
**Headings:** Configuration reference; Tooling; Hosting roles; Keys; Quick start by mode; Staged Critic (`ArchLucid:Agents:StagedCriticEnabled`)

#### `library/CONFIG_BRIDGE_SUNSET.md`
**Scope:** **Scope:** Configuration bridge — removed (Phase 7) - full detail, tables, and links in the sections below.
**Title:** Configuration bridge — removed (Phase 7)
**Summary:** **Phase 7 (2026-04-08):** Dual-read configuration bridges that merged **historic** keys (see **`BREAKING_CHANGES.md`**) have been **removed** from application code. Only **`ArchLucid*`**, **`ArchLucidAuth*`**, **`ConnectionStrings:ArchLucid`**, **`ARCHLUCID_*`**, and **`NEXT_PUBLIC_ARCHLUCID_*`** are read; obsolete keys/env names surface **warnings** only. **Warnings-only period:** legacy **`ArchiForge*`** configuration keys (connection string name, product section, auth section) are detected at API/Worker startup and logged; values are **ignored**. **Earliest hard enforcement:** not before **`2027-07-01`** (UTC calendar date). That date is also **`ArchLucidLegacyConfigurationWarnings.Legacy
**Headings:** Configuration bridge — removed (Phase 7); Status; Sunset timeline; Operator impact; Historical context; Security model; References

#### `library/CONNECTOR_READINESS_MATRIX.md`
**Scope:** **Scope:** ArchLucid — Single **buyer/implementer** view of integration surfaces: what is shipped vs recipe-only vs planned, how auth and secrets work, where to read code, which tests back claims, and how scope aligns with V1 / V1.1 / deferred items. Does not replace legal scope text in [`V1_SCOPE.md`](V1_SCOPE.md) or [`V1_DEFERRED.md`](V1_DEFERRED.md).
**Title:** Connector readiness matrix
**Summary:** **Audience:** Technical evaluators, buyers, and engineers wiring ArchLucid into an ecosystem. **Canonical GTM catalog (narrative + procurement copy):** [`../go-to-market/INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md) **Smoke recipes (first-party connectors):** [`../integrations/CONNECTOR_SMOKE_INDEX.md`](../integrations/CONNECTOR_SMOKE_INDEX.md) | Status label | Meaning | |--------------|---------| | **Shipped** | Product code paths exist; **automated** tests run in CI (mocks or API fixture). | | **Shipped + manual vendor** | Same as **Shipped**, plus operator **live** validation against the vendor (see smoke doc). | | **Recipe** | **Customer-operated** pattern under [`../i
**Headings:** Connector readiness matrix; Legend; Matrix; Related

#### `library/CONSULTING_DOCX_TEMPLATE.md`
**Scope:** **Scope:** Consulting DOCX template configuration - full detail, tables, and links in the sections below.
**Title:** Consulting DOCX template configuration
**Summary:** Document the **`ConsultingDocxTemplate`** and **`ConsultingDocxTemplateProfiles`** sections in `ArchLucid.Api/appsettings.json` (and environment-specific overrides). These settings drive branding, section toggles, and narrative defaults for consulting-style Word exports produced from architecture analysis. - Operators edit JSON or App Service / Key Vault–backed settings; no hot reload is assumed for template changes. - Hex colour strings are **without** a leading `#` (see existing samples in `appsettings.json`). | Key | Role | |-----|------| | **`OrganizationName`**, **`DocumentTitle`**, **`SubtitleFormat`**, **`GeneratedByLine`** | Cover and header copy. **`SubtitleFormat`** may include `{S
**Headings:** Consulting DOCX template configuration; Objective; Assumptions; Configuration sections; `ConsultingDocxTemplate`; `ConsultingDocxTemplateProfiles`; Operational notes; Related code

#### `library/CONTAINERIZATION.md`
**Scope:** **Scope:** Redirect — moved 2026-04-23 to **`docs/engineering/CONTAINERIZATION.md`** as part of the SaaS-framing reconciliation (containerization is contributor / vendor-operations scope; customer-facing deliverables are website + in-product UI).
**Title:** Containerization — moved
**Summary:** The containerization reference now lives at: **[docs/engineering/CONTAINERIZATION.md](../engineering/CONTAINERIZATION.md)** This stub stays so existing bookmarks keep resolving. New links should point at the new path.
**Headings:** Containerization — moved

#### `library/CONTEXT_INGESTION.md`
**Scope:** **Scope:** Context ingestion pipeline - full detail, tables, and links in the sections below.
**Title:** Context ingestion pipeline
**Summary:** `ArchLucid.ContextIngestion` turns heterogeneous inputs (description, inline requirements, pasted documents, policy references, topology/security hints, **structured infrastructure declarations**) into **`CanonicalObject`** instances, **enriches** topology/security metadata, **deduplicates** them, and stores a **`ContextSnapshot`** used by the knowledge graph and downstream authority chain. HTTP clients send **`ArchitectureRequest`** (see `ArchLucid.Contracts.Requests`). The coordinator maps it to **`ContextIngestionRequest`** via **`ContextIngestionRequestMapper.FromArchitectureRequest`**: | ArchitectureRequest field | ContextIngestionRequest field | Notes | |---------------------------|---
**Headings:** Context ingestion pipeline; Request model; File-backed connectors and SMB (port 445); Connector pipeline (fixed order); Optional properties for knowledge-graph targeting; Supported document content types (single source of truth); Document parsers; `PlainTextContextDocumentParser`

#### `library/CONTRACTS_ABSTRACTIONS_SPLIT.md`
**Scope:** **Scope:** ArchLucid.Contracts vs ArchLucid.Contracts.Abstractions (2026-04-07) - full detail, tables, and links in the sections below.
**Title:** ArchLucid.Contracts vs ArchLucid.Contracts.Abstractions (2026-04-07)
**Summary:** Split **service interfaces** out of `ArchLucid.Contracts` into `ArchLucid.Contracts.Abstractions` so consumers that only need DTOs can reference `ArchLucid.Contracts` without pulling in service abstractions. - `ArchLucid.Contracts.Abstractions` → references → `ArchLucid.Contracts` - `ArchLucid.Contracts` does **not** reference `ArchLucid.Contracts.Abstractions` `ArchLucid.Contracts.Abstractions` currently exposes these **cross-cutting port interfaces** (plus small integration DTOs next to Azure DevOps): | Interface | Folder | |-----------|--------| | `IAgentExecutor` | `Abstractions/Agents/` | | `IAgentHandler` | `Abstractions/Agents/` | | `IAzureDevOpsPullRequestDecorator` | `Abstractions/I
**Headings:** ArchLucid.Contracts vs ArchLucid.Contracts.Abstractions (2026-04-07); Objective; Dependency rule; Abstractions snapshot (maintained); Namespace strategy; XML documentation in `ArchLucid.Contracts`; Project references added; Verification

#### `library/CONTRACT_TEST_COVERAGE_GAP_ANALYSIS.md`
**Scope:** **Scope:** Contract test coverage — gap analysis - full detail, tables, and links in the sections below.
**Title:** Contract test coverage — gap analysis
**Summary:** Describe how ArchLucid guards **HTTP/OpenAPI contracts** today, list **known gaps**, and give a repeatable pattern for closing the highest-risk gaps without duplicating Schemathesis or full snapshot churn. - **Microsoft OpenAPI** document at `/openapi/v1.json` is the canonical contract for stable diffing (`OpenApiContractSnapshotTests`). - **NSwag-generated client** (`ArchLucid.Api.Client`) tracks the same surface; drift is caught when CI regenerates or snapshot tests fail. - **Repository “contract” tests** (`ArchLucid.Persistence.Tests/Contracts/*`) validate storage adapters against in-memory and SQL implementations — orthogonal to HTTP. - Contract tests must stay **fast** and **hermetic**
**Headings:** Contract test coverage — gap analysis; Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Covered well; Gaps (prioritized)

#### `library/CONTRIBUTOR_CODE_MAP.md`
**Scope:** **Scope:** 1-page visual/textual decision tree for new contributors.
**Title:** Contributor Code Map
**Summary:** Use this quick-reference to find where to make changes in the ArchLucid codebase based on your goal. **"I need to add or change an HTTP route."** - **Location:** `ArchLucid.Api/Controllers/` - **What to know:** Endpoints are organized by domain (e.g., `Authority`, `Governance`, `Tenancy`). You must apply the correct authorization policy (e.g., `[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]`). **"I need to modify how data is saved or retrieved."** - **Location:** `ArchLucid.Persistence/` - **What to know:** - Sub-assemblies (e.g., Alerts, Advisory, Integration) have been consolidated into this single project to reduce cognitive load. - Look in `Repositories/` for data access. - SQL Mi
**Headings:** Contributor Code Map; 1. Modifying the API or Endpoints; 2. Changing Persistence or Database Logic; 3. Editing the Operator UI; 4. Modifying Architecture Agents or Pipelines; 5. Adding a New Integration or Connector; 6. Modifying Configuration or Startup

#### `library/CONTRIBUTOR_PERSONA_TABLE.md`
**Scope:** **Scope:** Deeper-than-`READ_THIS_FIRST` contributor routing — who starts where. Linked from the repository **[`README.md`](REPOSITORY_README.md)**.
**Title:** Contributor persona table
**Summary:** | You are a... | Start here (contributor / internal-operator path) | |---|---| | **First-time contributor / internal operator** (Docker only, no .NET / Node / cloud keys) | **[`docs/START_HERE.md`](../START_HERE.md)** — then **[`docs/engineering/FIRST_30_MINUTES.md`](../engineering/FIRST_30_MINUTES.md)** — or, if you have the .NET 10 SDK locally, run **`dotnet run --project ArchLucid.Cli -- try`** for a single-command first-value loop (pilot up → seed → sample run → committed manifest → first-value Markdown report → operator UI opens). Same demo stack; zero questions. Even faster: open the repo in the **`.devcontainer/`** (.NET 10 + Node 22, runs `archlucid try` on first boot — see [`docs/li
**Headings:** Contributor persona table

#### `library/CONTROLLER_AREA_MAP.md`
**Scope:** **Scope:** API controller area map - full detail, tables, and links in the sections below.
**Title:** API controller area map
**Summary:** **Search / links:** some docs use **[API_CONTROLLER_MAP.md](API_CONTROLLER_MAP.md)** — that file is an **alias** to this page. `ArchLucid.Api/Controllers/` groups endpoints by **bounded context** using **physical area folders** and matching namespaces `ArchLucid.Api.Controllers.{Area}`. | Area folder | Namespace | Controllers | |-------------|-----------|-------------| | **`Authority/`** | `ArchLucid.Api.Controllers.Authority` | `RunsController` (+ `RunsController.Logging`, `RunsController.AgentEvaluation`), `AuthorityQueryController`, `AuthorityReplayController`, `AuthorityCompareController`, `AuthorityRunEventsController`, `RunComparisonController`, `AnalysisReportsController`, `ExportsCon
**Headings:** API controller area map

#### `library/CORE_PILOT.md`
**Scope:** **Scope:** Pointer to the Core Pilot path narrative — canonical content lives in `docs/CORE_PILOT.md`; performance smoke budgets are documented in `docs/library/PERFORMANCE_TESTING.md`.
**Title:** Core Pilot (pointer)
**Summary:** The operator-facing **Core Pilot** walkthrough is **[`docs/CORE_PILOT.md`](../CORE_PILOT.md)**. For **merge-blocking CI performance regression** on the Core Pilot-shaped API slice (operator-path k6 after full regression), see **`tests/load/k6-api-smoke.js`**, **`scripts/ci/assert_k6_ci_smoke_summary.py --per-tag-k6-api-smoke`**, and **`docs/library/PERFORMANCE_TESTING.md`** (what the smoke budget proves vs does not prove).
**Headings:** Core Pilot (pointer)

#### `library/COVERAGE_GAP_ANALYSIS.md`
**Scope:** **Scope:** Coverage gap analysis (merged Cobertura) - tables from the Cobertura file named under **Data source**; stale or partial local merges (or leftover shards under `coverage-gap-1a`) produce misleading percentages — clean the folder before `dotnet test` or use the CI **`coverage-merged-cobertura`** artifact.
**Title:** Coverage gap analysis (merged Cobertura)
**Summary:** > Describe how **line/branch coverage** is collected in CI, how to reproduce reports locally, and interpret trends vs CI gates. **Merged line / branch / per-package floors** (including **`ArchLucid.Persistence`** at **≥ 63%** line for its assembly) are enforced **only** in GitHub Actions on the merged Cobertura from the full solution test run with SQL — job id **`dotnet-full-regression`**, display name **`.NET: full regression (SQL)`** in **`.github/workflows/ci.yml`**. That job sets **`ARCHLUCID_SQL_TEST`**, runs **`dotnet test ArchLucid.sln`** with **`coverage.runsettings`**, merges reports, then runs **`scripts/ci/assert_merged_line_coverage_min.py`**. **Treat that result and the uploaded
**Headings:** Coverage gap analysis (merged Cobertura); Objective; Recommended workflow: Persistence and strict gates (CI-first); Strict profile (product target); Current merge-blocking gates; Local run (merged HTML); Exclusions; Hotspots and backlog hooks

#### `library/CSHARP_HOUSE_STYLE.md`
**Scope:** **Scope:** ArchLucid C# House Style - full detail, tables, and links in the sections below.
**Title:** ArchLucid C# House Style
**Summary:** > **Source of truth:** the `.mdc` rule files under `.cursor/rules/`. This document is a **human-readable index** that consolidates them so a new contributor (or AI agent) can read one page and understand the project's day-to-day C# style. When this doc and a rule file disagree, **the rule file wins** — open a PR to fix this doc. ArchLucid is a large, multi-project .NET 10 solution where most code is read more often than it is written. The conventions below are tuned to: 1. **Keep the happy path flat** — guards, returns, and continues stay at the top of a member; the "real" logic lives unindented at the bottom. 2. **Stay terse without sacrificing safety** — concrete types, explicit nulls, no
**Headings:** ArchLucid C# House Style; Why this exists; How to apply this style; Rule index — file-scoped for `**/*.cs`; The non-negotiables (project-wide user rules); Putting it together — a worked example; Before; After

#### `library/CUSTOMER_SUCCESS_PERSISTENCE_DESIGN.md`
**Scope:** **Scope:** For backend engineers owning CustomerSuccess persistence; documents Azure SQL + Dapper architecture, RLS, scaling, and hardening paths for `ArchLucid.Persistence/CustomerSuccess` and core models—not end-user guides, OpenAPI contracts, or ORM-centric designs.
**Title:** CustomerSuccess Module — Persistent, Scalable Design
**Summary:** **Date:** 2026-05-03 **Scope:** `ArchLucid.Persistence/CustomerSuccess/` + `ArchLucid.Core/CustomerSuccess/` **Status:** Design review + incremental hardening path Define the authoritative Azure-native persistence architecture for the CustomerSuccess module, identify current defects and scalability ceilings, and provide a concrete hardening roadmap using Azure SQL + Dapper (no ORM). - Azure SQL (General Purpose or Business Critical tier) is the primary store — already in use via `ISqlConnectionFactory`. - Row-Level Security (RLS) is enforced on all tenant-scoped tables via `IRlsSessionContextApplicator`; the bypass ambient (`SqlRowLevelSecurityBypassAmbient`) is reserved for leader-elected m
**Headings:** CustomerSuccess Module — Persistent, Scalable Design; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture Overview; 5. Component Breakdown; 5.1 ICorePilotTeamChecklistRepository → SqlCorePilotTeamChecklistRepository; 5.2 ITenantCustomerSuccessRepository → SqlTenantCustomerSuccessRepository

#### `library/CUSTOMER_TRUST_AND_ACCESS.md`
**Scope:** **Scope:** Customer trust and access - full detail, tables, and links in the sections below.
**Title:** Customer trust and access
**Summary:** This document explains how ArchLucid balances **ease of use** (simple URLs, standard Microsoft sign-in, clear operator flows) with **data safety** (private connectivity, edge protection, identity-backed access). It ties together optional Terraform roots under **`infra/`** and API configuration. - Give integrators and operators a **straightforward** path: one HTTPS entry point, **`JwtBearer`** against **Microsoft Entra ID** (reference IaC) or **another OIDC issuer** per **[V1_SCOPE.md](V1_SCOPE.md) §2.12**, and documented configuration samples. - Make **serious security posture** achievable in Azure: **WAF** at the edge, **private endpoints** for SQL and blob data plane, and **tokens** instea
**Headings:** Customer trust and access; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `library/CUSTOM_AGENT_HANDLERS.md`
**Scope:** **Scope:** Integration guide for external/custom agent handlers — out-of-process webhook boundary, sample payloads aligned with `AgentResult`; not shipping code, MCP membrane specs, or in-host plugin APIs.
**Title:** Custom agent handlers — out-of-process boundary
**Summary:** Give enterprise integrators a **clear, secure extension model** for plugging third-party agents into ArchLucid without loading arbitrary code inside the API or worker hosts. - Custom handlers run in **customer-operated or partner-operated** environments with their own identity, scaling, and patching cadence. - The authoritative pipeline still expects validated **`AgentResult`**-shaped JSON at integration boundaries (same semantics as built-in agents). - **In-process .NET assembly loading for custom agents is prohibited.** Third-party binaries must not be loaded into ArchLucid hosting processes. - Transport must stay **out-of-process**: **HTTPS REST webhooks** (recommended default) or **gRPC*
**Headings:** Custom agent handlers — out-of-process boundary; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `library/DATABASE_MIGRATION_ROLLBACK.md`
**Scope:** **Scope:** Database migration rollback scripts - full detail, tables, and links in the sections below.
**Title:** Database migration rollback scripts
**Summary:** Forward schema changes ship via DbUp under `ArchLucid.Persistence/Migrations/`. **DbUp does not run rollback scripts.** **Greenfield baseline:** `Migrations/Baseline/000_Baseline_2026_04_17.sql` is a **one-shot** cumulative script for **empty** catalogs only (see `docs/SQL_SCRIPTS.md` §4.0). There is **no** paired `Rollback/R000_*.sql`; recovery for a failed baseline attempt is **restore from backup** or drop/recreate the database — treat it like a failed initial provision. **Rollback scripts** live in `ArchLucid.Persistence/Migrations/Rollback/` as `RNNN_Description.sql`, paired with the forward script `NNN_Description.sql`. They are **operator-only**: run manually with `sqlcmd` or SSMS dur
**Headings:** Database migration rollback scripts; Guard; Risk

#### `library/DATA_CONSISTENCY_MATRIX.md`
**Scope:** **Scope:** Data consistency matrix - full detail, tables, and links in the sections below.
**Title:** Data consistency matrix
**Summary:** **Last reviewed:** 2026-04-17 (trial lifecycle hard purge: `SqlTenantHardPurgeService` deletes tenant-scoped `dbo` rows in bounded batches; `dbo.AuditEvents` retained; see `TenantHardPurgeServiceSqlIntegrationTests`; prior **2026-04-16** — run archival cascades include ArtifactBundles, AgentExecutionTraces, ComparisonRecords **ArchivedUtc** when migration **073** is applied; see `SqlRunRepositoryArchivalCascadeTests`, `SqlRunRepositoryArchivalExtendedCascadeTests`) This document states **what consistency guarantees callers should assume** for major aggregates. It complements `docs/SQL_DDL_DISCIPLINE.md` and `docs/API_CONTRACTS.md`. Make explicit which paths are **strongly consistent** (read-
**Headings:** Data consistency matrix; Objective; Assumptions; Matrix; Runs authority convergence (complete); Read-replica staleness expectations; Which queries may hit the replica?; Queries that should stay on the primary

#### `library/DATA_MODEL.md`
**Scope:** **Scope:** ArchLucid data model (pragmatic) - full detail, tables, and links in the sections below.
**Title:** Data Model
**Summary:** This document summarizes the persisted data model used by ArchLucid. It is based on the migration scripts in `ArchLucid.Persistence/Migrations/*` and the `ArchLucid.Contracts.Metadata` records. **SQL mechanics (how scripts run, idempotency, change workflow):** see **[SQL_SCRIPTS.md](SQL_SCRIPTS.md)** — canonical reference for `ArchLucid.sql`, DbUp migrations, and Persistence bootstrap. - **Runs are the primary unit of work**: a run references a request, has tasks/results, and can be committed into a manifest version. - **Artifacts are persisted for audit/replay**: - **Manifests** are versioned and persisted. - **Export records** persist export artifacts and enable replay. - **Comparison reco
**Headings:** ArchLucid data model (pragmatic); High-level storage principles; Core tables (from `001_InitialSchema.sql`); `ArchitectureRequests`; `Runs` (authority); `AgentTasks`; `AgentResults`; `GoldenManifestVersions` *(removed)*

#### `library/DECISIONING_GOLDEN_CORPUS.md`
**Scope:** **Scope:** Decisioning golden corpus — CI contract, layout, recording workflow, and maintenance rules for `tests/golden-corpus/decisioning/`.
**Title:** Decisioning golden corpus
**Summary:** **Audience:** Engineers changing authority decisioning, merge integration, or manifest emission who need a merge-blocking correctness signal without LLMs or SQL integration tests. **Status:** Active hard gate in `.github/workflows/ci.yml` (`dotnet-fast-core` → **Test — fast core**). Tests live in `ArchLucid.Decisioning.Tests` and run under `Suite=Core` with `Category!=GoldenCorpusRecord`. The pipeline **agent output → typed findings → manifest decisions → audit** is the highest-risk place for silent regressions. The corpus freezes **deterministic** JSON for each curated input bundle so any drift fails CI before it reaches production. **Non-goals:** No live LLM calls, no integration-tier SQL,
**Headings:** Decisioning golden corpus; Why this exists; Corpus contract; Coverage map (`case-01` … `case-31`); Archetypes (`case-01` … `case-30` only); Where the harness lives; How to refresh or add cases; Maintenance rule: no case deletion

#### `library/DECISIONING_TYPED_FINDINGS.md`
**Scope:** **Scope:** Typed findings in ArchLucid.Decisioning - full detail, tables, and links in the sections below.
**Title:** Decisioning Typed Findings
**Summary:** ArchLucid.Decisioning uses a **Finding envelope** with **category-specific typed payloads**. This preserves a stable persisted shape while allowing engines and the decision engine to evolve with strongly typed data. `ArchLucid.Decisioning.Models.Finding` includes: - `FindingType` – rule matching key (e.g. `RequirementFinding`, `TopologyGap`) - `Category` – high-level domain grouping (e.g. `Requirement`, `Topology`, `Security`, `Cost`) - `Payload` – category/finding-type specific payload object (stored as `object`) - `PayloadType` – discriminator (e.g. `RequirementFindingPayload`) The rest of the envelope is durable metadata: severity, title/rationale, recommended actions, related graph nodes
**Headings:** Typed findings in ArchLucid.Decisioning; Finding envelope; Typed payloads; Creating findings (recommended); Rehydrating payloads; Graph-aware finding engines; Category-aware finding engines; Payload validation (optional hardening, enabled)

#### `library/DEGRADED_MODE.md`
**Scope:** **Scope:** Degraded mode — LLM and agent availability - full detail, tables, and links in the sections below.
**Title:** Degraded mode — LLM and agent availability
**Summary:** **Product:** ArchLucid **Audience:** Operators, SRE, and developers integrating the authority pipeline Document which capabilities remain available when Azure OpenAI (or other LLM backends) is unavailable, throttled, or circuit-broken, and how the system recovers. - Primary LLM traffic flows through `IAgentCompletionClient` with optional `FallbackAgentCompletionClient` (primary → secondary provider). - Deterministic execution uses `DeterministicAgentSimulator` (tests and some local configurations). - Resilience policies include HTTP retries, circuit breakers, and concurrency limits on agent execution. - Explanations and “Ask” flows are inherently LLM-backed; they cannot be fully replicated w
**Headings:** Degraded mode — LLM and agent availability; Objective; Assumptions; Constraints; Architecture overview; Feature availability matrix; Resilience chain (LLM calls); Operator actions during an LLM outage

#### `library/DEMO_PREVIEW.md`
**Scope:** **Scope:** Marketing and API integrators — public demo commit-page preview route, caching, and privacy boundaries; not production tenant configuration.
**Title:** Demo commit-page preview (`/demo/preview`)
**Summary:** Give **marketing visitors** a **read-only** view of what the operator **commit page** looks like for the latest **committed demo-seed** run — sourced from the same ArchLucid services as production (`IRunRepository`, `IAuthorityQueryService`, `IRunExplanationSummaryService`, artifacts, pipeline timeline), **without** an account, API key, or operator install. - **Buyer outcome:** a sponsor can follow **`/welcome` → “See a real commit page” → `/demo/preview`** and see a credible, live-shaped page instead of a static screenshot. - **Anchored in real services:** the payload is assembled server-side under the hard-pinned demo scope (same pattern as **`GET /v1/demo/explain`**). - **Cheap under spik
**Headings:** Demo commit-page preview (`/demo/preview`); Objective; Why it exists; API contract (`GET /v1/demo/preview`); Marketing UI (`archlucid-ui`); Cache staleness after re-seed; Privacy / data shape; Production safety

#### `library/DEMO_SCREENSHOT_PREFLIGHT.md`
**Scope:** **Scope:** GTM, design, and engineering operators preparing buyer-polished screenshots or demo recordings; operational checklist only, not automated test coverage or a full release gate.
**Title:** Demo Screenshot Preflight Checklist
**Summary:** Before capturing any buyer-facing screenshots or producing a demo video, verify **every item** below. A single failing item can produce a screenshot that contradicts the product story. | Variable | Required value | Purpose | |---|---|---| | `NEXT_PUBLIC_DEMO_MODE` | `true` | Hides internal chrome (sidebar layout, preset shaping, show-all-features buttons) | | `NEXT_PUBLIC_BUYER_POLISHED_SHELL` | `true` | Hides technical labels, suppresses debug copy, polishes scope switcher | Both flags together activate `isBuyerPolishedOperatorShellEnv()` and all associated guards. These IDs must resolve. If any are missing, the corresponding page will show an error or empty state. | Resource | Expected ID
**Headings:** Demo Screenshot Preflight Checklist; Environment flags (must be set before starting the browser); Static demo data spine; Per-route checklist; Home (`/`); Reviews (`/reviews`); Review detail (`/reviews/claims-intake-modernization`); Manifest (`/manifests/a1c2e3f4-a5b6-7890-abcd-ef1234567890`)

#### `library/DEPLOYMENT.md`
**Scope:** **Scope:** Redirect — moved 2026-04-23 to **`docs/engineering/DEPLOYMENT.md`** as part of the SaaS-framing reconciliation (deployment is internal-operator scope; customers never deploy ArchLucid because we host it).
**Title:** Deployment and rollback (umbrella) — moved
**Summary:** The internal-operator deployment & rollback umbrella now lives at: **[docs/engineering/DEPLOYMENT.md](../engineering/DEPLOYMENT.md)** This stub stays so existing bookmarks keep resolving. New links should point at the new path.
**Headings:** Deployment and rollback (umbrella) — moved

#### `library/DEPLOYMENT_CD_PIPELINE.md`
**Scope:** **Scope:** CD pipeline (manual workflow_dispatch) - full detail, tables, and links in the sections below.
**Title:** CD pipeline (manual `workflow_dispatch`)
**Summary:** This document describes the multi-job **CD** workflow (`.github/workflows/cd.yml`). It complements [DEPLOYMENT.md](./DEPLOYMENT.md) and [DEPLOYMENT_TERRAFORM.md](./DEPLOYMENT_TERRAFORM.md). Provide a **repeatable V1-style** path: build and push container images to ACR, optionally plan/apply Terraform for the same environment, roll **API + worker + UI** Container App revisions to the new tag, smoke the public API surface, optionally roll back revisions on failed smoke, optionally publish the API client to NuGet, and notify—using **Azure OIDC** only (no long-lived service principal client secrets in GitHub). - GitHub **Environments** `dev`, `staging`, and `production` exist when you use those
**Headings:** CD pipeline (manual `workflow_dispatch`); Objective; Assumptions; Architecture overview (nodes and flow); Job breakdown; Post-deploy validation behavior; Security model; Traceability

#### `library/DEPLOYMENT_RUNBOOK.md`
**Scope:** **Scope:** Deployment runbook — failed deploys and rollback (practical) - full detail, tables, and links in the sections below.
**Title:** Deployment runbook — failed deploys and rollback (practical)
**Summary:** **Audience:** operators on call. **Scope:** Azure Container Apps + GitHub CD (see [DEPLOYMENT_CD_PIPELINE.md](DEPLOYMENT_CD_PIPELINE.md)). For schema and data rollback posture, use [runbooks/MIGRATION_ROLLBACK.md](../runbooks/MIGRATION_ROLLBACK.md). **Repo-local preflight (before first prod apply):** run `scripts/Emit-ProductionProfilePreflightMarkdown.ps1` from the repository root to emit `artifacts/deployment/production-profile-preflight.md` — Terraform roots + **merged** `ArchLucid.Api` production appsettings (auth/JWT, API key off, SQL + Key Vault sample, redaction, observability, billing rules), Worker `appsettings` notes, and SMB/445 heuristics **without** Azure login or printing secre
**Headings:** Deployment runbook — failed deploys and rollback (practical); 1. Deployment “succeeded” but health / post-deploy validation fails; 2. Image publish succeeded but Container Apps deploy failed; 3. How to identify the currently deployed version; 4. Manual rollback (no automated revision deactivation); API: list revisions, confirm names; Deactivate the broken *latest* revision (replace REVISION_NAME); Worker (same image family as API — roll back if you rolled forward together)

#### `library/DEPLOYMENT_TERRAFORM.md`
**Scope:** **Scope:** ArchLucid deployment — Terraform map (Azure) - full detail, tables, and links in the sections below.
**Title:** ArchLucid deployment — Terraform map (Azure)
**Summary:** Give operators a single map of **Terraform roots** under `infra/`, how they compose, and what they intentionally **do not** replace (pipelines, org policy). ArchLucid uses **Terraform only** for Azure IaC in this repository (no Bicep roots here). Greenfield IaC uses **`archlucid`** naming throughout `infra/`; first subscription deploy: [`FIRST_AZURE_DEPLOYMENT.md`](FIRST_AZURE_DEPLOYMENT.md). - Azure subscription and resource naming are owned by your landing zone. - Container images are built in CI (see `.github/workflows/ci.yml`) and stored in **ACR** (or another registry your Terraform references). - SQL schema is applied by the application host (`SqlSchemaBootstrapper` / DbUp), not by Ter
**Headings:** ArchLucid deployment — Terraform map (Azure); Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `library/DEVCONTAINER.md`
**Scope:** **Scope:** Redirect — moved 2026-04-23 to **`docs/engineering/DEVCONTAINER.md`** as part of the SaaS-framing reconciliation (dev container is contributor scope; customers never open it).
**Title:** Dev container — moved
**Summary:** The dev-container reference now lives at: **[docs/engineering/DEVCONTAINER.md](../engineering/DEVCONTAINER.md)** This stub stays so existing bookmarks keep resolving. New links should point at the new path.
**Headings:** Dev container — moved

#### `library/DI_REGISTRATION_MAP.md`
**Scope:** **Scope:** DI registration map (Host.Composition) - full detail, tables, and links in the sections below.
**Title:** DI registration map (Host.Composition)
**Summary:** **Purpose:** One-page map from extension methods and partial `ServiceCollectionExtensions` files to the capabilities they register, including configuration gates and key sections. **Entry point:** `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions.AddArchLucidApplicationServices` orchestrates everything below (after options on the main partial of the same class). **Source files** (under `ArchLucid.Host.Composition/`): | File | Responsibility | |------|----------------| | `Startup/ServiceCollectionExtensions.cs` | `AddArchLucidApplicationServices` — calls all `Register*` methods in order | | `Startup/ServiceCollectionExtensions.FeatureManagement.cs` | `AddArchLucidFeatureManageme
**Headings:** DI registration map (Host.Composition); `AddArchLucidApplicationServices` (order); `AddArchLucidStorage` (`ArchLucidStorageServiceCollectionExtensions`); `InMemory`; `Sql` (default production shape); `RegisterBackgroundJobs`; `RegisterAgentExecution`; `IFeatureFlags` (feature management)

#### `library/DOCUMENTATION_BY_AUDIENCE.md`
**Scope:** **Scope:** Canonical guide for **routing documentation by audience** (customer / evaluator vs contributor / internal) — merges TB-013 role hints with a folder compass; not a duplicate of onboarding narrative in [`START_HERE_DEPTH.md`](START_HERE_DEPTH.md) or task rows in [`NAVIGATOR.md`](../NAVIGATOR.md).
**Title:** Documentation by audience
**Summary:** ArchLucid docs intentionally separate: | Plane | Typical reader | Goal | | --- | --- | --- | | **Customer / evaluator** | Buyers, pilots, sponsors, procurement — often **without cloning** | Time-to-value, trust, pilot steps, compliance posture | | **Contributor / internal** | Engineers, tenant admins, SRE — **with repo + toolchain** | Build, CI, runbooks, infra, migrations | **Rule of thumb:** hosted-SaaS pilots use the product UI and Trust Center paths; engineers live under `engineering/`, `runbooks/`, and `library/` references. If a change touches HTTP JSON or operator-visible behavior, refresh **customer-facing** summaries only when behavior is customer-visible; otherwise prefer **operato
**Headings:** Documentation by audience; Two planes (reduce browse noise); Quick route by role (TB-013); Objective; Assumptions; Constraints; Architecture overview; Folder compass (defaults)

#### `library/DOGFOOD_PILOT_KIT.md`
**Scope:** **Scope:** Internal dogfood pilot kit — run ArchLucid on ArchLucid-shaped work — full detail, tables, and worksheets in the sections below.
**Title:** Dogfood pilot kit (ArchLucid as subject)
**Summary:** **Audience:** ArchLucid product, engineering, and GTM teammates running an **internal** pilot where the system under review is internal architecture work (not a labeled customer deployment). **Purpose:** Produce **real** baseline and pilot-outcome observations aligned to **[CORE_PILOT.md](../CORE_PILOT.md)** and **[PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md)** — then record them in **[PMF_VALIDATION_TRACKER.md](../archive/gtm-internal/PMF_VALIDATION_TRACKER.md)** (**Pilot A** slot) **without inventing numbers**. This is **not** a substitute for external design-partner pilots. It validates flow, tooling, and measurement hygiene before customer-facing scorecards. Follow the **four steps** in **[CORE_PILOT
**Headings:** Dogfood pilot kit (ArchLucid as subject); 1. Alignment to Core Pilot; 2. Baseline capture worksheet (before dogfood); 3. Outcome capture worksheet (after dogfood window); 4. Updating **Pilot A** in PMF_VALIDATION_TRACKER.md (without inventing numbers); 5. Related

#### `library/EMAIL_NOTIFICATIONS.md`
**Scope:** **Scope:** Transactional email (trial lifecycle) - full detail, tables, and links in the sections below.
**Title:** Transactional email (trial lifecycle)
**Summary:** Deliver **operator-facing trial lifecycle email** (welcome, first successful run, mid-trial, approaching run limit, expiring, expired, converted) without coupling HTTP controllers to SMTP or Azure SDKs. Dispatch is **durable-audit + integration-event driven** for audit-triggered mail, and **scheduled + integration-event driven** for time-based triggers, with **SQL idempotency** (`dbo.SentEmails`, migration **076**) so retries never double-send. - The **trial admin mailbox** is resolved from durable audit (`TrialProvisioned` / `TenantSelfRegistered` actor id), not from a dedicated column on `dbo.Tenants`. - **Azure Communication Services (Email)** is the default production transport when `Ema
**Headings:** Transactional email (trial lifecycle); Objective; Assumptions; Constraints; Architecture Overview; Component Breakdown; Data Flow; Security Model

#### `library/EXECUTIVE_SHELL.md`
**Scope:** **Scope:** ArchLucid executive shell (UI) — audience: operators, sponsors, product, and contributors maintaining the operator UI; describes what the executive route group is for and what it is *not* (no new API surface).
**Title:** Executive shell (operator UI)
**Summary:** **What:** A minimal Next.js route group under [`archlucid-ui/src/app/(executive)/`](../../archlucid-ui/src/app/(executive)/) with no sidebar — optimized for sponsor and CTO-style reading: finalized reviews, prioritized findings, finding detail, and DOCX export via existing REST endpoints. **Entry points:** - Direct: `/executive/reviews` (list), `/executive/reviews/{runId}` (findings board), `/executive/reviews/{runId}/findings/{findingId}` (detail). - From operator shell: review detail **Actions** includes **Open executive view** when a golden manifest exists (`manifestId`). **Auth:** Same JWT / API-key session as the operator shell (`AuthPanel` in header). No anonymous or token-based sharin
**Headings:** Executive shell (operator UI)

#### `library/EXPLAINABILITY.md`
**Scope:** **Scope:** Explainability — operator surfaces (finding inspector contract, links to trace coverage and citation rendering).
**Title:** Explainability — operator surfaces
**Summary:** How operators trace a finding back to persisted authority artifacts without relying on raw LLM prompts at the API edge. **Spine doc:** [`START_HERE.md`](../START_HERE.md). **Policy:** `ReadAuthority` (same gate as architecture read routes). **Purpose:** One JSON payload that bundles what was persisted when the finding was materialized: | Field | Meaning | |-------|---------| | `findingId` | Stable finding identifier (matches `dbo.FindingRecords.FindingId`). | | `typedPayload` | JSON object deserialized from relational `PayloadJson` when present; otherwise JSON `null`. **No LLM prompt or completion text** is included. | | `decisionRuleId` / `decisionRuleName` | First applied rule id from `dbo
**Headings:** Explainability — operator surfaces; Finding inspector (`GET /v1/findings/{findingId}/inspect`); Security and tenancy; Reliability notes

#### `library/EXPLAINABILITY_TRACE_COVERAGE.md`
**Scope:** **Scope:** Explainability trace coverage - full detail, tables, and links in the sections below.
**Title:** Explainability trace coverage
**Summary:** `ExplainabilityTrace` on each `Finding` records how the engine justified its output (`GraphNodeIdsExamined`, `RulesApplied`, `DecisionsTaken`, `AlternativePathsConsidered`, `Notes`). This document describes how completeness is measured, where it appears in advisory scans, and what engine authors should populate. Target: **4/5** or **5/5** per finding for shipped rule engines (graph ids may be empty for coarse coverage warnings), or **5/5** when all five trace list fields including `GraphNodeIdsExamined` are populated with meaningful content. | Engine | GraphNodeIdsExamined | RulesApplied | DecisionsTaken | AlternativePathsConsidered | Notes | Typical ratio | |--------|----------------------|
**Headings:** Explainability trace coverage; Objective; Trace field coverage matrix (rule-based engines); ExplainabilityTraceCompletenessAnalyzer; Property-based tests (FsCheck); Advisory scan `ResultJson`: `traceCompleteness`; Explanation faithfulness (aggregate summary — heuristic); Aggregate faithfulness fallback — SLO budget (Prometheus)

#### `library/EXPLANATION_SCHEMA.md`
**Scope:** **Scope:** Structured explanation schema - full detail, tables, and links in the sections below.
**Title:** Structured explanation schema
**Summary:** Run-level explanations (`ExplanationResult`) include a `structured` object of type `StructuredExplanation` so clients can consume **reasoning**, **evidence references**, **confidence**, and **caveats** without scraping free-text. The LLM is asked to return JSON in this shape; when it does not, the server wraps the raw response so the pipeline **never fails** on malformed output. HTTP responses return `ExplanationResult` as JSON (see `ExplanationController`). The `rawText` field holds the LLM completion after fence unwrapping for auditing. | JSON field | Type | Required | Description | |------------|------|----------|-------------| | `schemaVersion` | number | Default `1` | Schema version for
**Headings:** Structured explanation schema; Overview; Fields; Versioning strategy; Handling null fields; Fallback behavior; Aggregate run explanation; HTTP

#### `library/FAQ.md`
**Scope:** **Scope:** ArchLucid FAQ — getting started, security, integrations, pricing pointer, product; V1-accurate; no live pricing numbers (link only).
**Title:** Frequently asked questions
**Summary:** **What is ArchLucid?** ArchLucid is an architecture authority platform: multi-agent analysis, manifest lifecycle, governance workflows, and audit trails for enterprise architecture decisions. **How do I try it locally?** Follow **[CONTRIBUTOR_QUICK_START.md](CONTRIBUTOR_QUICK_START.md)** — build, fast tests, optional SQL, run **ArchLucid.Api** and **archlucid-ui**. **Do I need Azure OpenAI?** Not for all paths: simulator/deterministic modes exist for engineering. Real LLM analysis uses Azure OpenAI per deployment configuration (see **[FIRST_REAL_VALUE.md](FIRST_REAL_VALUE.md)**). **Where is V1 scope documented?** **[V1_SCOPE.md](V1_SCOPE.md)** — in-scope features, gates, and deferred items.
**Headings:** Frequently asked questions; Getting started; Security and data; Integration; Pricing; Product

#### `library/FEATURE_GATE_ENFORCEMENT_VS_PRICING_PHILOSOPHY_S3.md`
**Scope:** **Scope:** Engineering audit mapping [PRICING_PHILOSOPHY.md §3 Feature gates](../go-to-market/PRICING_PHILOSOPHY.md) rows to repo enforcement (`RequiresCommercialTenantTier`, RBAC policies, trial limits); not a price sheet, SKU definition change, or legal interpretation.
**Title:** Feature gate enforcement vs PRICING_PHILOSOPHY §3 (audit)
**Summary:** **Artifact date:** 2026-05-05 **Canonical buyer table:** [PRICING_PHILOSOPHY.md §3 Feature gates](../go-to-market/PRICING_PHILOSOPHY.md) (Team / Professional / Enterprise columns). **Pricing numerics:** This file intentionally contains **no** list prices or amounts; see the philosophy doc and `scripts/ci/check_pricing_single_source.py` allowlist. | Doc | Role in this audit | |-----|-------------------| | [TRIAL_AND_SIGNUP.md](../go-to-market/TRIAL_AND_SIGNUP.md) | Trial is described as “Team features”; tenants remain `TenantTier.Free` until conversion — **see §3 trial alignment** below. **Parameter drift (outside §3 table):** doc specifies **30**-day duration; `TrialTenantBootstrapService` s
**Headings:** Feature gate enforcement vs PRICING_PHILOSOPHY §3 (audit); Companion GTM / billing docs (how checkout and trial relate); §1 Persistence and checkout truth model (blocks fine-grained Team vs Professional gates); §2 Enforcement primitives (as-built); §3 Row-by-row mapping (§3 Feature gates table → code); §4 Minimal fix directions (if leadership confirms §3 as contract); §5 References (no duplicate pricing)

#### `library/FINDINGS_TYPED_SCHEMA.md`
**Scope:** **Scope:** Typed findings schema (envelope + payloads) - full detail, tables, and links in the sections below.
**Title:** Typed findings schema (envelope + payloads)
**Summary:** - **`Finding.FindingSchemaVersion`** — bump when the finding envelope or payload contracts change. Current: `FindingsSchema.CurrentFindingVersion`. - **`FindingsSnapshot.SchemaVersion`** — snapshot container version. Current: `FindingsSchema.CurrentSnapshotVersion`. - **`FindingsSnapshotMigrator.Apply`** — normalizes legacy findings (e.g. missing `Category` / `PayloadType`) after load or before persist. - **`FindingPayloadRegistry`** maps `PayloadType` name → CLR type. - **`FindingJsonConverter`** + **`FindingsSerialization.SerializeSnapshot` / `DeserializeSnapshot`** round-trip snapshots with typed `Payload` rehydration. - **`InMemoryDecisionRuleProvider`** includes rules for `SecurityContr
**Headings:** Typed findings schema (envelope + payloads); Schema versions; Payload registry & JSON; Rules & manifest; Observability; Tests

#### `library/FINDING_ENGINE_OUTPUT_REFERENCE.md`
**Scope:** **Scope:** Reference for **built-in finding engines** — identifiers, owning assemblies, and representative output patterns.
**Title:** Finding engine output reference
**Summary:** **Last reviewed:** 2026-05-10 **Source of truth:** Built-in engine type ids are listed in `ArchLucid.Decisioning.Plugins.FindingEnginePluginDiscovery.BuiltInEngineTypeIds` (repository) and extended by **`cost-constraint`** in `ArchLucid.Capabilities.Cost`. Plugins must use **distinct** `EngineType` values or they are skipped at discovery time. | Engine id | Implementation (typical) | Category | What it analyzes | |-----------|--------------------------|----------|------------------| | `requirement` | `RequirementFindingEngine` | Requirements | Requirement nodes vs graph evidence. | | `topology-coverage` | `TopologyCoverageFindingEngine` | Topology | Component/service coverage vs topology exp
**Headings:** Finding engine output reference; Built-in engines; Output shape (conceptual); Plugins; Related

#### `library/FIRST_AZURE_DEPLOYMENT.md`
**Scope:** **Scope:** First Azure deployment (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** First Azure deployment (ArchLucid)
**Summary:** **Audience:** Platform engineers provisioning ArchLucid in Azure for the **first time** (no prior Terraform state or ArchLucid resources in the subscription). **Last reviewed:** 2026-04-19 Provide a **preflight checklist**, **backend configuration** for Terraform remote state, and **apply order** aligned with [`REFERENCE_SAAS_STACK_ORDER.md`](REFERENCE_SAAS_STACK_ORDER.md). **Default:** start from **[`infra/terraform-pilot/`](../../infra/terraform-pilot/README.md)** (canonical pilot profile; no Azure resources in that root). Use **per-root** applies only when you intentionally opt into the **multi-root** path documented there. This doc does not replace each root’s `README.md` — read those fo
**Headings:** First Azure deployment (ArchLucid); Objective; Assumptions; Constraints; Preflight — obtain before `terraform init`; Example: backend block (per root); Apply order; Per-root workflow (multi-root opt-in path — repeat for each root in order)

#### `library/FIRST_REAL_VALUE.md`
**Scope:** **Scope:** Evaluators who want the shipped `archlucid try` Docker stack to call their Azure OpenAI instead of the simulator; not production deployment architecture, cost governance beyond the noted token default, or ADR-level rationale (see the linked ADR).
**Title:** First real value (`archlucid try --real`)
**Summary:** **V1 alignment:** Pilot happy path supports **simulator or real** execution ([`V1_SCOPE.md`](V1_SCOPE.md), run lifecycle). **`AgentExecution:Mode=Simulator`** remains the **default** in templates and is what **dev/CI** should use unless you are deliberately exercising Azure OpenAI ([`GLOSSARY.md`](GLOSSARY.md) — *Simulator mode / Real mode*). This page describes the **opt-in real** path only. **Audience:** Evaluators who want the same **demo stack** as `archlucid try`, but with **Azure OpenAI** completing agents instead of the deterministic simulator. 1. **Shell gate (opt-in):** set **`ARCHLUCID_REAL_AOAI=1`** in the environment where you run the CLI. Without this, `--real` is ignored for sa
**Headings:** First real value (`archlucid try --real`); What you need; Required Azure OpenAI configuration at the host (canonical keys); What the CLI does; Operator triage; Host behavior: `AgentExecution:Mode=Real` validation; Logs when Real mode is misconfigured; Quota, budgets, and caching — metrics to verify

#### `library/FIRST_RUN_WALKTHROUGH.md`
**Scope:** **Scope:** First-run walkthrough (operator UI) - full detail, tables, and links in the sections below.
**Title:** First-run walkthrough (operator UI)
**Summary:** Give operators a **linear checklist** for creating the first authority run using the **New run** wizard, without relying on screenshots (which go stale quickly). - The UI is available at **`/runs/new`** (see **`docs/FIRST_RUN_WIZARD.md`** for design intent). - The API is reachable with a configured auth mode (**`docs/SECURITY.md`**, **`docs/PILOT_GUIDE.md`**). - This walkthrough does not replace **`onboarding/ONBOARDING_HAPPY_PATH.md`** or **`docs/LIVE_E2E_HAPPY_PATH.md`** for HTTP-level detail. 1. **Open the shell** — Sign in per your environment (Entra, API key, or DevelopmentBypass in local dev only). 2. **Navigate to New run** — Use **`/runs/new`** or the primary nav entry **New run**. 3. **Pi
**Headings:** First-run walkthrough (operator UI); Objective; Assumptions; Constraints; Steps; Related

#### `library/FIRST_RUN_WIZARD.md`
**Scope:** **Scope:** First-run wizard (operator UI) - full detail, tables, and links in the sections below.
**Title:** First-run wizard (operator UI)
**Summary:** **Audience:** New operators, pilot users, and first-time evaluators using **ArchLucid** through the web shell (`archlucid-ui`). **Route:** `/runs/new` — submits **`POST /v1/architecture/request`** with a full **`ArchitectureRequest`**-shaped body (camelCase JSON). The wizard replaces the older minimal “few fields only” flow. **Operator checklist (no screenshots):** **[FIRST_RUN_WALKTHROUGH.md](FIRST_RUN_WALKTHROUGH.md)** **Last reviewed:** 2026-04-17 | Design element | Status | |----------------|--------| | Seven-step wizard (`/runs/new`) | **Shipped** — preset → identity → description → constraints → advanced → review → track (`WizardStep*` + `NewRunWizardClient`). | | Starter presets (gree
**Headings:** First-run wizard (operator UI); Implementation status; Purpose; End-to-end flow (wizard + pipeline); Starter presets; Step-by-step (fields ↔ `ArchitectureRequest`); Step 1 — Choose a starting point; Step 2 — System identity

#### `library/FORMATTING.md`
**Scope:** **Scope:** C# formatting (blank lines & layout) - full detail, tables, and links in the sections below.
**Title:** C# formatting (blank lines & layout)
**Summary:** > **See also:** [`docs/CSHARP_HOUSE_STYLE.md`](CSHARP_HOUSE_STYLE.md) is the human-readable index of the consolidated Cursor C# bundles (guards/flow, modern language, construction/layout). This page covers only the **mechanical** side — what `dotnet format` and the small Roslyn fixers under `scripts/` actually do. The ArchLucid .NET codebase uses **EditorConfig** (repo root `.editorconfig`) so Visual Studio, Rider, and `dotnet format` share the same rules. Notable choices for **readability**: - **Blank line between `using` groups** (`dotnet_separate_import_directive_groups = true`), with `System.*` first. - **Braces** on new lines for types, methods, and other block declarations (`csharp_new
**Headings:** C# formatting (blank lines & layout); Rider / ReSharper (same rule; cleanup + format); Apply formatting to the whole solution; Scripts; Simple auto-properties; Single-statement control flow (brace removal)

#### `library/FUTURE_PACKAGING_ENFORCEMENT.md`
**Scope:** **Scope:** ArchLucid Future Packaging Enforcement Map - full detail, tables, and links in the sections below.
**Title:** ArchLucid Future Packaging Enforcement Map
**Summary:** **Audience:** product, sales, architecture, and go-to-market stakeholders who need a practical view of how ArchLucid’s current layer model could evolve into stronger commercial packaging over time. **Status:** Future-state packaging guidance. This document does **not** implement licensing, billing, or entitlement. It explains how today’s layer model can support future commercial discipline. **Related:** [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) · [COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md](COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md) · [OPERATOR_DECISION_GUIDE.md](OPERATOR_DECISION_GUIDE.md) · [PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md) · [README.md](REPOSITORY_README.md) ArchLucid already has a cl
**Headings:** ArchLucid Future Packaging Enforcement Map; 1. Why this document exists; 2. Packaging today; 2.1 Narrative packaging; 2.2 UI visibility shaping; 2.3 Role-shaped usage; 2.4 Commercial foundation; 3. Packaging later

#### `library/GLOSSARY.md`
**Scope:** **Scope:** ArchLucid glossary - full detail, tables, and links in the sections below.
**Title:** ArchLucid glossary
**Summary:** **Last reviewed:** 2026-04-05 Short definitions for domain terms used across the codebase, docs, and runbooks. **ArchLucid** is the product name; legacy identifiers may still read **ArchLucid** in code and configuration (rename is incremental; see `docs/library/V1_DEFERRED.md`). Deeper context is linked from each entry. The top-level work unit: an **`ArchitectureRequest`** submitted by an operator or integrator that passes through ingestion, knowledge-graph build, findings, decisioning, artifact synthesis, and optional agent invocation, then results in a committed **golden manifest**. Tracked in **`dbo.Runs`** (GUID-keyed authority table). See **`docs/DATA_CONSISTENCY_MATRIX.md`**. A
**Headings:** ArchLucid glossary; Architecture run (run); Artifact bundle; Authority run orchestrator; Comparison replay; Context snapshot; Decision trace; Effective governance

#### `library/GOLDEN_CHANGE_PATH.md`
**Scope:** **Scope:** Golden change path (redirect) - full detail, tables, and links in the sections below.
**Title:** Golden change path (redirect)
**Summary:** Use the **developer Day-1 doc** for clone → build → test → small PR flow, and **[BUILD.md](BUILD.md)** for solution layout and formatting. **Canonical:** [onboarding/day-one-developer.md](../onboarding/day-one-developer.md) **Prior golden-change narrative:** [archive/ONBOARDING_GOLDEN_CHANGE_PATH_2026_04_17.md](../archive/ONBOARDING_GOLDEN_CHANGE_PATH_2026_04_17.md)
**Headings:** Golden change path (redirect)

#### `library/GOLDEN_PATH.md`
**Scope:** **Scope:** Golden path (redirect) - full detail, tables, and links in the sections below.
**Title:** Golden path (redirect)
**Summary:** Environment sequencing for **zero → local → Azure** now lives in the **canonical persona docs** (2026-04-17 consolidation). - **Developer** (local toolchain + API + SQL): [onboarding/day-one-developer.md](../onboarding/day-one-developer.md) - **SRE / Platform** (health, Terraform validate, deploy order): [onboarding/day-one-sre.md](../onboarding/day-one-sre.md) - **Security** (identity, RLS, trust boundaries): [onboarding/day-one-security.md](../onboarding/day-one-security.md) - **Operator commands** (health, curl, CLI): [OPERATOR_QUICKSTART.md](OPERATOR_QUICKSTART.md) **Prior phased checklists / diagrams:** [archive/ONBOARDING_GOLDEN_PATH_2026_04_17.md](../archive/ONBOARDING_GOLDEN_PATH_202
**Headings:** Golden path (redirect)

#### `library/GOVERNANCE.md`
**Scope:** **Scope:** Governance workflow - full detail, tables, and links in the sections below.
**Title:** Governance workflow
**Summary:** ArchLucid governance covers **approval requests**, **manifest promotions** between deployment environments, and **environment activation** (which manifest version is live in a given environment). The primary HTTP API is under `POST /v1/governance/...` (`GovernanceController`). The durable audit path dual-writes `IAuditService` and baseline mutation logs from `GovernanceWorkflowService` (see `docs/AUDIT_COVERAGE_MATRIX.md`). Pilots creating packs via **`POST /v1/governance/policy-packs`** can start from checked-in JSON that matches **`PolicyPackContentDocument`**. Canonical strings live in **`ArchLucid.Application/Governance/DefaultPolicyPacks/DefaultPolicyPackTemplates.cs`** (`AzureWellArchi
**Headings:** Governance workflow; Default policy pack bodies (reference); Segregation of duties (approve / reject); Dry-run mode (`?dryRun=true`); What is validated; What is skipped; Detecting dry-run responses; Preview vs dry-run

#### `library/GOVERNANCE_WORKFLOW_UI.md`
**Scope:** **Scope:** Governance workflow UI (/governance) - full detail, tables, and links in the sections below.
**Title:** Governance workflow UI (`/governance`)
**Summary:** The **Governance workflow** page (`archlucid-ui/src/app/governance/page.tsx`) is an operator-facing surface for the **manifest promotion lifecycle**: approval requests, optional human review, recorded promotions, and per-environment activations. It complements the read-only **Governance resolution** page (`/governance-resolution`), which shows merged policy resolution for the current scope. The **Governance dashboard** (`archlucid-ui/src/app/governance/dashboard/page.tsx`) is a **cross-run, read-only** overview for operators: | Area | Source | |------|--------| | Pending approvals | `GET /v1/governance/dashboard` → `pendingApprovals` / `pendingCount` (Draft + Submitted across runs; not filte
**Headings:** Governance workflow UI (`/governance`); Governance dashboard (`/governance/dashboard`); Navigation and shortcuts; Workflow steps; Data loading; Auth; Navigation; Related

#### `library/HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`
**Scope:** **Scope:** ArchLucid **V1.1 documentation** — consolidated expectations for **hosted trial** tenants when the product ships **V1.1**-scoped deltas (rollup memo). Full contracts remain **`V1_SCOPE.md`**, **`CHANGELOG.md`**, and procurement **`BREAKING_CHANGES`** (dist pack).
**Title:** Hosted trial tenants — `V1` → `V1.1` migration and expectations
**Summary:** Give tenant admins and sales engineers **one short narrative** for what **V1.1** may change relative to **V1** for **vendor-hosted trials**, without replacing per-release **`CHANGELOG`** discipline or SQL **`DbUp`** mechanics. - Trials use the same **catalog-per-tenant** posture as paid tenants (see **`TENANT_DATABASE_TOPOLOGY.md`**). - Operators apply releases through the **normal hosted upgrade path** (vendor-managed SQL migrations + app rollout). - Buyers still validate procurement claims against **`docs/`**, **`openapi`**, and their own pilot acceptance criteria — this memo is orientation, not a substitute for those artifacts. - **Calendar dates** for **V1.1** are **not implied** here; s
**Headings:** Hosted trial tenants — `V1` → `V1.1` migration and expectations; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown (tenant-facing surfaces); 6. Data flow; 7. Security model

#### `library/HOWTO_ADD_COMPARISON_TYPE.md`
**Scope:** **Scope:** How to add a new comparison type - full detail, tables, and links in the sections below.
**Title:** How to add a new comparison type
**Summary:** This guide walks you through adding a new comparison type end-to-end: contracts, persistence, replay, and tests. All steps are numbered; skip steps that do not apply to your type. A "comparison type" in ArchLucid is an artifact produced by comparing two runs, two exports, or any two structured payloads. It is persisted as a `ComparisonRecord` and later replayed to a format (Markdown, HTML, DOCX, PDF) on demand. Examples already in the system: | Type constant | Description | |---|---| | `end-to-end` | Full run-to-run replay comparison | | `export-record-diff` | Comparison between two `RunExportRecord` payloads | - You are adding a type, not changing existing comparison behaviour. - The new ty
**Headings:** How to add a new comparison type; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Step-by-step; 5.1 Define the type constant; 5.2 Create application-layer service and formatter

#### `library/HOWTO_FINDING_ENGINE_PLUGINS.md`
**Scope:** **Scope:** How to add a finding engine plugin (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** How to add a finding engine plugin (ArchLucid)
**Summary:** Load additional **`IFindingEngine`** implementations from **external assemblies** dropped into a plugin directory, without modifying core `ArchLucid.Decisioning` engine registration code. Set **`ArchLucid:FindingEngines:PluginDirectory`** to an absolute or relative folder path (relative paths resolve from the process working directory — typically the API or worker content root). When the directory is missing or empty, discovery is a no-op. - Implement **`ArchLucid.Decisioning.Interfaces.IFindingEngine`**. - Expose a **parameterless public constructor** (plugins are instantiated once during discovery for metadata checks). - Return a unique **`EngineType`** string that does **not** collide wit
**Headings:** How to add a finding engine plugin (ArchLucid); Objective; Configuration; Contract; Tests; Related

#### `library/INTEGRATION_EVENTS_AND_WEBHOOKS.md`
**Scope:** **Scope:** Integration events and webhook interoperability - full detail, tables, and links in the sections below.
**Title:** Integration events and webhook interoperability
**Summary:** When `WebhookDelivery:UseCloudEventsEnvelope` is **true**, digest and alert webhook POST bodies are wrapped in a [CloudEvents 1.0](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/formats/json-format.md) JSON envelope (`specversion`, `type`, `source`, `id`, `time`, `datacontenttype`, `data`). The existing HMAC header still signs the **final** JSON (the envelope). - Configure `CloudEventsSource` and `CloudEventsType` under `WebhookDelivery` if you need stable routing keys for external receivers. `IIntegrationEventPublisher` publishes UTF-8 JSON payloads after lifecycle events. Messages set `MessageId` when provided (duplicate detection on the queue/topic) and include application pr
**Headings:** Integration events and webhook interoperability; CloudEvents on HTTP webhooks; Azure Service Bus (optional); Transactional outbox (`dbo.IntegrationEventOutbox`); Worker subscription consumer; Terraform; JSON Schema catalog; Bridge receivers — Jira Cloud / ServiceNow (HTTP automation rules)

#### `library/INTEGRATION_EVENT_CATALOG.md`
**Scope:** **Scope:** Integration event catalog (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** Integration event catalog (ArchLucid)
**Summary:** **Audience:** platform engineers wiring **Azure Service Bus** consumers, SIEM pipelines, or partner automation. **Canonical types:** `ArchLucid.Core.Integration.IntegrationEventTypes` (`com.archlucid.*` strings). **Machine-readable catalog:** `schemas/integration-events/catalog.json` (validated in CI by `IntegrationEventCatalogSyncTests`). **Registry narrative:** [INTEGRATION_EVENT_SCHEMA_REGISTRY.md](INTEGRATION_EVENT_SCHEMA_REGISTRY.md). | Layer | Behavior | |--------|----------| | **Outbox** | Domain commits enqueue rows; worker publishes UTF-8 JSON payloads via `IIntegrationEventPublisher`. | | **Payload** | Serialized with `IntegrationEventJson.Options` (camelCase, omit nulls). **There
**Headings:** Integration event catalog (ArchLucid); Wire shape; Event types (summary); Consumer guidance; Related

#### `library/INTEGRATION_EVENT_SCHEMA_REGISTRY.md`
**Scope:** **Scope:** Integration event schema registry - full detail, tables, and links in the sections below.
**Title:** Integration event schema registry
**Summary:** Describe the **file-based schema registry** for outbound CloudEvents integration events and how it stays aligned with product code. - Consumers read committed JSON Schemas from the repository (or a mirrored artifact feed). - Azure Schema Registry may be adopted later without changing the logical registry shape. - Canonical event type strings live in **`ArchLucid.Core.Integration.IntegrationEventTypes`**. - Schema files are the source of truth for payload shape; **`schemas/integration-events/catalog.json`** is the machine-readable index. | Node | Role | |------|------| | **`IntegrationEventTypes`** | Compile-time constants for `com.archlucid.*` type strings. | | **`schemas/integration-events/
**Headings:** Integration event schema registry; Objective; Assumptions; Constraints; Architecture overview; Data flow; Security model; Operational considerations

#### `library/ITSM_BRIDGE_V1_RECIPES.md`
**Scope:** **Scope:** Buyer-facing end-to-end recipes bridging ArchLucid to enterprise workflows (Azure DevOps PR review, CloudEvents consumers, customer-owned Power Automate / Logic Apps); not a SKU matrix, endpoint inventory, or substitute for **V1** first-party **Jira** / **ServiceNow** ([`V1_SCOPE.md`](V1_SCOPE.md) §2.13), **Slack** chat-ops ([`V1_SCOPE.md`](V1_SCOPE.md) §2.14), or **Confluence** publish ([`V1_SCOPE.md`](V1_SCOPE.md) §2.15).
**Title:** ITSM bridge — V1 recipe hub
**Summary:** **Audience:** Platform engineers and integrators who need a **single map** from ArchLucid to PR decoration, event-driven automation, or no-code bridges — alongside **or instead of** first-party **Jira** / **ServiceNow** / **Slack** / **Confluence** capabilities committed for **V1**. **Non-goals:** This page does not replace [INTEGRATION_CATALOG.md](../go-to-market/INTEGRATION_CATALOG.md), [INTEGRATION_EVENTS_AND_WEBHOOKS.md](INTEGRATION_EVENTS_AND_WEBHOOKS.md), or the OpenAPI contract. **First-party** **Jira**, **ServiceNow**, **Slack** (outbound), and **Confluence** publish are **in V1 scope** ([`V1_SCOPE.md`](V1_SCOPE.md) §2.13–§2.15). These recipes are **customer-operated** alternatives w
**Headings:** ITSM bridge — V1 recipe hub; Authorization — ArchLucid-owned Jira OAuth (first-party V1 bi-directional sync); Recipe 1 — Azure DevOps: PR comment + status (manifest delta); Recipe 2 — Generic CloudEvents consumer (HTTP webhook or Azure Service Bus); Recipe 3 — No-code bridges (Logic Apps–first or Power Automate–first); Azure Logic Apps–first (recommended when Logic Apps Standard is your integration plane); Power Automate–first (Microsoft 365 / Power Platform–centric); Related

#### `library/JSON_FALLBACK_AUDIT.md`
**Scope:** **Scope:** JSON fallback removal — relational-first reads (post-53R) - full detail, tables, and links in the sections below.
**Title:** JSON fallback removal — relational-first reads (post-53R)
**Summary:** Document the **current** persistence read behavior after removal of the 53R `JsonFallbackPolicy` / `PersistenceReadMode` seam. Slice-level “read JSON when relational empty” is **gone** for the audited domains below; operators rely on **backfill + readiness** instead of runtime mode switches. | Item | Notes | |------|--------| | `JsonFallbackPolicy`, `PersistenceReadMode`, `RelationalDataMissingException` | Deleted | | `RelationalFirstRead` | Deleted | | `persistence_json_fallback_used` (`ArchLucidInstrumentation.JsonFallbackUsed`) | Removed | | `*JsonFallback.cs` helpers | **Deleted** for ContextSnapshot, FindingsSnapshot, GoldenManifest phase-1 slices, ArtifactBundle **artifacts list** | |
**Headings:** JSON fallback removal — relational-first reads (post-53R); Objective; Removed (no longer in the codebase); Current read behavior by domain; Cutover readiness; Follow-ups (optional / future); Historical note (53R)

#### `library/JSON_PUBLIC_CONTRACTS.md`
**Scope:** **Scope:** JSON naming for public HTTP contracts - full detail, tables, and links in the sections below.
**Title:** JSON naming for public HTTP contracts
**Summary:** `ArchLucid.Api` configures MVC JSON serialization with **camelCase** property names and **camelCase** dictionary keys (`AddJsonOptions` in `Startup/MvcExtensions.cs`). Public JSON responses and request bodies from controllers should use **PascalCase in C#** on DTOs and rely on this policy for wire format. Error responses include: - `type`, `title`, `status`, `detail`, `instance` (RFC 9457 Problem Details; obsoletes RFC 7807). - `extensions.errorCode` — stable machine code (see `ArchLucid.Api.ProblemDetails.ProblemErrorCodes`). - Additional `extensions` as documented per error (e.g. `retryAfterUtc`, `driftDetected`). Generated clients should assume **camelCase** JSON unless a specific DTO opt
**Headings:** JSON naming for public HTTP contracts; API controllers; Problem Details; OpenAPI / clients; Persisted aggregate `schemaVersion`

#### `library/KNOWLEDGE_GRAPH.md`
**Scope:** **Scope:** Knowledge graph (typed architecture graph) - full detail, tables, and links in the sections below.
**Title:** Knowledge graph (typed architecture graph)
**Summary:** `ArchLucid.KnowledgeGraph` turns each persisted **`ContextSnapshot`** into a **`GraphSnapshot`**: typed **nodes**, typed **edges**, and optional **warnings**. Downstream **`ArchLucid.Decisioning`** finding engines and **`DefaultGoldenManifestBuilder`** consume this graph. **Related:** `docs/CONTEXT_INGESTION.md` (upstream canonical objects) · `docs/DECISIONING_TYPED_FINDINGS.md` (findings + manifest) · `docs/DATA_MODEL.md` (SQL `GraphSnapshots`). 1. **`IKnowledgeGraphService.BuildSnapshotAsync`** loads/builds via **`IGraphBuilder`**, wraps **`GraphBuildResult`** as **`GraphSnapshot`**, then **`IGraphValidator.Validate`** (throws on invalid node refs or missing types). 2. **`DefaultGraphBuild
**Headings:** Knowledge graph (typed architecture graph); Pipeline; Scale limits (ingestion and API); Project layout; Node model (`GraphNode`); Inferred edge types (`DefaultGraphEdgeInferer`); Query helpers (`GraphSnapshotExtensions`); Dependency injection (API)

#### `library/LANDING_ZONE_PROVISIONING.md`
**Scope:** **Scope:** Azure landing zone provisioning (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** Azure landing zone provisioning (ArchLucid)
**Summary:** Provide a **repeatable, script-driven** path to validate and (optionally) apply ArchLucid Terraform roots in **safe dependency order**, without merging unrelated stacks into a single Terraform state. - Operators have Azure CLI, Terraform 1.5+, and rights to the target subscription. - Each root under `infra/terraform-*` keeps **its own backend** (or local state for experiments). - Production cuts over private SQL/storage before disabling public endpoints (see `infra/terraform-private`). - **Do not expose SMB (port 445)** on the public internet; align with `docs/CUSTOMER_TRUST_AND_ACCESS.md`. - `terraform apply` without review can destroy resources — default automation uses **validate-only** m
**Headings:** Azure landing zone provisioning (ArchLucid); Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `library/LAYERED_AUDIT_ENFORCEMENT.md`
**Scope:** **Scope:** For contributors wiring mutations and CI: explains layered audit enforcement (controller checks, echo tripwires, baseline pairing tests, allowlists); not a full audit taxonomy or substitute for `docs/library/AUDIT_COVERAGE_MATRIX.md`.
**Title:** Layered audit enforcement
**Summary:** Raise the odds that **new mutation surfaces** (not just HTTP controllers) either emit **`IAuditService.LogAsync`** or are explicitly justified, without blocking teams with impossible guards on day one. | Guard | Purpose | |-------|---------| | `scripts/ci/assert_controller_mutations_have_audit.py` | Controllers issuing POST/PUT/PATCH/DELETE must call `LogAsync` (or controller allowlist) | | `scripts/ci/assert_layered_audit_wiring_echo.py` | Repo-root tripwire ensuring critical **`AuditEventTypes.*`** literals remain reachable in known orchestrators after refactors | | `ArchLucid.Application.Tests/Audit/BaselineMutationAuditDualWritePairingTests` | **`IBaselineMutationAuditService.RecordAsync
**Headings:** Layered audit enforcement; Objective; What runs in CI today; Allowlists; Operational notes; Deferred work

#### `library/LIVE_E2E_AUTH_ASSUMPTIONS.md`
**Scope:** **Scope:** Live E2E — auth assumptions (DevelopmentBypass vs ApiKey / JWT) - full detail, tables, and links in the sections below.
**Title:** Live E2E — auth assumptions (DevelopmentBypass vs ApiKey / JWT)
**Summary:** Document every **DevelopmentBypass-only** assumption in `archlucid-ui/e2e/live-api-*.spec.ts` and `e2e/helpers/live-api-client.ts` so contributors know what breaks when the API runs under **ApiKey** or **JwtBearer** auth. Use this when extending production-like live gates. - **CI default (`ui-e2e-live`):** `ArchLucidAuth:Mode=DevelopmentBypass`, `Authentication:ApiKey:DevelopmentBypassAll=true` — HTTP calls need **no** `X-Api-Key` header. - **Production-like (API key):** `ArchLucidAuth:Mode=ApiKey`, `Authentication:ApiKey:Enabled=true`, `DevelopmentBypassAll=false` — callers must send a valid **`X-Api-Key`** for authorized endpoints. - **JWT (CI / lab):** `ArchLucidAuth:Mode=JwtBearer` with
**Headings:** Live E2E — auth assumptions (DevelopmentBypass vs ApiKey / JWT); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Inventory table; 6. Classification; 7. Data flow (auth)

#### `library/LIVE_E2E_AUTH_PARITY.md`
**Scope:** **Scope:** Live E2E — auth parity (DevelopmentBypass vs ApiKey vs JWT) - full detail, tables, and links in the sections below.
**Title:** Live E2E — auth parity (DevelopmentBypass vs ApiKey vs JWT)
**Summary:** Record which **`live-api-*.spec.ts`** scenarios run under **PR CI** vs **nightly**, and how **DevelopmentBypass**, **ApiKey**, and **JwtBearer (local PEM)** differ, so operators know what integration proof exists for production-like behavior. - **Simulator** is orthogonal to auth: `AgentExecution:Mode=Simulator` can pair with either auth mode. - **JWT (local RSA PEM)** live gates mint RS256 tokens in CI (`scripts/ci/mint_ci_jwt.py`); **Entra** metadata path remains the production default (`Authority` + OIDC) when **`JwtSigningPublicKeyPemPath`** is unset. - **Anonymous health:** `GET /health/ready` stays **`AllowAnonymous`** in all modes. - **ApiKey mode** uses fixed principals (**`ApiKeyAdm
**Headings:** Live E2E — auth parity (DevelopmentBypass vs ApiKey vs JWT); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Auth mode matrix (spec files); 7. Data flow (headers)

#### `library/LIVE_E2E_HAPPY_PATH.md`
**Scope:** **Scope:** Live E2E — operator shell vs real API + SQL (Playwright) - full detail, tables, and links in the sections below.
**Title:** Live E2E — operator shell vs real API + SQL (Playwright)
**Summary:** **Purpose:** Document every **`live-api-*.spec.ts`** file run in CI against a **real** `ArchLucid.Api` and **SQL Server**. Mock journeys use **`playwright.mock.config.ts`** (`npm run test:e2e`). **Discovery:** default **`archlucid-ui/playwright.config.ts`** uses **`testMatch: ["live-api-*.spec.ts"]`** (and re-exported as **`playwright.live.config.ts`** for back-compat) so new live specs are picked up when the filename matches the convention. **Specs (same Playwright live config):** | File | `describe` | Purpose | |------|------------|---------| | `archlucid-ui/e2e/live-api-apikey-auth.spec.ts` | `live-api-apikey-auth` | **ApiKey-only** (skipped without `LIVE_API_KEY`): anonymous `/health/rea
**Headings:** Live E2E — operator shell vs real API + SQL (Playwright); Prerequisites; Step-by-step journey; Sequence diagram; Error-path E2E (conflict journey); Known limitations; Local run

#### `library/LIVE_E2E_JWT_SETUP.md`
**Scope:** **Scope:** Live E2E — JwtBearer with a local RSA public key (CI / lab) - full detail, tables, and links in the sections below.
**Title:** Live E2E — JwtBearer with a local RSA public key (CI / lab)
**Summary:** > **Install order moved.** See [INSTALL_ORDER.md](../INSTALL_ORDER.md) for base toolchain; this doc covers JWT/E2E-only configuration **after** install. Run Playwright **`live-api-*.spec.ts`** against **`ArchLucidAuth:Mode=JwtBearer`** when Entra metadata is unavailable, by validating JWTs with **`ArchLucidAuth:JwtSigningPublicKeyPemPath`** plus **`JwtLocalIssuer`** / **`JwtLocalAudience`**. - **Non-production only:** configuration validation rejects **`JwtSigningPublicKeyPemPath`** in Production (use Entra **`Authority`** + metadata there). - **Claim shape:** tokens use short JWT claim names **`roles`** (array or repeated) and **`name`** aligned with **`LIVE_JWT_ACTOR_NAME`** (default **`Jw
**Headings:** Live E2E — JwtBearer with a local RSA public key (CI / lab); Objective; Assumptions; Constraints; Architecture overview; CI constants (subset job); Local quick test; Related links

#### `library/LLM_BUDGET_TOP_UP.md`
**Scope:** **Scope:** Operator / finance runbook for raising a tenant’s **UTC-month LLM dollar hard cap** without waiting for the calendar roll. Complements **`LlmMonthlyTenantDollarBudget`** in app settings. **Stripe self-serve top-up (TB-014 remainder)** is future work — this document covers the **SQL bump** and in-memory test hook.
**Title:** LLM monthly budget purchased cap bump (TB-014)
**Summary:** - Base cap: **`LlmMonthlyTenantDollarBudget:HardCutoffUsdPerUtcMonth`**. - **Effective hard cap** for a tenant and UTC month: `HardCutoffUsdPerUtcMonth + PurchasedCapBumpUsd` on row **`dbo.LlmMonthlyTenantBudgetState`** (migration **`155_LlmMonthlyTenantBudgetPurchasedCapBump.sql`**). - **Warn** thresholds still derive from **`IncludedUsdPerUtcMonth`** and **`WarnFraction`** (not inflated by the bump) unless product changes later. After a commercial agreement or internal approval, increment the bump for the active UTC month:
**Headings:** LLM monthly budget purchased cap bump (TB-014); Behavior; SQL (emergency / manual top-up); Code hooks; Related

#### `library/LLM_RETRY_AND_CIRCUIT_BREAKER.md`
**Scope:** **Scope:** LLM per-call retry and circuit breaker - full detail, tables, and links in the sections below.
**Title:** LLM per-call retry and circuit breaker
**Summary:** Protect Azure OpenAI completion and embedding calls with a **Polly retry** layer **inside** the circuit breaker decorators (`CircuitBreakingAgentCompletionClient`, `CircuitBreakingOpenAiEmbeddingClient`). Transient faults (rate limits, 5xx, network, HTTP timeouts) are retried with exponential backoff and jitter **before** a single failure is recorded on the gate. This avoids tripping the breaker on short-lived outages while still opening the circuit on sustained failures. - Azure OpenAI is the primary LLM path in production; failures surface as `HttpRequestException`, `ClientResultException` (Azure SDK / `System.ClientModel`), or `TaskCanceledException` when the HTTP stack times out (token n
**Headings:** LLM per-call retry and circuit breaker; Objective; Assumptions; Constraints; Architecture overview; Model-level fallback vs per-call retry; Component breakdown; Data flow

#### `library/LOAD_TEST_BASELINE.md`
**Scope:** **Scope:** Load test baseline (API hot paths) - full detail, tables, and links in the sections below.
**Title:** Load test baseline (API hot paths)
**Summary:** Record **repeatable** latency and throughput for the five highest-traffic API paths so horizontal scaling (Container Apps, read replicas, worker queue depth) is justified with numbers, not assumptions. Complement micro-benchmarks in `ArchLucid.Benchmarks` and cold-start guidance in `docs/PERFORMANCE_COLD_START_AND_TRIMMING.md`. **V1 pilot-scale envelope (what CI vs scheduled jobs claim):** **[PERFORMANCE.md](PERFORMANCE.md#v1-pilot-scale-envelope-evidence-backed)**. - Load tests run against **Docker Compose `full-stack`** on a **dedicated** machine or GitHub Actions runner — not production or shared staging. - The API uses **DevelopmentBypass** auth (Compose default); optional `API_KEY` is s
**Headings:** Load test baseline (API hot paths); Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `library/MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`
**Scope:** **Scope:** ArchLucid — MCP and agent-ecosystem backlog (ranked, version-aligned). One opinionated, version-aligned plan for how (and when) ArchLucid adopts Model Context Protocol (MCP), Responses-API-shaped agent abstractions, and tool approval classes, without compromising V1 determinism, RLS isolation, or the governance moat.
**Title:** ArchLucid — MCP and agent-ecosystem backlog
**Summary:** **Audience:** product, architecture, security, and engineering leads who need one durable answer to *"should we adopt &lt;agent framework du jour&gt;?"* and to the broader question of how ArchLucid relates to the MCP / Responses-API era. **Relationship:** - [V1_SCOPE.md](V1_SCOPE.md) is the **V1 contract**. MCP is **out of V1** and a **V1.1 candidate** in **§3** (MCP row) — aligned with this backlog. - [V1_DEFERRED.md](V1_DEFERRED.md) is the **doc inventory** of partial / V1.1+ stories; **§6d** records the **V1.1** MCP membrane commitment at the same level as other release-window pins. - [adr/README.md](../architecture/adrs/README.md) is the durable decision log. The accompanying ADR for the
**Headings:** ArchLucid — MCP and agent-ecosystem backlog; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview — the membrane model; 4.1 Boundary diagram; 4.2 One-way dependency rule; 4.3 Dual-pipeline alignment

#### `library/METHOD_DOCUMENTATION.md`
**Scope:** **Scope:** Method and API documentation (XML comments) - full detail, tables, and links in the sections below.
**Title:** Method and API documentation (XML comments)
**Summary:** We document public and internal decisioning APIs with **C# XML documentation comments** (`///`) so IntelliSense, DocFX, and future reference docs stay accurate. Documentation is being added **in pieces** (namespace / feature areas). This file describes what to include; see the **Piece tracker** at the bottom. For each **type**, add a `<summary>` and, when helpful, `<remarks>` covering: - **Semantics** — what the type represents, invariants, and how it fits the domain. - **Threading / lifetime** — e.g. “registered scoped in DI”, “immutable after publish”, “do not mutate shared static options”. For each **method** (including interface methods and explicit interface implementations), add: | Ele
**Headings:** Method and API documentation (XML comments); What to include (the more detailed, the better); Call sites (“where is it called from?”); Conventions; Piece tracker (governance)

#### `library/MUTATION_TESTING_STRYKER.md`
**Scope:** **Scope:** Mutation testing (Stryker.NET) — scaffolding - full detail, tables, and links in the sections below.
**Title:** Mutation testing (Stryker.NET) — scaffolding
**Summary:** **Unit tests** prove code runs; **mutation tests** ask whether assertions would fail if the implementation changed slightly. Stryker.NET mutates compiled code and re-runs tests to highlight weak or missing assertions. - [.NET SDK](https://dotnet.microsoft.com/download) matching the repo `global.json`. - **Local tool (repo root):** `.config/dotnet-tools.json` pins **`dotnet-stryker`**. Run `dotnet tool restore` once per clone, then `dotnet dotnet-stryker`. The repo includes **`stryker-config.persistence.json`** (and the equivalent root **`stryker-config.json`**) for **Persistence** (scheduled CI label **Persistence**; thresholds **high 70 / low 55 / break 55**), plus: - **`stryker-config.appl
**Headings:** Mutation testing (Stryker.NET) — scaffolding; Why; Prerequisites; Configuration; Refreshing `stryker-baselines.json` (calibrated scores); Commands; API target (advisory ratchet); Scheduled CI

#### `library/NEXT_REFACTORINGS.md`
**Scope:** **Scope:** Next refactorings - full detail, tables, and links in the sections below.
**Title:** Next refactorings
**Summary:** **Last updated:** 2026-05-07. **Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table). The **complete** numbered backlog (§8–§342, batch checklists, and completed batch logs through 2026-04-14) is preserved verbatim in: **[`docs/archive/NEXT_REFACTORINGS_ARCHIVE_2026_04_15.md`](../archive/NEXT_REFACTORINGS_ARCHIVE_2026_04_15.md)** Use that file when you need the original write-ups for items already marked done in checklists, or for copy-paste context when reviving a deferred idea. **This page** stays short so new contributors are not confronted with 2k+ lines at the front door. 1. **Unify Data and Persistence:** Merge overlapping `ArchLucid.Persistence.*`
**Headings:** Next refactorings; Archive (full historical backlog); Active items (prioritized top 10); Contracts note (unchanged)

#### `library/OBSERVABILITY.md`
**Scope:** **Scope:** Observability — metrics and tracing (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** Observability — metrics and tracing (ArchLucid)
**Summary:** **Audience:** SRE, platform engineers, and developers wiring Prometheus/Grafana, Application Insights, or OTLP exporters. **Scope:** This doc lists **stable** custom instrumentation names owned in **`ArchLucid.Core.Diagnostics.ArchLucidInstrumentation`**. It is not an exhaustive inventory of ASP.NET Core, HTTP client, or SQL client auto-instrumentation. Registration lives in **`ArchLucid.Host.Core`** → **`ObservabilityExtensions.AddArchLucidOpenTelemetry`**. Custom metrics (including **`archlucid_agent_output_*`**) only reach **Application Insights**, a **collector**, or **Prometheus** after you configure **at least one** export path: | Mechanism | What to set | |-----------|-------------| |
**Headings:** Observability — metrics and tracing (ArchLucid); Export path configuration (OpenTelemetry); committed JSON only (CI / clean tree; ignores your shell env) — expect **WARN** verdict unless JSON layers include an exporter; release gate: fail when verdict is not PASS (e.g. missing Worker export, or Api still absent with env overlay); Agent-output quality alerts (Prometheus / Grafana); Meter; Histograms and counters (selected); Business-Level KPI Metrics

#### `library/ONBOARDING_WIZARD.md`
**Scope:** **Scope:** Operator first-run and trial surfaces (UI routes) — full detail in the sections below.
**Title:** Onboarding wizards (operator UI)
**Summary:** > **Install order moved.** See [INSTALL_ORDER.md](../archive/INSTALL_ORDER.md). This page describes in-product routes only (week-one tasks after install). **Single operator FTUE route:** **`/onboarding`** — same **Core Pilot checklist** as **Home** (`OperatorFirstRunWorkflowPanel`), plus optional **trial / post-registration** UI (`GettingStartedTrialSection` → `OnboardingStartClient`: `GET /v1/tenant/trial-status`, deep link to **New review** with `trialSampleRunId` highlighted). Handoff after signup uses **`/onboarding?source=registration`**. **Legacy bookmarks (HTTP redirect — query preserved):** **`/getting-started`**, **`/onboarding/start`**, and **`/onboard`** all **`permanentRedirect("
**Headings:** Onboarding wizards (operator UI); Canonical surface (2026 consolidation)

#### `library/OPENAI_UI_FEEDBACK_ANALYSIS_2026_05_02.md`
**Scope:** **Scope:** Internal triage of OpenAI UI feedback against `archlucid-ui` source for engineering prioritization; not a product roadmap, design spec, or customer-facing summary.
**Title:** OpenAI UI Feedback Analysis — 2026-05-02
**Summary:** **Feedback timestamp:** 2026-05-02 12:49 AM EDT **Analysis by:** ArchLucid engineering (Cursor agent) **Source read:** Live code — `archlucid-ui/src/` and `archlucid-ui/src/lib/` 100 items were flagged, spanning P0 (demo blockers) and P1 (polish). After reading the actual source code, roughly **37 items are real code bugs or copy issues we can fix**, **28 are genuine product/UX design concerns worth discussing**, and **35 appear to be artefacts of the screenshot capture running without a live API**. The three-way split matters because applying the full list without that lens would waste cycles fixing things that self-resolve when the API is connected. **Confirmed in source.** `enterprise-con
**Headings:** OpenAI UI Feedback Analysis — 2026-05-02; Overview; What I Agree With (code-confirmed); A. "run" → "review" migration is incomplete (items 38, 39, 40, 76–80); B. "Defer until after Pilot proof" is visible to buyers (item 28); C. "Operate" as a buyer-facing label is leaking internal taxonomy (item 29, item 81); D. "Elevated permissions" and "Execute access" in primary copy (items 43, 44); E. Raw review ID exposed in Governance main section (item 39)

#### `library/OPENAPI_CONTRACT_DRIFT.md`
**Scope:** **Scope:** OpenAPI contract drift (CI and local workflow) - full detail, tables, and links in the sections below.
**Title:** OpenAPI contract drift (CI and local workflow)
**Summary:** Prevent accidental HTTP surface changes: the committed OpenAPI document for **v1** must match what the API actually exposes at runtime (`MapOpenApi`), so clients, APIM imports, and generated stubs do not silently diverge. - The canonical contract check uses **Microsoft.AspNetCore.OpenApi** output at **`GET /openapi/v1.json`** (not Swashbuckle’s `/swagger/v1/swagger.json`, which is explorer-only and covered by separate smoke tests). - **Azure APIM:** set **`apim_openapi_spec_url`** to **`https://<api-host>/openapi/v1.json`** (`infra/terraform/README.md`), not `/swagger/v1/swagger.json`. - Contributors run **.NET** tests before pushing; CI runs the same **fast core** filter as local “corset” r
**Headings:** OpenAPI contract drift (CI and local workflow); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `library/OPERATIONS_ADMIN.md`
**Scope:** **Scope:** Operations — Admin diagnostics API - full detail, tables, and links in the sections below.
**Title:** Operations — Admin diagnostics API
**Summary:** **Last reviewed:** 2026-04-04 Privileged routes under **`GET /v1/admin/...`** require **`AdminAuthority`** policy. | Route | Purpose | |-------|---------| | `GET /v1/admin/diagnostics/outboxes` | Pending authority pipeline and retrieval indexing work (depth snapshot). | | `GET /v1/admin/analytics/cross-tenant-summary` | Aggregate-only SQL counters across tenants (`dbo.Runs` — distinct tenants, committed vs total); **AdminAuthority**; no per-tenant breakdown. | | `GET /v1/admin/diagnostics/leases` | SQL host leader lease rows (empty when not applicable). | | `GET /v1/admin/features/async-authority-pipeline` | Effective feature flag state. | - Stuck outbox / backlog: `docs/TROUBLESHOOTING.md`,
**Headings:** Operations — Admin diagnostics API; Runbooks; On-call quick path

#### `library/OPERATIONS_LLM_QUOTA.md`
**Scope:** **Scope:** Operations — LLM token quota and metrics - full detail, tables, and links in the sections below.
**Title:** Operations — LLM token quota and metrics
**Summary:** **Last reviewed:** 2026-05-01 | Key | Purpose | |-----|---------| | `LlmTokenQuota:Enabled` | Turn on sliding-window per-tenant limits. | | `LlmTokenQuota:WindowMinutes` | Window length (1–1440). | | `LlmTokenQuota:MaxPromptTokensPerTenantPerWindow` | Cap on **input** tokens summed in the window (0 = unlimited). | | `LlmTokenQuota:MaxCompletionTokensPerTenantPerWindow` | Cap on **output** tokens summed in the window (0 = unlimited). | | `LlmTokenQuota:AssumedMaxPromptTokensPerRequest` | Pre-flight guard before usage is known. | | `LlmTokenQuota:AssumedMaxCompletionTokensPerRequest` | Pre-flight guard before usage is known. | | `LlmMonthlyTenantDollarBudget:Enabled` | Turn on UTC-month **esti
**Headings:** Operations — LLM token quota and metrics; Configuration; Metrics; FinOps

#### `library/OPERATOR_ATLAS.md`
**Scope:** **Scope:** Canonical operator action map — UI routes, APIs, CLI, and authority hints in one place.
**Title:** Operator atlas
**Summary:** **Audience:** Operators, reviewers, and engineers who need a **single map** from product intent → **shell route** → **HTTP surface** → **CLI** without opening ten onboarding files. **Source of truth for nav:** `archlucid-ui/src/lib/nav-config.ts` (labels, `tier`, `requiredAuthority`) composed with `nav-shell-visibility.ts`. **Authoritative authorization** remains **`[Authorize(Policy = …)]`** on `ArchLucid.Api` — the UI only shapes disclosure. **Related:** [CORE_PILOT.md](../CORE_PILOT.md) · [OPERATOR_QUICKSTART.md](OPERATOR_QUICKSTART.md) · [OPERATOR_DECISION_GUIDE.md](OPERATOR_DECISION_GUIDE.md) · [operator-shell.md](operator-shell.md) · [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) §3 · [A
**Headings:** Operator atlas; Core Pilot — essential (default sidebar); Core Pilot — extended (Show more links); Operate (analysis workloads); Operate (governance and trust); Cross-cutting CLI (not tied to one page)

#### `library/OPERATOR_DECISION_GUIDE.md`
**Scope:** **Scope:** ArchLucid Operator Decision Guide - full detail, tables, and links in the sections below.
**Title:** ArchLucid Operator Decision Guide
**Summary:** **Audience:** pilot operators, architecture reviewers, governance operators, and customer teams who need to know which ArchLucid layer to use next without relying on founder-level interpretation. **Status:** Practical V1 usage guidance. This document explains **when to stay on the Core Pilot path, when to expand into Operate (analysis workloads), and when Operate (governance and trust) are worth using**. **Canonical buyer narrative:** [EXECUTIVE_SPONSOR_BRIEF.md](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md). **Measurement companion:** [PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md). This document is usage guidance, not a second buyer narrative and not a second ROI brief. **Canonical maps:** [ARCHITE
**Headings:** ArchLucid Operator Decision Guide; 1. The default rule; 2. Which layer should I use?; 3. Core Pilot — use this unless you have a reason not to; Use Core Pilot when you need to:; Ignore these for now unless you need them:; 4. Operate (analysis workloads) — use this when the next question is analytical; Move to Operate (analysis workloads) when you need to:

#### `library/OPERATOR_QUICKSTART.md`
**Scope:** **Scope:** Operator quickstart — ArchLucid (commands only) (56R) - full detail, tables, and links in the sections below.
**Title:** Operator quickstart — ArchLucid (commands only) (56R)
**Summary:** **Canonical action map (UI + API + CLI):** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md). Copy-paste from the **repository root** unless noted. **Windows:** use `.cmd`; **PowerShell:** use `.ps1` where listed. ArchLucid is an **HTTP API** (and optional **operator UI**) that turns a structured **architecture request** into a **run**, **agent results** (after **execute**), and a versioned **golden manifest** plus **artifacts** (after **commit**). Local pilots often use **`AgentExecution:Mode=Simulator`** so you do not need cloud AI keys to complete a flow. **V1 scope and gates:** [V1_SCOPE.md](V1_SCOPE.md). **After the demo (`archlucid try`) → your own inputs:** [SECOND_RUN.md](SECOND_RUN.md) — `arch
**Headings:** Operator quickstart — ArchLucid (commands only) (56R); What ArchLucid does (one paragraph); Environment; Local API (example); Pilot run (CLI, fastest); Pilot run (curl — replace `RUN_ID` after step 1); Operator UI; Readiness + tests

#### `library/OPERATOR_UI_EXPERIENCE_MODES.md`
**Scope:** **Scope:** Next.js operator shell experience flags (`NEXT_PUBLIC_*`) — documents buyer-default vs full-operator UI only, not API auth or backend behavior.
**Title:** Operator UI experience modes
**Summary:** **Audience:** Deployers wiring `archlucid-ui` for pilots or production. When **`NEXT_PUBLIC_OPERATOR_EXPERIENCE`** is **unset** or not equal to `operator`, the UI uses the **buyer-oriented** operator shell: friendlier labels, fewer shortcut chips, and deliverables-first copy on review detail. This is the **default for new tenants** to reduce cognitive load. **Does not change:** API authorization, RBAC, or progressive disclosure toggles in the sidebar footer (`Show analysis & investigation tools`, `Show governance, audit & admin controls`). Those still gate Operate-layer links per [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md). Set to **`operator`** (case-insensitive) for **internal** or **powe
**Headings:** Operator UI experience modes; Buyer-default shell (omitted `NEXT_PUBLIC_OPERATOR_EXPERIENCE`); Full operator shell (`NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`); Demo / static showcase builds; Related

#### `library/PERFORMANCE.md`
**Scope:** **Scope:** Performance — caching and hot paths (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** Performance — caching and hot paths (ArchLucid)
**Summary:** **Audience:** Operators and developers tuning latency, cache behavior, and LLM cost for the API and worker. **Scope:** High-level behavior of **read-through caches** and related configuration. For the full DI map, see **[DI_REGISTRATION_MAP.md](DI_REGISTRATION_MAP.md)**; for metric names, see **[OBSERVABILITY.md](OBSERVABILITY.md)**. This section bounds what **ArchLucid V1** performance evidence actually supports: **pilot-style** SaaS usage under **documented** k6 profiles and CI jobs. It is **not** a maximum production throughput specification. Deep tables live in **[LOAD_TEST_BASELINE.md](LOAD_TEST_BASELINE.md)** and **[PERFORMANCE_TESTING.md](PERFORMANCE_TESTING.md)**; script inventory in
**Headings:** Performance — caching and hot paths (ArchLucid); V1 pilot-scale envelope (evidence-backed); Merge-blocking CI smoke (regression only — not an SLA); Scheduled burst and soak (telemetry signal, not merge gates); Local and operator reproduction (same scripts as CI); Simulator versus real LLM; Cost and telemetry prerequisites (interpreting any run); What this envelope does not claim

#### `library/PERFORMANCE_BASELINES.md`
**Scope:** **Scope:** Developers interpreting in-process `Category=Slow` / core-pilot timing targets in API tests — not production latency SLOs or load-test methodology.
**Title:** Performance baselines (in-process)
**Summary:** Targets for the **core pilot flow** regression tests in `ArchLucid.Api.Tests` (`[Trait("Category", "Slow")]`). These are **in-process** measurements against the default API test host: **AgentExecution:Mode=Simulator** and **ArchLucid:StorageProvider=InMemory** — not representative of production (no production SQL, no external clients). | Operation | Target | Measured (CI / local) | Environment | |----------|--------|------------------------|-------------| | Create run | Contributes to E2E < 10s; per-step ms in test output | ~30 ms | In-process simulator + in-memory | | Seed results | Contributes to E2E < 10s; per-step ms in test output | ~37 ms | Same | | Commit (incl. findings engine) | Con
**Headings:** Performance baselines (in-process); SQL shape sentinels (runs list / audit paging); Real-mode E2E benchmark (time-to-value)

#### `library/PERFORMANCE_COLD_START_AND_TRIMMING.md`
**Scope:** **Scope:** Cold start, profiling, and trimming (API) - full detail, tables, and links in the sections below.
**Title:** Cold start, profiling, and trimming (API)
**Summary:** **Objective:** Reduce first-request latency and deployment size where safe. **Assumptions:** Default shipping remains **non-trimmed** until each feature area is audited for reflection/DI edge cases. - Capture **Startup** and **first request** with `dotnet-trace` (`.NET Runtime` + `ASP.NET Core` providers) or your APM vendor. - Watch **JIT**, **R2R** (if enabled), **SQL migration** (`DatabaseMigrator.Run`), and **first OpenAI/embedding** calls — these dominate cold paths more than minor assembly savings. - `PublishTrimmed` and `TrimMode` can shrink containers but break **reflection-based** registration (some serializers, certain DI conveniences). Enable only after testing a **published** buil
**Headings:** Cold start, profiling, and trimming (API); Profiling; Trimming (optional); Container layers; See also

#### `library/PERFORMANCE_TESTING.md`
**Scope:** **Scope:** Performance testing (k6 smoke) - full detail, tables, and links in the sections below.
**Title:** Performance testing (k6 smoke)
**Summary:** > **Script reference:** see **[`tests/load/README.md`](../../tests/load/README.md)** for the environment-variable matrix, per-script examples, and CI job mapping. The **`tests/load/smoke.js`** script is a **short, read-only** load profile against the ArchLucid API. It complements: - **`docs/PERFORMANCE.md`** — runtime caching and hot-path design notes. - **`docs/API_SLOS.md`** — product SLOs and error budgets. k6 establishes a **regression baseline** for latency and error rate on health, version, coordinator runs list, and audit search. 1. Start the API (for example `dotnet run --project ArchLucid.Api` with `ArchLucidAuth:Mode=DevelopmentBypass` and storage you prefer). 2. Install [k6](https
**Headings:** Performance testing (k6 smoke); Purpose; Running locally; Rate limiting (local runs); PowerShell example; Scenarios and thresholds; Soak profile (scheduled / manual); Tuning thresholds

#### `library/PERSISTENCE_CONSOLIDATION_PLAN.md`
**Scope:** **Scope:** Maintainer-facing checklist for collapsing `ArchLucid.Persistence.*` class libraries into a single `ArchLucid.Persistence` project — not runtime API docs, exhaustive ADR history, or a substitute for running `dotnet build` / `dotnet test` after edits.
**Title:** ArchLucid.Persistence Consolidation Plan
**Summary:** Reduce the cognitive load and maintenance burden of navigating 6 overlapping `ArchLucid.Persistence.*` sub-assemblies by merging them into a single cohesive `ArchLucid.Persistence` project. The following class libraries all currently use the `ArchLucid.Persistence` namespace and can be safely consolidated: 1. `ArchLucid.Persistence.Advisory` 2. `ArchLucid.Persistence.Alerts` 3. `ArchLucid.Persistence.Coordination` 4. `ArchLucid.Persistence.Integration` 5. `ArchLucid.Persistence.Runtime` *(Note: `ArchLucid.Persistence.MigrateVerify` is an executable (`OutputType: Exe`) and `.Tests` projects should remain separate).* Move all `.cs` files from the source directories into feature folders inside
**Headings:** ArchLucid.Persistence Consolidation Plan; Objective; Projects to be Merged; Step 1: File Relocation; Step 2: Update `ArchLucid.Persistence.csproj` Dependencies; Step 3: Global Solution Search & Replace; Step 4: Compilation and Validation

#### `library/PERSISTENCE_SPLIT.md`
**Scope:** **Scope:** Persistence Project Split - full detail, tables, and links in the sections below.
**Title:** Persistence Project Split
**Summary:** **Date:** 7 April 2026 Split `ArchLucid.Persistence` (formerly 234 .cs files) into two focused projects to reduce cognitive load and enforce clear boundaries between data access and service coordination. - The split is structural only — no behavioral changes, no public API surface changes. - `ArchLucid.Persistence.Runtime` (25 files) remains unchanged and references both new projects. - 18 downstream projects reference `ArchLucid.Persistence`; some now also reference `Persistence.Coordination`. - No circular references: `Coordination → Persistence` (one-way). `Runtime → both`. - One class per file (existing convention preserved). - Build and all 1,391 unit tests pass after the split.
**Headings:** Persistence Project Split; Objective; Assumptions; Constraints; Architecture Overview; Component Breakdown; ArchLucid.Persistence (164 files) — pure data access; ArchLucid.Persistence.Coordination (61 files) — services and coordination

#### `library/PER_TENANT_COST_MODEL.md`
**Scope:** **Scope:** Per-tenant and host-level LLM cost **estimation** methodology (not billing invoices).
**Title:** Per-tenant cost model (estimation)
**Summary:** This document describes how ArchLucid **approximates** Azure OpenAI spend for operators and FinOps workflows. It is **not** a substitute for Azure Cost Management + invoice reconciliation. Runtime cost estimates use `ILlmCostEstimator`, which applies USD-per-million rates from configuration: - `AgentExecution:LlmCostEstimation:InputUsdPerMillionTokens` - `AgentExecution:LlmCostEstimation:OutputUsdPerMillionTokens` When `AgentExecution:LlmCostEstimation:Enabled` is `false`, the estimator returns no USD value (previews show a null estimate). The operator **new-run wizard** review step calls this endpoint to show an **illustrative upper bound** before `POST /v1/architecture/request`: - **Mode:*
**Headings:** Per-tenant cost model (estimation); Host-level rates (`AgentExecution:LlmCostEstimation`); Wizard preview (`GET /v1/agent-execution/cost-preview`); Per-tenant dashboards; Hosted signup trials — forecasting appendix (2026‑05‑11)

#### `library/PILOT_GUIDE.md`
**Scope:** **Scope:** Pilot guide (redirect) - full detail, tables, and links in the sections below.
**Title:** Pilot guide (redirect)
**Summary:** **Operator / pilot** material is merged into the command-first quickstart. **V1 boundary** (scope, gates) stays in **[V1_SCOPE.md](V1_SCOPE.md)**. **Canonical:** [OPERATOR_QUICKSTART.md](OPERATOR_QUICKSTART.md) **Evaluator / buyer — first review package without the deep stack:** [CORE_PILOT.md](../CORE_PILOT.md#first-session-checklist) (four steps + what to send a sponsor). **First real Azure OpenAI on the demo stack:** [FIRST_REAL_VALUE.md](FIRST_REAL_VALUE.md) (`archlucid try --real`, **`ARCHLUCID_REAL_AOAI=1`**, ADR **[`../architecture/adrs/0033-first-real-value-single-env-var-flip.md`](../architecture/adrs/0033-first-real-value-single-env-var-flip.md)**). **Prior pilot narrative:** [arch
**Headings:** Pilot guide (redirect); Verification ladder; Reference architecture payloads (instant runs); When you report an issue; Getting help; Capturing your baseline at signup; Post-commit sponsor banner (first commit clock); Pull-request decoration in your CI

#### `library/PILOT_ROI_MODEL.md`
**Scope:** **Scope:** ArchLucid Pilot ROI Model - full detail, tables, and links in the sections below.
**Title:** ArchLucid Pilot ROI Model
**Summary:** **Audience:** executive sponsors, chief architects, architecture review leads, pilot operators, and sales engineers who need a credible way to judge whether an ArchLucid pilot created business value. **Status:** Practical V1 pilot-evaluation guidance. This document explains **how to measure pilot success using capabilities ArchLucid supports today**. It is not a pricing model and it is not a guaranteed ROI calculator. **Narrative of record for sponsors:** **[EXECUTIVE_SPONSOR_BRIEF.md](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)**. This ROI model is the measurement companion; keep headline buyer claims in the brief. **Related:** [README.md](REPOSITORY_README.md) · [CORE_PILOT.md](../CORE_PILOT.md
**Headings:** ArchLucid Pilot ROI Model; 1. What this model is for; 2. The simplest sponsor-level value story; 3. What to measure before the pilot; 3.1 Baseline questions; 3.2 Keep the baseline light; 4. What to measure during the pilot; 4.1 Primary pilot metrics

#### `library/PILOT_SCORECARD_API.md`
**Scope:** **Scope:** What exists today for **pilot scorecard** and **ROI baselines** in product vs manual spreadsheets.
**Title:** Pilot scorecard and ROI baselines
**Summary:** **Last reviewed:** 2026-04-27 | Method | Route | Role | |--------|-------|------| | `GET` | `/v1/pilots/outcome-summary` | Trailing 30-day rollup (`PilotScorecardResponse`) for the current tenant. | | `POST` | `/v1/pilots/scorecard` | JSON scorecard for a custom UTC window (`periodStart` / `periodEnd` in body). | | `GET` | `/v1/architecture/run/{runId}/roi` | Per-run directional analyst-hour estimate (`RunRoiScorecardDto`); multipliers **`Architecture:RunRoiEstimator`**. Complements tenant scorecard rollups; does not replace them. | Implementation aggregates from `IRunRepository` in scope (runs in period, count with committed manifest). See `PilotScorecardBuilder` and `PilotsController` in t
**Headings:** Pilot scorecard and ROI baselines; Shipped API (tenant-scoped, authenticated); Operations

#### `library/POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`
**Scope:** **Scope:** Appendix — Pack A: AI Governance / Responsible AI (V1 bundled default) - full detail, tables, and links in the sections below.
**Title:** Appendix — Pack A: AI Governance / Responsible AI (V1 bundled default)
**Summary:** **Status:** Starter baseline (GA); authoritative rule payload in-repo. **Buyer disclaimer:** Starter baseline aligned to **informative thematic mapping** toward **NIST AI RMF v1.0** and **EU AI Act Annex III/high-risk motifs** — **not** legal classification or conformity assessment authority. Organizational counsel and jurisdictional applicability remain buyer responsibilities. [`docs/samples/policy-packs/ai-governance-responsible-ai-rules-v1.json`](../samples/policy-packs/ai-governance-responsible-ai-rules-v1.json) Each rule includes **`title`**, **`description`**, **`severity`**, **`remediationGuidance`**, and **`frameworkMappings`**. | NIST AI RMF theme (starter corpus label) | Rule keys
**Headings:** Appendix — Pack A: AI Governance / Responsible AI (V1 bundled default); Canonical source; Table 1 — NIST AI RMF v1.0 theme rollup (starter keys); Table 2 — EU AI Act thematic mapping rollup (starter keys); Operational notes

#### `library/POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md`
**Scope:** **Scope:** Appendix — Pack B: Security Architecture Baseline (V1 bundled default) - full detail, tables, and links in the sections below.
**Title:** Appendix — Pack B: Security Architecture Baseline (V1 bundled default)
**Summary:** **Status:** Starter baseline (GA); authoritative rule payload in-repo. **Buyer disclaimer:** The corpus maps architecture reviews to **CIS Azure Foundations** and **OWASP ASVS** **themes**. It **does not** replace CIS-CAT scoring, penetration testing, SOC 2 control testing, contractual SLAs with cloud providers, or jurisdiction-specific mandates. Responsibility for compliance claims stays with each buyer organization. [`docs/samples/policy-packs/security-architecture-baseline-rules-v1.json`](../samples/policy-packs/security-architecture-baseline-rules-v1.json) Each rule exposes **`severity`**, **`remediationGuidance`**, **`evidenceHints`**, plus paired mappings for CIS and ASVS thematic stri
**Headings:** Appendix — Pack B: Security Architecture Baseline (V1 bundled default); Canonical source; Table 1 — CIS Microsoft Azure Foundations (thematic rollup); Table 2 — OWASP ASVS thematic rollup; Operational notes

#### `library/PRE_COMMIT_GOVERNANCE_GATE.md`
**Scope:** **Scope:** Pre-commit governance gate (optional) - full detail, tables, and links in the sections below.
**Title:** Pre-commit governance gate (optional)
**Summary:** Give governance teams a **preventive** control: block **`POST /v1/architecture/run/{runId}/commit`** when findings at or above a configurable severity threshold exist and an assigned policy pack **enforces** the gate. | Key | Default | Effect | |-----|---------|--------| | **`ArchLucid:Governance:PreCommitGateEnabled`** | **false** | When **false**, the gate is **not evaluated** (no findings or assignment load on the commit path beyond existing behavior). | | **`ArchLucid:Governance:WarnOnlySeverities`** | **null** | Array of severity names (e.g. `["Warning", "Error"]`) where the gate **warns** but does **not block**. Findings are reported via `GovernancePreCommitWarned` audit event and comm
**Headings:** Pre-commit governance gate (optional); Objective; Configuration; Policy assignment; Severity threshold logic; Enforcement logic; Warning-only mode; Approval SLA

#### `library/PRODUCT_LEARNING.md`
**Scope:** **Scope:** Product learning (pilot feedback) — operator & product owner guide (58R) - full detail, tables, and links in the sections below.
**Title:** Product learning (pilot feedback) — operator & product owner guide (58R)
**Summary:** **Audience:** Operators and product / architecture owners reviewing how ArchLucid outputs are received in a pilot. **Not the same as** **Learning** in the operator shell ([operator-shell.md](operator-shell.md)): that page is **recommendation learning** (advisory acceptance weights). **Pilot feedback** (this doc) is **cross-cutting judgment** on runs, manifests, and artifacts, stored per tenant/workspace/project. - Each **signal** is a **human judgment**: trust, reject, revise, follow-up, etc., plus **subject** (what was rated), optional **pattern key**, optional short **comment**, and optional link to an **architecture run**. - Rows are stored in **`ProductLearningPilotSignals`** (SQL when `
**Headings:** Product learning (pilot feedback) — operator & product owner guide (58R); 1. How data is captured; 1.1 In-product feedback controls; 2. View the learning dashboard (UI); 3. Review top improvement opportunities; 4. Export triage summaries; 4.1 Persist planning drafts from opportunities (59R); 4.2 Planning bridge — in-shell UX (**V1 GA**)

#### `library/PRODUCT_PACKAGING.md`
**Scope:** **Scope:** ArchLucid — Product Packaging Reference - full detail, tables, and links in the sections below.
**Title:** ArchLucid — Product Packaging Reference
**Summary:** **Audience:** buyers, pilot operators, sales engineers, and product team members who need a single, authoritative description of what is in each product layer. **Status:** V1 capability inventory. This document describes what is **implemented and supportable today** — not a roadmap. **Related:** [V1_SCOPE.md](V1_SCOPE.md) (engineering scope contract) · [CORE_PILOT.md](../CORE_PILOT.md) (first-pilot walkthrough) · [PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md) (how to measure pilot success) · [OPERATOR_DECISION_GUIDE.md](OPERATOR_DECISION_GUIDE.md) (which layer to use next) · [EXECUTIVE_SPONSOR_BRIEF.md](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) (sponsor-ready summary) · [FUTURE_PACKAGING_ENFORCE
**Headings:** ArchLucid — Product Packaging Reference; Hosted SaaS entry URLs; Hosted SaaS reliability (packaging); Why two buyer layers?; What the layer model means today; 1. Narrative packaging; Buyer vocabulary — explicit hybrid (V1 Pilot); 2. UI progressive disclosure

#### `library/PROJECT_CONSOLIDATION_PROPOSAL.md`
**Scope:** **Scope:** Project and documentation consolidation (proposal) - full detail, tables, and links in the sections below.
**Title:** Project and documentation consolidation (proposal)
**Summary:** **Status:** Proposal (2026-04-20) **Goal:** Reduce duplicate entry points and competing “start here” narratives without deleting historical context. 1. **Single navigation spine:** Treat [docs/ARCHITECTURE_INDEX.md](../ARCHITECTURE_INDEX.md) as the doc graph root; [docs/START_HERE.md](../START_HERE.md) stays a short persona router only. 2. **Buyer narrative:** One outward story — [EXECUTIVE_SPONSOR_BRIEF.md](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md); positioning pages link in, not restate ([go-to-market/POSITIONING.md](../go-to-market/POSITIONING.md)). 3. **Platform clarity:** Azure-first operations are explicit ([ADR 0020](../architecture/adrs/0020-azure-primary-platform-permanent.md)); T
**Headings:** Project and documentation consolidation (proposal); What to consolidate; What not to do; Next steps (incremental)

#### `library/PROJECT_CONSOLIDATION_PROPOSAL_PERSISTENCE.md`
**Scope:** **Scope:** Persistence project fan-in consolidation (proposal) - full detail, tables, and links in the sections below.
**Title:** Persistence project fan-in consolidation (proposal)
**Summary:** **Status:** Proposal (2026-04-20) **Predecessors:** [PERSISTENCE_SPLIT.md](PERSISTENCE_SPLIT.md) (April 2026 split narrative), [PROJECT_CONSOLIDATION_PROPOSAL.md](PROJECT_CONSOLIDATION_PROPOSAL.md) (documentation spine). Reduce **six** shipping persistence assemblies (`ArchLucid.Persistence` + five `ArchLucid.Persistence.*` satellites, excluding tests) to **two** logical packages — **`ArchLucid.Persistence.Read`** and **`ArchLucid.Persistence.Write`** — while keeping **DbUp migrations**, **`ArchLucid.sql`**, and **RLS object names** untouched (**migrations/** policy + **V1_DEFERRED** §3 own those). - Consolidation is **structural** (project boundaries + namespaces), not a rewrite of SQL or repository semantics. - Dow
**Headings:** Persistence project fan-in consolidation (proposal); 1. Objective; 2. Assumptions; 3. Constraints; 4. Current inventory (2026-04-20); 5. Proposed mapping (high level); 6. Downstream impact (initial); 7. Migration sequence (keep CI green)

#### `library/PROJECT_COUNT_LIABILITY_ANALYSIS_2026_04_29.md`
**Scope:** **Scope:** Engineering readers assessing whether `.csproj` proliferation helps or hurts the solution; bounded analysis only (counts, leverage, friction), not a mandate to merge or split projects.
**Title:** Project Count: Asset vs. Liability Analysis
**Summary:** **Date:** 2026-04-29 **Analysis bounds:** `.csproj` files in the repo (49 after consolidation; excludes template-only tooling where applicable) **Question:** At what point does project count become a liability rather than an asset? Are there projects that exist for modularity but whose boundaries are never independently deployed or versioned? Determine whether the current 50-project structure provides genuine architectural leverage, or whether it imposes cost (build time, onboarding friction, dependency graph complexity) without delivering the benefits that justify multiple projects — namely **independent deployment**, **independent versioning**, or **independent team ownership**. - All `.cs
**Headings:** Project Count: Asset vs. Liability Analysis; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture Overview — The Actual Dependency Graph; 5. Component Breakdown — The Three Categories; 5a. Projects That Earn Their Existence (13); 5b. Projects That Exist for Modularity But Whose Boundaries Provide No Independent Value (9)

#### `library/PROJECT_MAP.md`
**Scope:** **Scope:** Solution project map (bounded contexts) - full detail, tables, and links in the sections below.
**Title:** Solution project map (bounded contexts)
**Summary:** Map **`ArchLucid.sln`** projects to **bounded contexts** and seams so engineers can jump from “which `.csproj`?” to “which domain boundary?” without opening every folder. - You are working in the main **ArchLucid** .NET solution (`ArchLucid.sln`). - **Domain** boundaries are summarized in **[bounded-context-map.md](bounded-context-map.md)**; this doc adds **project-level** granularity. - **Test projects** mirror product seams; they are not separate bounded contexts. - **`ArchLucid.Contracts.Abstractions`** is a thin shared surface; treat it with **Contracts** as shared kernel. - **`archlucid-ui`** is not in the solution file above; see **[CONTAINERIZATION.md](CONTAINERIZATION.md)** and **[ar
**Headings:** Solution project map (bounded contexts); Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Test projects (mirror of above); Data flow

#### `library/PROOF_OF_VALUE_SNAPSHOT.md`
**Scope:** **Scope:** Proof-of-value sponsor snapshot — how to assemble real-mode timings, API load-test JSON, Pilot ROI deltas, and explainability completeness into one dated evidence narrative; **not** a financial guarantee or substitute for purchaser legal diligence.
**Title:** Proof-of-value snapshot assembly
**Summary:** Use this playbook when stakeholders ask for **one** cohesive evidence package after a staged evaluation: **time-to-manifest** under real AOAI (full authority run), **API stability** under scripted concurrent traffic (**k6** summary JSON), **tangible savings** modeled with the Pilot ROI workbook (see **`docs/library/PILOT_ROI_MODEL.md`**, templates in **`docs/go-to-market/ROI_MODEL.md`**), and **explainability completeness** (**`ExplainabilityTrace`**) surfaced per finding via the deterministic explainability endpoint. Deliver a reproducible dossier tying four independent signals: 1. **Throughput of the pilot workflow** — end-to-end wall clock from scripted create → committed manifest (**`ben
**Headings:** Proof-of-value snapshot assembly; 1. Objective; 2. Assumptions; 3. Constraints; 4. Inputs (minimal artifact set); 5. Assembly workflow; 6. Sponsor narrative template (copy into an email or deck); 7. Security

#### `library/PROOF_PACK_REDACTION_PROFILES.md`
**Scope:** **Scope:** Redaction **profiles** for ArchLucid **proof-of-value** and **run-evidence** packages (Markdown/PDF/bundles). Complements assembly steps in **[PROOF_OF_VALUE_SNAPSHOT.md](PROOF_OF_VALUE_SNAPSHOT.md)**. **Not** legal advice; customer counsel owns external distribution when regulated data may be present.
**Title:** Proof pack redaction profiles
**Summary:** **Objective.** Make “buyer-safe” **operational**: every pack is built under **one named profile** so operators know what may leave the tenant boundary and what must be removed or generalized. **Assumptions.** - Upstream controls (**`LlmPromptRedaction`**, support-bundle filtering) reduce risk but **do not replace** human review for external profiles — see **[LLM_PROMPT_REDACTION.md](../runbooks/LLM_PROMPT_REDACTION.md)** (redaction is not a guarantee). - **Marketing demo PDFs** (`WhyArchLucidPackBuilder`, anonymous demo preview) are **pre-classified** as synthetic; they still ship the *demo tenant — replace before publishing* banner and are **not** a substitute for these profiles when attach
**Headings:** Proof pack redaction profiles; 1. Profile summary; 2. Mandatory removals (all profiles); 3. Profile rules (by id); 3.1 `internal-pilot`; 3.2 `customer-approved-external`; 3.3 `anonymous-benchmark`; 4. Attestation (recommended)

#### `library/PUBLIC_MARKETING_SITE_TOPOLOGY.md`
**Scope:** **Scope:** Engineers and operators designing apex-domain routing (Front Door, Next.js) for public marketing alongside API and operator UI; not a standalone CMS strategy doc or subdomain-only deployment guide.
**Title:** Public marketing site topology (apex `archlucid.net`)
**Summary:** Document how **modest marketing** pages share **the same apex domain and operational edge** as the ArchLucid API and authenticated operator UI, without a second codebase or orphaned DNS/cert sprawl until scale clearly warrants a split deployment. - Marketing content is authored in-repo as **Next.js App Router pages** grouped under **`app/(marketing)/`** in **`archlucid-ui`**. - Hosted production uses **`NEXT_PUBLIC_ARCHLUCID_SITE_URL`** aligned with **`ArchLucid.Core.Configuration.PublicSiteOptions.BaseUrl`** (default **`https://archlucid.net`** for deep links elsewhere in the backend). - **Azure Front Door (Standard)** and WAF are the TLS terminator when **`infra/terraform-edge`** is enable
**Headings:** Public marketing site topology (apex `archlucid.net`); Objective; Assumptions; Constraints; Architecture Overview; Component Breakdown; Data Flow; Security Model

#### `library/README.md`
**Scope:** **Scope:** Compatibility anchor for Markdown links spelled as `README.md` from sibling files in this folder; canonical contributor README is the repository root. Not a product overview.
**Title:** README (canonical location)
**Summary:** Contributor setup and repo overview: **[repository README](REPOSITORY_README.md)**.
**Headings:** README (canonical location)

#### `library/REAL_MODE_BENCHMARK.md`
**Scope:** **Scope:** Real-mode end-to-end benchmark (request → committed manifest) — how to run, interpret, and compare results.
**Title:** Real-mode end-to-end benchmark
**Summary:** **Audience:** Engineers and evaluators who want to measure wall-clock time from architecture request submission to a committed manifest when the API uses Azure OpenAI (real mode) rather than the deterministic simulator. The benchmark exercises the full request-to-manifest pipeline: | Phase | API call | What happens | | --- | --- | --- | | **Create** | `POST /v1/architecture/request` | Validates the brief, creates a run, dispatches agent tasks. | | **Execute** | `POST /v1/architecture/run/{id}/execute` + poll `GET /v1/architecture/run/{id}` | Agents produce results (LLM calls in real mode, deterministic stubs in simulator). | | **Commit** | `POST /v1/architecture/run/{id}/commit` | Merges age
**Headings:** Real-mode end-to-end benchmark; What it measures; How to run; Prerequisites; Run the script; Default: writes artifacts/benchmark-real-mode-latest.json (UTF-8, no BOM — folder is gitignored) and prints JSON; Real-mode evaluation metadata in JSON (does not toggle server mode — configure the API host for AOAI); Custom base URL, timeout, and an extra CI copy beside the canonical artifact

#### `library/REDIS_AND_MULTI_REGION.md`
**Scope:** **Scope:** Redis and multi-region patterns - full detail, tables, and links in the sections below.
**Title:** Redis and multi-region patterns
**Summary:** **Invalidation:** Run `GetById`, golden manifest `GetById`, and policy pack `GetById` are cached when `HotPathCache:Enabled` is true. Writes through the corresponding repositories evict affected keys; **data archival** evicts every run row archived in a batch so archived runs do not linger in cache until TTL. Artifact lists, snapshots, and alert/planning reads are **not** behind this hot-path decorator today. - **Local / compose**: `docker-compose.yml` runs a single Redis node for development. This is not highly available. - **Production**: Use **Azure Cache for Redis** (Standard or Premium with replication) in the same region as your Container Apps, or in a paired region with private connec
**Headings:** Redis and multi-region patterns; Redis (shared cache / hot path); Multi-region application tier; Cost / ops tradeoffs

#### `library/REFERENCE_SAAS_STACK_ORDER.md`
**Scope:** **Scope:** Reference Azure SaaS stack order (Terraform) - full detail, tables, and links in the sections below.
**Title:** Reference Azure SaaS stack order (Terraform)
**Summary:** **Objective:** Give platform engineers a **default apply order** for ArchLucid Terraform roots under `infra/`, aligned with private networking and least-privilege identity. **Last reviewed:** 2026-04-21 **Note:** Greenfield IaC uses **`archlucid`** resource labels and example names; CI rejects the substring `archiforge` in any `infra/**/*.tf` file. First deploy: [FIRST_AZURE_DEPLOYMENT.md](FIRST_AZURE_DEPLOYMENT.md). Brownfield **state mv** (legacy state only): [archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md](../archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md). **Default primary region (2026-04-21):** **`centralus`** for new production Terraform applies (`infra/terraform-container-apps` and
**Headings:** Reference Azure SaaS stack order (Terraform); Default path: `infra/terraform-pilot` (canonical profile); Advanced (opt-in): multi-root separate state; SaaS-shaped API profile (optional); GitHub Actions repository variables (hosted probes); Post-deploy verification; Buyer CI integrations (GitHub + Azure DevOps); Related

#### `library/RELEASE_EVIDENCE_SUMMARY.md`
**Scope:** **Scope:** For release operators gathering post-build verification signals (tests, snapshots, smoke); not a substitute for full CI or formal release sign-off.
**Title:** Release evidence summary (operator)
**Summary:** Use this drill after a candidate release build to gather **signals** (not a substitute for full CI). Prefer running from repo root on Windows (PowerShell). 1. **API + health**
**Headings:** Release evidence summary (operator); What to run; Interpretation

#### `library/RELEASE_LOCAL.md`
**Scope:** **Scope:** Local release candidate packaging (Change Set 56R) - full detail, tables, and links in the sections below.
**Title:** Local release candidate packaging (Change Set 56R)
**Summary:** Practical steps to produce a **Release**-configuration build, run a **lightweight readiness gate**, and **publish** the **ArchLucid** API for handoff to a design partner or pilot (framework-dependent deployment; no Docker requirement in this doc). **Pilot narrative:** [PILOT_GUIDE.md](PILOT_GUIDE.md). **Prerequisites:** [.NET 10 SDK](https://dotnet.microsoft.com/download), SQL Server when using `ArchLucid:StorageProvider=Sql`, and optionally **Node.js 22+** for operator UI build/tests. See [BUILD.md](BUILD.md) and [TEST_STRUCTURE.md](TEST_STRUCTURE.md). | Script | Purpose | |--------|---------| | `scripts/build-release.cmd` / `scripts/build-release.ps1` | `dotnet restore` + `dotnet build ArchLucid.sln -c Re
**Headings:** Local release candidate packaging (Change Set 56R); Scripts (repo root); Typical pilot workflow; Support-friendly handoff; Run the published API locally; Requires .NET 10 runtime (ASP.NET Core hosting bundle on Windows servers if needed).; Example: SQL (adjust for your server; use User Secrets or env vars — do not commit secrets); Run the operator UI locally

#### `library/RELEASE_SMOKE.md`
**Scope:** **Scope:** Release smoke path (Change Set 56R) - full detail, tables, and links in the sections below.
**Title:** Release smoke path (Change Set 56R)
**Summary:** One **deterministic** end-to-end check for **pilot / commercial confidence** on **ArchLucid** (not full coverage). Implemented as **`scripts/release-smoke.ps1`** / **`scripts/release-smoke.cmd`** (run **`.\scripts\release-smoke.ps1`** from repo root). **For pilots:** Use **`run-readiness-check`** first (faster — no temporary API). Use **`release-smoke`** when you have **SQL** and want one scripted path that also runs **CLI `run --quick`** and checks **artifacts**. If the script fails, copy the **`--- FAILURE (triage) ---`** block (**Stage**, **Category**, **Next:**) into your report — see [PILOT_GUIDE.md](PILOT_GUIDE.md#when-you-report-an-issue). **What it verifies** 1. **Release build** — whole solution (`build-release`). 2. **Core-tier tests*
**Headings:** Release smoke path (Change Set 56R); Does passing `release-smoke` prove UI ↔ SQL parity?; What `-RunPlaywright` actually exercises (57R); Prerequisites (full smoke); Environment variables; Commands (repo root); Parameters; Relation to other scripts

#### `library/REPO_DIGEST.md`
**Scope:** **Scope:** Generated skim for coding agents and contributors; not a buyer document. Regenerate after large project-tree changes. Does not replace **`V1_SCOPE.md`** or **`V1_DEFERRED.md`**.
**Title:** Repo Digest
**Summary:** **Generated:** 2026-05-16 13:14 UTC (`python scripts/repo_digest/build_repo_digest.py`) Product and test projects under **`ArchLucid.*/`** (paths relative to repo root; excludes **`tools/`**, **`templates/`**, etc.). | Project folder | `.csproj` | |----------------|-----------| | `ArchLucid.AgentRuntime/` | `ArchLucid.AgentRuntime/ArchLucid.AgentRuntime.csproj` | | `ArchLucid.AgentRuntime.Tests/` | `ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj` | | `ArchLucid.AgentSimulator/` | `ArchLucid.AgentSimulator/ArchLucid.AgentSimulator.csproj` | | `ArchLucid.Analyzers/` | `ArchLucid.Analyzers/ArchLucid.Analyzers.csproj` | | `ArchLucid.Analyzers.Tests/` | `ArchLucid.Analyzers.Test
**Headings:** Root .NET projects; Architecture invariants (**INV-***); V1 headline / deferrals (read sources; do not treat this digest as canonical); Weighted readiness assessments (canonical vs archive); HTTP / OpenAPI (refresh when changing wire shape); Coverage & tests (anchors); Solution filters (**`*.slnf`**) at repo root; Next.js UI

#### `library/REPO_HYGIENE.md`
**Scope:** **Scope:** Repository hygiene (clone and release surfaces) - full detail, tables, and links in the sections below.
**Title:** Repository hygiene (clone and release surfaces)
**Summary:** **Audience:** Contributors, release engineers, and pilots unpacking the repo who need to know **what is shipped**, **what is generated locally**, and **what should never be committed**. | Area | Notes | |------|--------| | **Source** | `.cs`, `.ts`, `.tsx`, Terraform, SQL **migrations** (`ArchLucid.Persistence/Migrations/`), docs under `docs/`. | | **OpenAPI / contract snapshots** | Checked-in snapshots used by CI and client generation (see [BUILD.md](BUILD.md)). | | **`ArchLucid.Api.Client/Generated/`** | **`ArchLucidApiClient.g.cs`** is **committed** on purpose. Regenerate with NSwag when the API contract changes; review the diff like any other source file. | | **Historical design logs** |
**Headings:** Repository hygiene (clone and release surfaces); What belongs in version control; Typical local-only output (do not commit); Release-facing docs map; Keeping the tree clean

#### `library/RESILIENCE_CONFIGURATION.md`
**Scope:** **Scope:** Resilience configuration (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** Resilience configuration (ArchLucid)
**Summary:** Operators can tune retry and circuit-breaker behavior without recompiling. This document lists configuration paths, defaults, the Azure OpenAI circuit breaker state machine, emitted OpenTelemetry metrics, and example Prometheus queries. | Setting | Config path | Default | Valid range | |--------|-------------|---------|-------------| | Completion failure threshold | `AzureOpenAI:CircuitBreaker:Completion:FailureThreshold` | `5` | ≥ 1 after binding (invalid values fall back) | | Completion open duration (seconds) | `AzureOpenAI:CircuitBreaker:Completion:DurationOfBreakSeconds` | `30` | ≥ 1 after binding | | Embedding failure threshold | `AzureOpenAI:CircuitBreaker:Embedding:FailureThreshold`
**Headings:** Resilience configuration (ArchLucid); Configurable knobs; Azure OpenAI circuit breakers (completion and embedding); SQL connection open retries; Agent execution handler resilience; CLI HTTP retries; LLM model fallback; Configuration

#### `library/ROUTE_TIER_POLICY_NAV_MATRIX.md`
**Scope:** **Scope:** Authoritative crosswalk of HTTP route families → commercial tier gate (if any), ASP.NET authorization policy, and operator nav visibility — for procurement reviewers and contributors avoiding “UI link implies HTTP access” confusion.
**Title:** Route, tier, policy, and navigation matrix
**Summary:** This matrix complements **[PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md)** four-boundary rules. **HTTP behavior** is defined by controllers and **`CommercialTenantTierFilter`**; **nav visibility** is defined by **`archlucid-ui/src/lib/nav-config.ts`** pipeline (**tier → authority** in **`nav-shell-visibility.ts`**). Cells cite source; use **verify pending** when an attribute was not re-checked in the same edit. | HTTP route family | Commercial tier gate (`RequiresCommercialTenantTier`) | Primary policy (`[Authorize(Policy=…)]`) | Nav (`href` · tier · `requiredAuthority`) | Notes | | --- | --- | --- | --- | --- | | `GET/POST /v1/pilots/*` (excluding Standard-only actions) | None on controller b
**Headings:** Route, tier, policy, and navigation matrix; Pilot-critical routes (sample); Operate routes (sample); Single source of truth order; Appendix — per-controller registry (CI)

#### `library/RTO_RPO_TARGETS.md`
**Scope:** **Scope:** RTO / RPO targets by environment tier - full detail, tables, and links in the sections below.
**Title:** RTO / RPO targets by environment tier
**Summary:** **Last reviewed:** 2026-04-04 Document **Recovery Time Objective (RTO)** and **Recovery Point Objective (RPO)** expectations for ArchLucid so landing zones, SRE, and procurement can align Azure SKUs (SQL HA, geo-replication, backups) with business requirements. This file is **policy guidance** for the product; your organization may tighten or relax numbers in internal runbooks. - **Production** uses Azure SQL (not single-instance Docker) and deploys API/worker via Container Apps or equivalent with health probes. - **Development** may use local SQL Server, compose, or shared non-HA Azure resources. - RPO/RTO for **relational data** are driven primarily by **Azure SQL** configuration; blob, qu
**Headings:** RTO / RPO targets by environment tier; Objective; Assumptions; Constraints; Architecture overview (continuity); Tier targets; Production — SQL RPO under 5 minutes (how it maps to Azure); Production — RTO &lt; 1 hour

#### `library/RUNBOOK_REPLAY_DRIFT.md`
**Scope:** **Scope:** Runbook: debugging replay & drift issues - full detail, tables, and links in the sections below.
**Title:** Runbook Replay Drift
**Summary:** Audience: internal engineers who need to understand or debug comparison replay / drift verification. 1. **Lookup by ID** - `GET /v1/architecture/comparisons/{comparisonRecordId}` - Verify: - `comparisonType` is what you expect. - linkage fields (`leftRunId`, `rightRunId`, `leftExportRecordId`, `rightExportRecordId`) are non-empty when needed. 2. **Inspect persisted payload** - From `ComparisonRecord`: - `payloadJson` should be non-empty and deserializable into the expected payload type. 3. **Check stored summary (optional)** - If `summaryMarkdown` is present, `GET /v1/architecture/comparisons/{id}/summary` should return it directly without replay. 1. **Replay as Markdown (artifact mode)**
**Headings:** Runbook: debugging replay & drift issues; 1. Confirm the comparison record exists and is valid; 2. Reproduce the replay via API; 3. Use verify mode to detect drift; 4. Use diagnostics to see replay history; 5. CLI shortcuts

#### `library/SCALING_PATH.md`
**Scope:** **Scope:** Scaling path (capacity, tenancy, and regions) - full detail, tables, and links in the sections below.
**Title:** Scaling path (capacity, tenancy, and regions)
**Summary:** Describe how ArchLucid scales from a **single shared SQL catalog** to **stronger isolation and geography**, and where the product **defers** work until metrics or contracts demand it. - Most pilots start with **one logical database** and **row-level scope** (`tenant_id` / workspace / project) enforced in the application and optionally in SQL session context. - Traffic is **multi-tenant**; a small number of tenants may dominate load. - **Security:** Prefer **private endpoints** and **deny-by-default** networking; never expose SMB (port **445**) or raw connection strings in dashboards or public telemetry. - **Operational realism:** Sharding and multi-region stacks increase **blast-radius coord
**Headings:** Scaling path (capacity, tenancy, and regions); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `library/SECOND_RUN.md`
**Scope:** **Scope:** One-page “second run” inputs after `archlucid try` — no extra operator docs required.
**Title:** Second run with your own data (`SECOND_RUN`)
**Summary:** **Audience:** Pilot operators who already ran **`archlucid try`** (or the operator UI demo) and want a **real** `POST /v1/architecture/request` from their own vocabulary in under five minutes. **Goal:** One small file (TOML **or** JSON) → CLI creates the run → executes → polls → commits → prints the **first-value report URL**. 1. Copy the template below into `SECOND_RUN.toml` next to your API (same machine that can reach `http://localhost:5000` or your pilot URL). 2. Replace **`name`** and **`description`** with your system (description must be at least **10** characters — API validation). 3. Optionally fill **`components`**, **`data_stores`**, **`public_endpoints`**, **`compliance_posture`*
**Headings:** Second run with your own data (`SECOND_RUN`); 60-second path; TOML template; Required; Optional lists (empty arrays are fine); Optional scalar overrides; cloud_provider is currently fixed to Azure in the product contract; omit or set "Azure"; Optional free-text lists merged into the API request

#### `library/SECURITY.md`
**Scope:** **Scope:** Security overview (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** Security overview (ArchLucid)
**Summary:** This document points to security-relevant behavior and gates. It is not a full threat model; see ADRs and runbooks for depth. The **OWASP ZAP baseline** scan runs against the **ArchLucid API Docker image** in CI (`.github/workflows/ci.yml`, job `security-zap-api-baseline`) and on a **weekly schedule** (`.github/workflows/zap-baseline-strict-scheduled.yml`). Both use `zap-baseline.py` **without** `-I`, so **warnings and failures from the scan fail the workflow** (merge gate in CI; regression catch on the schedule). - **Configuration:** `infra/zap/baseline-pr.tsv` (mounted into the scanner container as `config/baseline-pr.tsv`). - **Triage and rule maintenance:** [docs/security/ZAP_BASELINE_RU
**Headings:** Security overview (ArchLucid); Dynamic scanning (OWASP ZAP); OpenAPI-driven fuzzing (Schemathesis, PR + schedule); Shipped auth defaults (`appsettings.json` / `appsettings.Development.json`); DevelopmentBypass production guard; Role-based access control (RBAC); HTTP rate limiting (role-aware); LLM content safety (optional; fail-closed in production-like hosts)

#### `library/SIEM_EXPORT.md`
**Scope:** **Scope:** ArchLucid — Audit log export for SIEM integration - full detail, payload examples for Splunk HEC and Microsoft Sentinel, and links in the sections below.
**Title:** ArchLucid — Audit log export for SIEM integration
**Summary:** > **Buyer-facing index:** [../go-to-market/SIEM_EXPORT.md](../go-to-market/SIEM_EXPORT.md) (short summary and trust links). **Audience:** Security engineers and SOC teams evaluating ArchLucid's audit data for SIEM ingestion. **Last reviewed:** 2026-05-05 ArchLucid maintains a **durable, append-only audit trail** in SQL (`dbo.AuditEvents`) with a typed event catalog. The catalog currently contains **81 event types** (CI-tracked; see [AUDIT_COVERAGE_MATRIX.md](AUDIT_COVERAGE_MATRIX.md)). Each audit event includes: | Field | Description | |-------|-------------| | `eventType` | Typed string from `AuditEventTypes` catalog (e.g., `RunStarted`, `GovernanceApprovalSubmitted`) | | `occurredUtc` | UT
**Headings:** ArchLucid — Audit log export for SIEM integration; 1. What is exported; 2. Export methods available today; 3. SIEM integration patterns (summary); Splunk; Microsoft Sentinel; Generic SIEM (scheduled pull); 4. Copy-paste payload examples (audit row → collector)

#### `library/SLA_TARGETS.md`
**Scope:** **Scope:** Hosted SaaS service availability target (API + operator UI) — pre-contractual engineering posture.
**Title:** Hosted SaaS availability target
**Summary:** **Audience:** Buyers, procurement, and operators evaluating ArchLucid as a **vendor-hosted** service. **Status:** Pre-GA — **target**, not a contractual SLA until negotiated per customer. | Surface | Monthly target | Notes | |---------|----------------|--------| | **ArchLucid API** + **operator web UI** | **99.9%** | Reflects Azure Container Apps + Azure SQL high-availability posture for the hosted stack. | **Meaning:** For each calendar month, we target at least **99.9%** uptime for API and operator UI together, measured as described below. **Relationship to other docs:** The **HTTP** rolling objective in [`API_SLOS.md`](API_SLOS.md) and [`SLA_SUMMARY.md`](../go-to-market/SLA_SUMMARY.md) is
**Headings:** Hosted SaaS availability target; Service availability target; Measurement; Exclusions; Disaster recovery; Monitoring evidence

#### `library/SONNET_AI_FUNCTIONALITY_REVIEW_BRIEF.md`
**Scope:** **Scope:** One-shot prompt pack for an external model (e.g., Claude Sonnet) to review ArchLucid’s **AI/agent path** from code and docs; **not** a buyer-facing product doc or a substitute for human release sign-off.
**Title:** Sonnet brief — ArchLucid AI functionality review
**Summary:** **Audience:** You are reviewing the **ArchLucid** repository. Ground every answer in **committed code and docs**. If something is unspecified, say so. Be skeptical of positioning language; treat **real-model output quality and enforcement** as the primary risk. 1. Open the **minimum first pass** paths below, then widen to the full **primary reading list** as needed. 2. Answer the **questions** in order, or produce a short executive summary plus a table: *Question → Finding → File evidence → Severity (blocker / gap / OK)*. 3. Call out **contradictions** between docs (for example `docs/library/AGENT_OUTPUT_EVALUATION.md` vs defaults in `ArchLucid.Api/appsettings*.json`). - Simulator and struct
**Headings:** Sonnet brief — ArchLucid AI functionality review; How to use this brief; Context (from internal readiness assessment); Minimum first pass; Primary reading list; Known doc anchors (verify in code); Questions for Sonnet; A. Enforcement and buyer-visible behavior

#### `library/SPONSOR_BANNER_FIRST_COMMIT_BADGE.md`
**Scope:** **Scope:** Operators and sponsors interpreting the post-commit sponsor banner day badge; not general trial billing or unrelated UI components.
**Title:** Sponsor banner — “Day N since first commit” badge
**Summary:** Explain the small **“Day N since first commit”** badge shown next to **Time to value** on the post-commit **Email this run to your sponsor** banner (`archlucid-ui/src/components/EmailRunToSponsorBanner.tsx`) so buyers and operators know what it measures, when it appears, and how it degrades safely. - The tenant row may carry **`dbo.Tenants.TrialFirstManifestCommittedUtc`**, set on the **first golden manifest commit** for **every** tenant via `ITenantRepository.TryMarkFirstManifestCommittedAsync` (column name unchanged). Trial-only **`TrialFirstRunCompleted`** audit + histograms still fire only when **`TrialExpiresUtc`** is set — see **`SqlTrialFunnelCommitHook`**. - The operator shell calls
**Headings:** Sponsor banner — “Day N since first commit” badge; Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `library/SPONSOR_ONE_PAGER.md`
**Scope:** **Scope:** Sponsor one-pager PDF — API, CLI, tier gate, and how it relates to pilot ROI docs.
**Title:** Sponsor one-pager PDF
**Summary:** Give sponsors a **single-page** PDF that ties one committed (or in-flight) architecture run to **30-day pilot aggregates** — without replacing canonical ROI narratives in `docs/EXECUTIVE_SPONSOR_BRIEF.md` or `docs/go-to-market/ROI_MODEL.md`. - **Route:** `POST /v1/pilots/runs/{runId}/sponsor-one-pager` - **Auth:** `ReadAuthority` (inherits from `PilotsController`). - **Tier:** **`RequiresCommercialTenantTier(Standard)`** — below Standard returns **402** with the standard packaging problem type. - **Response:** `application/pdf` bytes (`QuestPDF`, community license at generation time).
**Headings:** Sponsor one-pager PDF; Objective; API; CLI; Data sources; Operational considerations

#### `library/SQL_DDL_DISCIPLINE.md`
**Scope:** **Scope:** SQL DDL discipline (single source of truth) - full detail, tables, and links in the sections below.
**Title:** SQL DDL discipline (single source of truth)
**Summary:** Keep **SQL Server** schema discoverable and provisionable from one consolidated script while still supporting **ordered, transactional upgrades** for long-lived databases. - Production and shared dev databases evolve via **DbUp** embedded scripts under **`ArchLucid.Persistence/Migrations/`** (`DatabaseMigrator`). - Greenfield SQL Server installs, Persistence **bootstrap**, and human operators may run **`ArchLucid.Persistence/Scripts/ArchLucid.sql`** (batched by `GO`, idempotent `IF OBJECT_ID` / `IF NOT EXISTS` patterns). - **Integration tests** use **SQL Server** (per-test databases); **DbUp** runs on test host startup (see **`ArchLucid.Api.Tests`** / **`TEST_STRUCTURE.md`**). - **One consol
**Headings:** SQL DDL discipline (single source of truth); Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `library/SQL_INDEX_INVENTORY.md`
**Scope:** **Scope:** SQL Index Inventory - full detail, tables, and links in the sections below.
**Title:** SQL Index Inventory
**Summary:** This document lists every nonclustered index added by migrations 059–060 and the query pattern each one covers. The master DDL at `ArchLucid.Persistence/Scripts/ArchLucid.sql` contains the canonical `IF NOT EXISTS` versions; the individual migration files are incremental and applied by DbUp. | Index | Table | Key Columns | Include / Filter | Query Pattern | |-------|-------|-------------|-----------------|---------------| | `IX_GovernanceApprovalRequests_PendingSlaBreached` | `GovernanceApprovalRequests` | `SlaDeadlineUtc ASC` | **Include:** `ApprovalRequestId, RunId, RequestedBy, Status` **Filter:** `SlaDeadlineUtc IS NOT NULL AND SlaBreachNotifiedUtc IS NULL` | `ApprovalSlaMonitor.CheckAnd
**Headings:** SQL Index Inventory; Migration 059 — SLA Breach Monitoring + Blob Upload Diagnostics; Migration 060 — Broader Query Coverage; Design Decisions; Filtered indexes for sparse predicates; INCLUDE columns for covering queries; Avoiding index duplication; Impact on write throughput

#### `library/SQL_OUTBOX_TABLES_COMPRESSION.md`
**Scope:** **Scope:** Outbox tables: rowstore compression and alternatives - full detail, tables, and links in the sections below.
**Title:** Outbox tables: rowstore compression and alternatives
**Summary:** Decide how (or whether) to apply **data compression**, **schema shape**, or **retention** changes to the three **write-hot, short-lived** outbox tables so that production Azure SQL stays predictable under load without adopting **`PAGE`** compression blindly the way we did for append-mostly history tables (**084**–**090**). **In scope objects:** `dbo.IntegrationEventOutbox`, `dbo.RetrievalIndexingOutbox`, `dbo.AuthorityPipelineWorkOutbox`. - Rows are **inserted**, **updated** (state transitions), and **deleted or archived** on a short horizon; sustained **churn** dominates over long-term scan-heavy analytics. - The product may run on **DTU Basic** or small vCore SKUs where **compression is un
**Headings:** Outbox tables: rowstore compression and alternatives; Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `library/SQL_SCRIPTS.md`
**Scope:** **Scope:** SQL scripts — reference & operations - full detail, tables, and links in the sections below.
**Title:** SQL scripts — reference & operations
**Summary:** This document is the **canonical guide** to every SQL artifact in ArchLucid: what each file does, how it is executed, how the pieces relate, and how to change schema safely. **Related:** [DATA_MODEL.md](DATA_MODEL.md) (tables and domains at a glance) · [README.md](REPOSITORY_README.md) (database setup & DbUp) · [TEST_STRUCTURE.md](TEST_STRUCTURE.md) (`DatabaseMigrationScriptTests`) ArchLucid uses **two** mechanisms for SQL Server schema (by design): | Pathway | When it runs | Engine | Script source | Purpose | |--------|----------------|--------|----------------|--------| | **DbUp migrations** | API startup when **`ConnectionStrings:ArchLucid`** is set (single-catalog) **or split startup** when *
**Headings:** SQL scripts — reference & operations; 1. Why there are two SQL pathways; 2. File locations (quick inventory); 3. `ArchLucid.sql` (SQL Server consolidated); 3.1 Purpose; 3.2 How it is executed; 3.3 Idempotency rules (what “safe to re-run” means); 3.4 Document structure (sections)

#### `library/SQL_TOP5_QUERY_PLANS.md`
**Scope:** **Scope:** Top five frequent SQL queries — execution plan reference - full detail, tables, and links in the sections below.
**Title:** Top five frequent SQL queries — execution plan reference
**Summary:** Document the **five highest-churn read SQL shapes** used on hot API paths (authority lists, governance resolution, manifest materialization), with **how to capture real execution plans** in Azure SQL and **expected plan shapes** from the current schema in `ArchLucid.Persistence/Scripts/ArchLucid.sql`. - Frequency ordering is **engineering judgment** from coordinator/governance/compare flows and HTTP read surfaces, not a live `Query Store` export. Validate in your tenant with **Query Store** or **Extended Events** before capacity work. - Plans below are **estimated / logical** for the shipped indexes; actual costs depend on row counts, statistics, and parameter values. - Read traffic for thes
**Headings:** Top five frequent SQL queries — execution plan reference; Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `library/START_HERE_DEPTH.md`
**Scope:** **Scope:** Extended onboarding narrative and tables formerly in `docs/START_HERE.md` — split 2026-04-27 so the root hub stays a ≤40-line routing tree. **Start at [../START_HERE.md](../START_HERE.md).**
**Title:** Start here — depth (buyer + contributor)
**Summary:** This file preserves the **audience split**, assumptions, constraints, architecture overview, data-flow steps, security model, operational notes, and **where the rest of the docs went** — unchanged in substance from the pre-2026-04-27 `START_HERE.md` body. Give **buyers, evaluators, sponsors, operators, and engineers** one place to understand **what to open first**, **how long each step takes**, and **where depth lives** without competing "first doc" hubs. ArchLucid is a **SaaS** product. Pick the column that matches you — they share **almost no documents**. | You are… | What you ever touch | Start here | Never asked of you | |---|---|---|---| | **Buyer / evaluator / sponsor / customer** | Th
**Headings:** Start here — depth (buyer + contributor); Objective; Audience split (read this first); Assumptions; Constraints; Architecture overview (where ArchLucid sits); Component breakdown; Data flow — canonical **buyer / evaluator** journey (no install)

#### `library/STATE_MACHINES.md`
**Scope:** **Scope:** Reference for backend engineers and DB migration authors; documents all lifecycle state machines on core authority entities and what illegal transitions are enforced — not a user-facing workflow guide.
**Title:** ArchLucid backend state machines
**Summary:** This document is the authoritative reference for lifecycle states on core authority entities. It aligns with migrations **127** (constraints and lifecycle columns) and **128** (`RetryCount` / `LastFailureReason` on runs). Make illegal combinations (e.g. committed run without manifest, finalization against a still-generating findings snapshot) **rejectable at the database layer** and **documented for API/UX**. - One golden manifest per active run (`UQ_GoldenManifests_RunId_Active`). - Findings are sealed in a `FindingsSnapshot` before commit; human review is orthogonal to snapshot generation status. - Artifact bundles may be optional for commit; when present, their status is tracked. - Histor
**Headings:** ArchLucid backend state machines; Objective; Assumptions; Constraints; 1. Request (`ArchitectureRequest` / `dbo.ArchitectureRequests`); 2. Run (`dbo.Runs`, `ArchitectureRunStatus`); 3. Manifest (`dbo.GoldenManifests`); 4. Findings snapshot (`dbo.FindingsSnapshots`)

#### `library/STRYKER_RATchet_TARGET_72.md`
**Scope:** **Scope:** Stryker mutation score ratchet — target 72% - full detail, tables, and links in the sections below.
**Title:** Stryker mutation score ratchet — target 72%
**Summary:** Raising **`scripts/ci/stryker-baselines.json`** and **`thresholds.break` / `thresholds.low`** in each `stryker-config*.json` to **72** without first achieving that score will fail **`.github/workflows/stryker-scheduled.yml`** (assert vs baseline minus tolerance). 1. Add or strengthen tests so surviving mutants decrease (negative-path E2E does not affect Stryker; add **unit/integration** coverage in the module under mutation). 2. From repo root (after `dotnet tool restore`):
**Headings:** Stryker mutation score ratchet — target 72%; Why this exists; How to ratchet safely; Related

#### `library/SYSTEM_MAP.md`
**Scope:** **Scope:** ArchLucid system map - full detail, tables, and links in the sections below.
**Title:** ArchLucid system map
**Summary:** **Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md) High-level flows for navigation and onboarding. For component detail see [ARCHITECTURE_COMPONENTS.md](./ARCHITECTURE_COMPONENTS.md) and [ARCHITECTURE_FLOWS.md](./ARCHITECTURE_FLOWS.md).
**Headings:** ArchLucid system map; Primary HTTP flows; Create architecture run (`POST /v1/architecture/runs` and related); Execute run (agent tasks → commit); Advisory scan (worker / combined host); Composition root entry points; Feature flags (Microsoft.FeatureManagement); Observability artifacts

#### `library/SqlRelationalBackfill.md`
**Scope:** **Scope:** SQL relational backfill and cutover (JSON → child tables) - full detail, tables, and links in the sections below.
**Title:** SQL relational backfill and cutover (JSON → child tables)
**Summary:** One-time alignment for databases that still have authority data only in legacy JSON columns (`CanonicalObjectsJson`, `NodesJson`, `FindingsJson`, GoldenManifest slice JSON, `ArtifactsJson` / `TraceJson`). The utility **deserializes** using the same shapes as production code and **INSERT**s missing rows into relational tables. **JSON columns are not deleted or altered.** Runtime **`JsonFallbackPolicy` / `PersistenceReadMode` were removed.** Reads use relational child tables for the audited slices; if child rows are missing, collections are **empty** (not hydrated from JSON), except the **graph edge metadata merge** documented in **[JSON_FALLBACK_AUDIT.md](JSON_FALLBACK_AUDIT.md)**. Use **`Arc
**Headings:** SQL relational backfill and cutover (JSON → child tables); Objective; Read path (relational-first); When to run the backfill; What it does; Idempotency and failures; CLI usage; Programmatic usage

#### `library/TECH_BACKLOG.md`
**Scope:** **Scope:** Engineering-owned technical backlog items deferred from current sessions; audience is contributors and the AI assistant; not a buyer or operator document. Not a substitute for ADRs or the pending-questions owner decisions file.
**Title:** Tech backlog
**Summary:** Items here are **greenlit in principle** — the decision has been made and context is captured — but deferred for a future session rather than the current one. Pick any item up by searching the codebase for the files listed and applying the recorded approach. **Priority order:** Items are listed highest → lowest priority. When picking up work, start at the top. Re-sort when new items are added: items that affect customer-visible correctness rank above ops/observability improvements, which rank above developer-experience polish. **Recently shipped (IDs kept for grep, ADRs, and code comments — spec text removed below):** **TB-001** (informational async audit best-effort + counter), **TB-002** (
**Headings:** Tech backlog; TB-009 — Architecture invariant catalog + ADR 0035; TB-010 — Invariant Wave A — tenant boundary + fail-closed boot + composition root; TB-011 — Invariant Wave B — execution mode, budgets, single quality-gate outcome, replay isolation; TB-012 — Invariant Wave C — hygiene pack (clock, cancellation, idempotency, HTTP, repos, webhook order); TB-004 — Wire OTel exporters + verify agent-output metrics; add Azure alerts; TB-005 — AI-assisted owner pen-test support (Cursor agent); TB-007 — LLM correctness boundary: three remaining gaps after 2026-05-01 session

#### `library/TENANT_DATABASE_TOPOLOGY.md`
**Scope:** **Scope:** Pre-release launch architecture for Azure SQL: one **system** database (tenant routing, provisioning state, authoritative directory for cross-tenant queries) and one **product** database per tenant (runs, artifacts, governance, billing tables tied to local `dbo.Tenants`, RLS, workspaces). No backfill of production customer data.
**Title:** Tenant Database Topology
**Summary:** Establish a clear **cut line** between **system-plane** and **tenant-plane** data so ArchLucid can run **database-per-tenant** with elastic pools while keeping Dapper + DbUp and Terraform-representable infra. - Greenfield / pre-release only: unreleased shared-catalog assumptions may be replaced without long-lived compatibility shims. - `TenantId`, `WorkspaceId`, and `ProjectId` remain on tenant-scoped rows for export integrity and application-layer scope enforcement. - In `SystemWithPerTenantCatalogs` mode the **database boundary is the primary and sufficient tenant isolation mechanism**. RLS is not required for defense-in-depth and ships disabled (`STATE = OFF`) by default. It is available
**Headings:** Objective; Assumptions; Non-goals (this pass); System vs tenant table ownership (by family); Launch cut line; Security; Operational notes; Signup latency: warm catalogs in elastic pools

#### `library/TENANT_SCOPED_TABLES_INVENTORY.md`
**Scope:** **Scope:** Tenant-scoped tables inventory - full detail, tables, and links in the sections below.
**Title:** Tenant-scoped tables inventory
**Summary:** Give operators and engineers a single map from **logical scope** (`TenantId`, `WorkspaceId`, project scope) to **physical tables** in `ArchLucid.Persistence/Scripts/ArchLucid.sql`, so RLS policies, archival jobs, and cross-tenant probes stay aligned with the DDL. - The **master DDL** (`ArchLucid.sql`) is the integration source of truth for greenfield installs; numbered migrations remain historical. - Some tables are **run-scoped** (foreign key to `dbo.Runs`) without denormalized tenant columns; isolation still flows from the parent run. - SQL object names committed under legacy prefixes (for example `rls.ArchiforgeTenantScope`) are **not** renamed in this document; see `docs/MULTI_TENANT_RLS
**Headings:** Tenant-scoped tables inventory; Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `library/TENANT_TIER_AND_ROUTE_ENUMERATION.md`
**Scope:** **Scope:** Buyer- and integrator-facing explanation of commercial tier gates on HTTP APIs (**404** for Enterprise-only probes, **403** for tenant-visible Standard gaps); not a full entitlement matrix, OpenAPI replacement, or pricing quote.
**Title:** Tenant Tier And Route Enumeration
**Summary:** **Audience:** Procurement, solution architects, and API consumers evaluating or integrating with ArchLucid. **Intent:** **`TenantTier.Standard`** gated routes return **`403 Forbidden`** with an explicit entitlement problem (`PackagingTierInsufficient`) for authenticated callers below tier. **`TenantTier.Enterprise`** gated routes remain **`404 Not Found`** (generic not-found shape) so admin-only probes cannot confirm hidden URLs. Tenant-missing stays **`404`**. Unauthenticated callers skip the tier filter and hit other auth layers. Endpoints that require a minimum **`dbo.Tenants.Tier`** are protected by **`[RequiresCommercialTenantTier(...)]`**, enforced in **`ArchLucid.Api/Filters/Commercia
**Headings:** Tenant tier and route enumeration (tier-gated APIs); Responses by minimum tier (**Standard** vs **Enterprise**); What to do instead (Pilot vs Operate); Integrators: public contracts and correlation; References (code)

#### `library/TERRAFORM_CROSS_ROOT_DEPENDENCY_SAFETY.md`
**Scope:** **Scope:** Platform engineers applying ArchLucid `infra/terraform-*` roots with separate state files; operational safety, ordering contracts, and hand-off variables-not a Terraform tutorial for greenfield IaC authoring.
**Title:** Terraform cross-root dependency safety
**Summary:** **Objective:** Reduce blast-radius surprises when thirteen Terraform state roots exchange resource IDs via operator-supplied variables (no cross-root `terraform_remote_state`). This complements [REFERENCE_SAAS_STACK_ORDER.md](REFERENCE_SAAS_STACK_ORDER.md) and CI guard `scripts/ci/assert_terraform_root_ordering_sync.py`. **Related:** [`infra/terraform-pilot/`](../../infra/terraform-pilot/README.md) (machine-readable `nested_infrastructure_roots` + `consumes_from`), [`infra/apply-saas.ps1`](../../infra/apply-saas.ps1) (multi-root plan/apply order), [`scripts/provision-landing-zone.ps1`](../../scripts/provision-landing-zone.ps1) (validate-only sweep; may omit optional roots). | When you change
**Headings:** Terraform cross-root dependency safety; 1. Blast-radius matrix (who can break whom); 2. Canonical multi-root apply order (and why it exists); 3. Safe-apply checklist (foundational roots); 4. Machine-readable order and `consumes_from`; 5. Cross-root variable hand-off table; Operational considerations

#### `library/TERSENESS_REWRITER_ASSEMBLY_CHECKLIST.md`
**Scope:** **Scope:** RemoveEmbeddedStatementBraces assembly sweep - full detail, tables, and links in the sections below.
**Title:** `RemoveEmbeddedStatementBraces` assembly sweep
**Summary:** Tracks [`scripts/RemoveEmbeddedStatementBraces`(../../scripts/RemoveEmbeddedStatementBraces/RemoveEmbeddedStatementBraces.csproj) runs (brace unwrap + **Terse-01** same-line guards where eligible). The tool also **refuses** to unwrap a braced `then` when the `if` has an `else` and the inner statement is a nested `if` (dangling-else safety). **Command (scoped):**
**Headings:** `RemoveEmbeddedStatementBraces` assembly sweep; Status (2026-04-19 session)

#### `library/TEST_EXECUTION_MODEL.md`
**Scope:** **Scope:** Test execution model (54R — release readiness) - full detail, tables, and links in the sections below.
**Title:** Test execution model (54R — release readiness)
**Summary:** This document is the **canonical reference** for how the ArchLucid product codebase (`ArchLucid.*` assemblies) classifies and runs automated tests. It aligns local scripts, contributor docs, and CI behavior. **See also:** [TEST_STRUCTURE.md](TEST_STRUCTURE.md) (**54R operator cheat sheet** — copy-paste commands), [BUILD.md](BUILD.md) (SQL Server setup for tests), [API_FUZZ_TESTING.md](API_FUZZ_TESTING.md) (scheduled Schemathesis OpenAPI fuzz), [RELEASE_LOCAL.md](RELEASE_LOCAL.md) (**56R** — `build-release`, `package-release`, `run-readiness-check`), [RELEASE_SMOKE.md](RELEASE_SMOKE.md) (**56R** — `release-smoke` E2E gate). > **Canonical entry point (2026-04-20).** Every tier below can be inv
**Headings:** Test execution model (54R — release readiness); Objectives; Suite definitions; 1. Core suite (“corset”); 2. Fast core subset; 3. Integration suite (HTTP / host); 4. SQL Server–first integration (Dapper / Persistence); 5. Full regression

#### `library/TEST_STRUCTURE.md`
**Scope:** **Scope:** Test structure (Change Set 54R) - full detail, tables, and links in the sections below.
**Title:** Test structure (Change Set 54R)
**Summary:** Operator cheat sheet for **ArchLucid** .NET tests: **what each tier means** and **how to run it**. CI job names and full narrative: **[TEST_EXECUTION_MODEL.md](TEST_EXECUTION_MODEL.md)**. SQL variables and LocalDB: **[BUILD.md](BUILD.md)**. | Tier | Meaning | Filter | |------|---------|--------| | **Core (corset)** | Curated high-value regression; opt-in per **class** with `[Trait("Suite", "Core")]` | `Suite=Core` | | **Fast core** | Matches CI **dotnet-fast-core** corset: Core minus **`Slow`**, **`Integration`**, and **`GoldenCorpusRecord`** | `Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord` | | **OpenAPI v1 snapshot** | `OpenApiContractSnapshotTests` only — as
**Headings:** Test structure (Change Set 54R); 54R tiers; Property-based tests (FsCheck); Run each (.NET, repo root); Release candidate packaging (56R); SQL Server–first (Persistence Dapper); Greenfield SQL boot (empty catalog + API host); Operator UI (`archlucid-ui/`)

#### `library/TRUSTED_BASELINE.md`
**Scope:** **Scope:** Trusted baseline (49R pass 2 — Corrected 50R, Corrected 51R discipline) - full detail, tables, and links in the sections below.
**Title:** Trusted baseline (49R pass 2 — Corrected 50R, Corrected 51R discipline)
**Summary:** This document defines what the repo treats as **intentionally complete and demo-worthy** for the v1 foundation. It exists so bootstrap, demo seed, and docs stay honest when later-phase code is present but not baseline-complete. - **Actor resolution:** Application code resolves the acting principal via **`IActorContext`** (namespace **`ArchLucid.Application`**, source under `ArchLucid.Application/Common/`), backed by **`IHttpContextAccessor`**. When no identity name is present, the fallback is the non-empty string **`api-user`** (not an empty string). Baseline services should use **`IActorContext`** instead of reading **`HttpContext.User`** directly. - **Auth on baseline controllers:** **`Run
**Headings:** Trusted baseline (49R pass 2 — Corrected 50R, Corrected 51R discipline); Corrected 51R — actor, auth, mutation audit (baseline only); What is trusted (Category A); Optional / partial (Category B — not required for baseline success); Demo seed contract; Proof checklist (local)

#### `library/UI_ARCHITECTURE_V1_1.md`
**Scope:** **Scope:** Engineering backlog deferred past V1 UI contract work; aligns with migration of core authority types to OpenAPI-backed aliases and `/api/proxy` verb parity. Not a buyer document.
**Title:** Operator UI architecture — deferred to V1.1
**Summary:** Baseline V1 commitments already shipped: - **`/api/proxy` verb parity:** `PUT` and `DELETE` forwarded to upstream (alongside existing `GET` / `POST`) so browser calls to `src/lib/api/http.ts` (`apiPutNoContent`, `apiDelete`) succeed. - **Contract-aligned authority facade:** `types/authority.ts` combines **OpenAPI** `components` (e.g. `RunSummaryResponse`, `RunDetailDto`, `ArtifactDescriptorResponse` with null-stripped optional ids where JSX requires `string | undefined`) with **manual** shapes where the snapshot is ambiguous (`ManifestSummary`) or comparisons/trust payloads are UI-scoped literals. The items below remain **out of scope for V1** and are intentionally deferred to **V1.1** (or l
**Headings:** Operator UI architecture — deferred to V1.1; 1. Client data-fetching layer (TanStack Query / SWR); 2. Global client state beyond current Context scopes; 3. Deeper consolidation of manual `types/*` with OpenAPI; 4. Operator route caching (`force-dynamic` nuance); 5. `SidebarNav` decomposition; 6. Segment-level `not-found.tsx` for dynamic routes; 7. Streaming and nested `Suspense` on heavy pages

#### `library/UI_COMPONENTS.md`
**Scope:** **Scope:** Operator UI — shared components (archlucid-ui) - full detail, tables, and links in the sections below.
**Title:** Operator UI — shared components (`archlucid-ui`)
**Summary:** **Purpose:** Document reusable React components that are not covered in depth by **`archlucid-ui/docs/COMPONENT_REFERENCE.md`** (shadcn primitives) but are important for operator workflows. **Scope:** `archlucid-ui/src/components/` application-level wrappers. Primitives live under **`src/components/ui/`**. **File:** `archlucid-ui/src/components/ConfirmationDialog.tsx` **Underlying primitive:** Radix **`AlertDialog`** (`archlucid-ui/src/components/ui/alert-dialog.tsx`) | Prop | Type | Default | Notes | |------|------|---------|--------| | **`open`** | `boolean` | — | Controlled visibility. | | **`onOpenChange`** | `(open: boolean) => void` | — | Fires when the dialog should close (e.g. cancel
**Headings:** Operator UI — shared components (`archlucid-ui`); `ConfirmationDialog`; Props (`ConfirmationDialogProps`); When to use; Usage example; `RunProgressTracker`; Props (`RunProgressTrackerProps`); Polling behavior

#### `library/V1_DEFERRED.md`
**Scope:** **Scope:** ArchLucid V1 — deferred and exploratory (doc inventory) - full detail, tables, and links in the sections below.
**Title:** ArchLucid V1 — deferred and exploratory (doc inventory)
**Summary:** **Audience:** product, pilots, and engineering leads who read scattered docs and need one **intentional** story: what is **shipped for V1** vs what is **explicitly not promised yet**. **Relationship:** [V1_SCOPE.md](V1_SCOPE.md) defines the **V1 contract** (in scope, non-goals, happy path). **This file** lists areas that docs describe as **partial, follow-up, gap, or Phase-7-style cleanup** so nothing reads as an open-ended roadmap by accident. **Rules:** No code changes implied here. Items are **documentation-sourced**; treat as **V1.1+ candidates or internal backlog** unless your program promotes them. **Operator UI (V1 vs V1.1):** V1 proxy/types work and the V1.1-only UI architecture back
**Headings:** ArchLucid V1 — deferred and exploratory (doc inventory); 1. Product and learning (signals, planning drafts, follow-ups); 2. Compliance narrative: durable audit vs other stores; 3. Rename, keys, and platform cleanup (Phase 7); 4. Operator experience and CI honesty; 5. Infrastructure and organizational polish; 6. Atlassian documentation connector — Confluence in **V1 GA** (supersedes V1.1-only 2026-04-24 pinning); 6a. Chat-ops — Slack scope note (supersedes 2026-04-23 V2-only row)

#### `library/V1_RC_DRILL.md`
**Scope:** **Scope:** V1 release-candidate (RC) drill - full detail, tables, and links in the sections below.
**Title:** V1 release-candidate (RC) drill
**Summary:** **Audience:** Release owners, SRE, and pilot leads validating a **candidate build** or **fresh environment** before sign-off. **Purpose:** One **ordered** end-to-end path through the **V1 operator surface**—aligned with [V1_SCOPE.md](V1_SCOPE.md) §4, [V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md), and the actual HTTP routes in OpenAPI (`/openapi/v1.json`). **What this is not:** Full regression (see [TEST_STRUCTURE.md](TEST_STRUCTURE.md)), Terraform apply validation (see [DEPLOYMENT_TERRAFORM.md](DEPLOYMENT_TERRAFORM.md)), or Playwright UI proof against a live API (see [RELEASE_SMOKE.md](RELEASE_SMOKE.md) §57R). | Requirement | Notes | |-------------|--------| | **API running** | Target U
**Headings:** V1 release-candidate (RC) drill; Prerequisites; or API key auth:; Phase 0 — Deploy fresh (environment); Phase 1 — Health and version; Phase 2 — Create request → execute → commit (two runs); Run A; Run B

#### `library/V1_READINESS_SUMMARY.md`
**Scope:** **Scope:** ArchLucid V1 — readiness summary - full detail, tables, and links in the sections below.
**Title:** ArchLucid V1 — readiness summary
**Summary:** **Audience:** release owners, pilot leads, and executives who need a **short, honest** picture of where the repo stands for a **V1 / pilot** cut—not a marketing sheet. **Basis:** This reflects **what the repository actually contains today** (code, docs, scripts, checklists). It does **not** certify a specific customer environment until you run your own gates. The codebase ships a **working V1-shaped product**: HTTP API, SQL persistence (DbUp), operator UI, CLI, health/version, support bundle, compare/replay/export surfaces, and documented pilot paths. **Self-serve SaaS trial** is covered by a **merge-blocking** live spec ([`archlucid-ui/e2e/live-api-trial-end-to-end.spec.ts`(../../archlucid-
**Headings:** ArchLucid V1 — readiness summary; One-paragraph verdict; What is done (in-repo, supportable); What is intentionally deferred; What risks remain; What is good enough for pilot / V1; What should be first after V1; Related documents

#### `library/V1_RELEASE_CHECKLIST.md`
**Scope:** **Scope:** ArchLucid V1 — release checklist - full detail, tables, and links in the sections below.
**Title:** ArchLucid V1 — release checklist
**Summary:** **Audience:** release owner, SRE, and pilot program leads cutting a **V1** build or environment. **How to use:** Work top to bottom. Check boxes when the item is **done for this release** (build ID / environment recorded in your run notes). This is **operational**, not a substitute for full automated CI. **Scope:** Aligned with [V1_SCOPE.md](V1_SCOPE.md). **Automated gates:** [RELEASE_LOCAL.md](RELEASE_LOCAL.md), [RELEASE_SMOKE.md](RELEASE_SMOKE.md), [TEST_STRUCTURE.md](TEST_STRUCTURE.md). **RC environment drill (API already running):** [V1_RC_DRILL.md](V1_RC_DRILL.md) and **`v1-rc-drill.ps1`**. - [ ] **V1 scope** is unchanged or [V1_SCOPE.md](V1_SCOPE.md) is updated with date + notes (no si
**Headings:** ArchLucid V1 — release checklist; 1. Scope freeze; 2. Deployment readiness; 3. Health and diagnostics; 4. Guided operator flow validation; 5. Export quality validation; 6. Naming consistency; 7. Support bundle validation

#### `library/V1_REQUIREMENTS_TEST_TRACEABILITY.md`
**Scope:** **Scope:** V1 requirements ↔ tests / scripts traceability - full detail, tables, and links in the sections below.
**Title:** V1 requirements ↔ tests / scripts traceability
**Summary:** **Audience:** Engineers and operators who need a **lightweight** map from **[`V1_SCOPE.md`](V1_SCOPE.md)** to **evidence in this repo** (docs, automated tests, scripts). **Status:** Living document. When **`V1_SCOPE.md`** changes, update the corresponding rows here. **Not a substitute for:** Full requirements management tooling, 100% test enumeration, or contractual compliance matrices. **Last reviewed:** 2026-04-17 (integration outbox NFR row). | V1 reference (see V1_SCOPE) | Primary docs | Representative tests / automation | Example `dotnet test --filter` | Notes | |-----------------------------|--------------|-----------------------------------|----------------------------------|--------|
**Headings:** V1 requirements ↔ tests / scripts traceability; Traceability matrix; Non-functional traceability (implicit V1 gates); Data consistency: comparison orphans (archival / missing runs); Related documents

#### `library/V1_SCOPE.md`
**Scope:** **Scope:** ArchLucid V1 — scope contract - full detail, tables, and links in the sections below.
**Title:** ArchLucid V1 — scope contract
**Summary:** **Audience:** Product, engineering, pilots, and operators who need a single, decisive boundary for what "V1" means in this repository. **Status:** Contract for the current codebase and docs. It describes what is implemented and supportable today, not a roadmap of net-new capabilities. This scope document lists in-scope capabilities, explicit out-of-scope items, the operator happy path, and minimum release checks. Naming and rename posture are summarized in **Related** below. - **[README.md](REPOSITORY_README.md)** — repo overview and install spine - **[GLOSSARY.md](GLOSSARY.md)** — terms and naming - **[BREAKING_CHANGES.md](../../BREAKING_CHANGES.md)** — breaking change trail - **[ARCHLUCID_RENAM
**Headings:** ArchLucid V1 — scope contract; Related; 1. What this document does; 2. In scope for V1 — organized by product layer; Layer 1 — Pilot; 2.1 Run lifecycle: request → execute → commit; 2.2 Manifest and artifact review; 2.3 Export and package generation

#### `library/WORKFLOW_RECIPES_BY_PERSONA.md`
**Scope:** **Scope:** Compatibility stub — **`WORKFLOW_RECIPES_BY_PERSONA`** body moved Phase **1** to [`customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md`](customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md).
**Title:** Moved — persona workflow recipes
**Summary:** Canonical copy-paste personas doc (API / CLI / UI map) now lives here: [**`customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md`**](customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md).
**Headings:** Moved — persona workflow recipes

#### `library/bounded-context-map.md`
**Scope:** **Scope:** Bounded context map (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** Bounded context map (ArchLucid)
**Summary:** Name the main **domain boundaries**, what each owns, and how they integrate — complementing **`docs/c4/workspace.dsl`**, **`docs/ARCHITECTURE_COMPONENTS.md`**, and **`docs/PROJECT_MAP.md`** (solution projects). | Context | Owns | Integrates via | |---------|------|----------------| | **Authority pipeline** | Run lifecycle, context ingestion, graph, findings snapshot, manifest commit, artifacts | SQL (`dbo.Runs` and children), outbox for retrieval indexing | | **Governance** | Approvals, promotions, environment activation, policy packs | SQL, `IAuditService`, integration events | | **Advisory** | Schedules, scans, digests, recommendations | SQL (advisory schema), worker hosted services | | **
**Headings:** Bounded context map (ArchLucid); Objective; Contexts; Integration patterns; Diagram (Mermaid); Related

#### `library/contributor-reference/README.md`
**Scope:** **Scope:** Landing index for **contributor-, CI-, and vendor-operator–oriented** `docs/library/` material (`docs/library/contributor-reference/` — Phase **1** split).
**Title:** Contributor-oriented library docs (Phase 1)
**Summary:** Cluster **engineering reference** markdown so evaluator pilots browsing `library/` are not one click away from code maps and coverage manifests. Bookmark these canonical paths (**no stub yet**): | Topic | Path from `library/` | | --- | --- | | Install/build loop | [`BUILD.md`](../BUILD.md) | | Test tiers & CI filters | [`TEST_STRUCTURE.md`](../TEST_STRUCTURE.md), [`TEST_EXECUTION_MODEL.md`](../TEST_EXECUTION_MODEL.md) | | Where-to-patch atlas | [`CONTRIBUTOR_CODE_MAP.md`](../CONTRIBUTOR_CODE_MAP.md) | | Contributor quick ramp | [`CONTRIBUTOR_QUICK_START.md`](../CONTRIBUTOR_QUICK_START.md) | | Apex marketing + Front Door coexistence (`archlucid.net`) | [`PUBLIC_MARKETING_SITE_TOPOLOGY.md`](..
**Headings:** Contributor-oriented library docs (Phase 1); Objective; What lives here today (explicit index — files remain at `library/` root until phased moves complete); Phase roadmap; See also

#### `library/coverage-exclusions.md`
**Scope:** **Scope:** Code Coverage Exclusions - full detail, tables, and links in the sections below.
**Title:** Code Coverage Exclusions
**Summary:** This document describes the classes and methods excluded from code coverage via `[ExcludeFromCodeCoverage]` and the justification for each exclusion. After the full-solution run, ReportGenerator merges Coverlet fragments to **`Cobertura.xml`**; **`scripts/ci/assert_merged_line_coverage_min.py`** enforces the floors below in **`.github/workflows/ci.yml`** job **`.NET: full regression (SQL)`** (`dotnet-full-regression`). Parsing and the product filter are in **`scripts/ci/coverage_cobertura.py`**. **`is_product_archlucid_package()`** applies the per-package gate only to production **`ArchLucid.*`** assemblies (excludes test projects and **`ArchLucid.TestSupport`**); packages with zero coverabl
**Headings:** Code Coverage Exclusions; Enforced CI coverage gates; Exclusion Policy; Category 1: Azure SDK / External Service Thin Wrappers; Category 2: Configuration / Options DTOs; Category 3: SQL Connection / RLS Infrastructure; Category 4: SQL-Dependent Repository Implementations; ArchLucid.Persistence (29 classes)

#### `library/customer-facing/README.md`
**Scope:** **Scope:** Landing index for markdown that **skew buyers, evaluators, tenant operators, and procurement** (`docs/library/customer-facing/` — Phase **1** of library audience split).
**Title:** Customer-facing library docs (Phase 1)
**Summary:** Make it obvious **which `library/` files are meant for SaaS pilots** without asking them to wade past contributor codegen maps. | Topic | Canonical path | | --- | --- | | Persona copy-paste recipes (UI / API / CLI) | [WORKFLOW_RECIPES_BY_PERSONA.md](WORKFLOW_RECIPES_BY_PERSONA.md) | **Bookmark stub:** legacy path [`library/WORKFLOW_RECIPES_BY_PERSONA.md`](../WORKFLOW_RECIPES_BY_PERSONA.md) forwards here. Remaining audience-split work (Phase 2–3, stubs, guarded moves for **`API_CONTRACTS.md`**, etc.) is tracked as **[TECH_BACKLOG TB-013](../TECH_BACKLOG.md#tb-013--documentation-library-audience-reorganisation-remaining-phases)**. - [`DOCUMENTATION_BY_AUDIENCE.md`](../DOCUMENTATION_BY_AUDIENCE
**Headings:** Customer-facing library docs (Phase 1); Objective; What moved here (Phase 1); Next phases (deferred — see backlog); See also

#### `library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md`
**Scope:** **Scope:** Copy-paste adoption recipes that map existing product surfaces (API, CLI, operator UI) to four buyer/operator personas. No new product commitments; defer anything not in V1 scope to the linked depth docs.
**Title:** Workflow recipes by persona
**Summary:** Canonical route and HTTP map: [OPERATOR_ATLAS.md](../OPERATOR_ATLAS.md). **[`NAVIGATOR.md`](../../NAVIGATOR.md)** lists one “best next doc” per task. **Goal:** Produce a durable **review package** (pipeline outcome, findings, committed golden manifest, exports) suitable for sponsor and engineering handoff. **Prerequisites:** Tenant access with **Read** + **Execute** authority; at least one architecture request worth of context. See [CORE_PILOT.md](../../CORE_PILOT.md) and [SECOND_RUN.md](../SECOND_RUN.md) for a follow-on run. **Steps** 1. **Request** — UI: `/runs/new` · API: `POST /v1/architecture/request` · CLI: `dotnet run --project ArchLucid.Cli -- run` (see [CLI_USAGE.md](../CLI_USAGE.md
**Headings:** Workflow recipes by persona; 1) Solution architect: from request to committed review package; 2) Governance lead: critical finding to approval / policy gate; 3) Procurement / security reviewer: trust artefacts and run-level proof; 4) Platform engineer: manifest delta in CI and deployment evidence

#### `library/demo-quickstart.md`
**Scope:** **Scope:** Demo quickstart (Corrected 50R — Contoso Retail Modernization) - full detail, tables, and links in the sections below.
**Title:** Demo quickstart (Corrected 50R — Contoso Retail Modernization)
**Summary:** **Buyer / evaluator (Docker only):** see **[go-to-market/DEMO_QUICKSTART.md](../go-to-market/DEMO_QUICKSTART.md)** — `docker-compose.demo.yml` + `scripts/demo-start.*`. This guide gets a **fresh SQL-backed** environment to a repeatable demo state: two committed runs (baseline vs hardened), governance workflow rows, environment activations for preview/compare, and an optional sample export-history row. See **[TRUSTED_BASELINE.md](TRUSTED_BASELINE.md)** for what is baseline-trusted vs optional (export replay is not part of the minimal proof). - .NET 10 SDK - SQL Server connection string in `ConnectionStrings:ArchLucid` (LocalDB, Docker via `dotnet run --project ArchLucid.Cli -- dev up`, or you
**Headings:** Demo quickstart (Corrected 50R — Contoso Retail Modernization); Prerequisites; 1. Migrations (DbUp); 2. Enable demo seed; Option A — seed on startup (Development only); Option B — explicit HTTP call; 3. What gets created; 4. Verify with HTTP

#### `library/operator-shell.md`
**Scope:** **Scope:** ArchLucid operator shell (Change Set 55R) - full detail, tables, and links in the sections below.
**Title:** ArchLucid operator shell (Change Set 55R)
**Summary:** **Audience:** Internal operators and design partners using the thin Next.js UI in `archlucid-ui/` against the ArchLucid API. **Canonical route × API × CLI map:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md). A read-focused **operator shell** for the three ArchLucid product layers: | Layer | What you do here | |-------|-----------------| | **Core Pilot** | Create reviews, track execution, finalize reviews, review and download artifacts | | **Operate (analysis workloads)** | Compare reviews, replay authority chains, explore the evidence graph, run Q&A and advisory scans | | **Operate (governance and trust)** | Governance approvals, policy packs, audit log, alerts, compliance drift | It is not a repl
**Headings:** ArchLucid operator shell (Change Set 55R); What it is; Buyer-facing vocabulary; In-product layer hints (UI); Navigation authority hints (structural); Main workflow; Core Pilot path (steps 1–4 — start here); Operate (analysis workloads) (available once you have a finalized review with a persisted architecture snapshot)

#### `library/terraform-azure-variables.md`
**Scope:** **Scope:** Terraform / Azure variables (reference sketch) - full detail, tables, and links in the sections below.
**Title:** Terraform / Azure variables (reference sketch)
**Summary:** **Purpose:** Map ArchLucid dependencies to IaC variables so environments stay reproducible. This is a **checklist**, not a full module. | Variable / setting | Used for | Notes | |--------------------|----------|--------| | `sql_connection_string` (secret) | **`ConnectionStrings:ArchLucid`** | Prefer **private endpoint** SQL; no public `0.0.0.0/0`. | | `storage_account_name` + keys / MI | Artifacts, optional file connectors | **Private endpoint**; **no public SMB 445** exposure. | | `key_vault_uri` | Secrets, connection strings | App Service / Container Apps **Key Vault references**. | | `cors_allowed_origins` | Browser SPA origins | Must match **`Cors:AllowedOrigins`** array in app config. |
**Headings:** Terraform / Azure variables (reference sketch); Core variables (typical); Diagram (dependencies); API Management (Consumption, Azure only); Front Door + WAF (optional edge); Private endpoints — SQL + Blob (optional); Entra ID — API application (optional); Constraints

### `onboarding`

#### `onboarding/CORE_PILOT_FIRST_SESSION_PLAN.md`
**Scope:** **Scope:** Core Pilot — first session plan (analysis) - full detail, tables, and links in the sections below.
**Title:** Core Pilot — first session plan (analysis)
**Summary:** **Objective.** Reduce time-to-value on the default **Core Pilot** path: architecture request → run → committed manifest → reviewable artifacts and aggregate explanation. > **Install order moved.** See [../archive/INSTALL_ORDER.md](../archive/INSTALL_ORDER.md). This file is analysis only (week-one tasks after install). | Step | `ArchLucid.Cli` (see `Program.cs` cases) | REST (`ArchLucid.Api`) | Operator UI | |------|------------------------------------------|-------------------------|-------------| | Create / drive run | `run`, `status`, `submit`, `commit`, `seed`, `artifacts` | `/v1/...` authority and architecture routes (versioned under `/v1` per `README.md`) | [`archlucid-ui/src/app/(opera
**Headings:** Core Pilot — first session plan (analysis); CLI ↔ API ↔ UI map; Current friction (approximate); Five concrete improvements (file-level)

#### `onboarding/EVALUATION_GUIDE.md`
**Scope:** **Scope:** Unified onboarding and evaluation guide for buyers and operators. Replaces the former `BUYER_FIRST_30_MINUTES.md` and `CORE_PILOT.md`.
**Title:** ArchLucid Evaluation Guide
**Summary:** **Audience:** Prospective buyers, evaluators, operators, and design partners completing their first pilot. **Purpose:** Define the end-to-end journey from an empty tenant to a reviewed, exportable **architecture review package**. ArchLucid is a SaaS product. You will not install anything to evaluate it. Evaluating the product itself happens on the hosted SaaS at [`archlucid.net`](https://archlucid.net). There is no Docker, SQL, .NET, Node, Terraform, or CLI on the buyer path. Five steps. Roughly thirty minutes end-to-end on a normal connection. 1. **Sign in.** Open [`archlucid.net`](https://archlucid.net) and sign in with your work identity. 2. **Pick a vertical.** Choose the closest match (
**Headings:** ArchLucid Evaluation Guide; Part 1: Your first 30 minutes (Buyer / Evaluator path); What 30 minutes looks like; Part 2: Core Pilot (Operator path); Zero-config sample first; Step 1 — Create an architecture review; Step 2 — Execute the run; Step 3 — Commit the manifest

#### `onboarding/README.md`
**Scope:** **Scope:** Week-one onboarding (role-scoped) - full detail, tables, and links in the sections below.
**Title:** Week-one onboarding (role-scoped)
**Summary:** > **Install order stub:** [../INSTALL_ORDER.md](../INSTALL_ORDER.md). Persona routing: **[../START_HERE.md](../START_HERE.md)** — then return here for your role’s checklist. Short **ticket-style** checklists for onboarding to **ArchLucid**: each page lists only **3–5** outcomes a role typically touches in the **first week**. Deep dives stay in the linked golden path and architecture docs. | Role | Day-one ticket | |------|----------------| | **Developer** | [day-one-developer.md](day-one-developer.md) | | **SRE / Platform** | [day-one-sre.md](day-one-sre.md) | | **Security / GRC** | [day-one-security.md](day-one-security.md) | **Exec / security reviews (non-Mermaid):** static **C4 PNGs** and
**Headings:** Week-one onboarding (role-scoped)

#### `onboarding/day-one-developer.md`
**Scope:** **Scope:** Day one — Developer (week one) - full detail, tables, and links in the sections below.
**Title:** Day one — Developer (week one)
**Summary:** **Goal:** Ship a small, safe change or run the **ArchLucid** stack locally with confidence. **Not** full domain mastery. (Repo and projects: `ArchLucid.*`.) **Canonical operator action map:** [OPERATOR_ATLAS.md](../library/OPERATOR_ATLAS.md) (UI route × API × CLI × authority — use this instead of memorizing scattered onboarding-only lists). > **Install order moved.** See [INSTALL_ORDER.md](../archive/INSTALL_ORDER.md). This page now only covers Developer week-one tasks **after** install. **Ticket:** `ONBOARD-DEV-001` (copy into your work tracker) - [ ] **1. Toolchain done** — You finished the **Local dev** column in the canonical one-pager (see [../START_HERE.md](../START_HERE.md) first tabl
**Headings:** Day one — Developer (week one); Scope (3–5 outcomes — check off by end of week one); Fast path commands; Start dependencies (SQL, Azurite, Redis); Run fast tests; Run the API; Run the UI (in a new terminal); Escalation

#### `onboarding/day-one-security.md`
**Scope:** **Scope:** Day one — Security / GRC (week one) - full detail, tables, and links in the sections below.
**Title:** Day one — Security / GRC (week one)
**Summary:** **Goal:** Map **trust boundaries**, **identity**, and **data-plane exposure** for **ArchLucid** in **your** Azure landing zone. **Not** a full pen test or every ADR. **Canonical operator action map:** [OPERATOR_ATLAS.md](../library/OPERATOR_ATLAS.md) — where Operate (governance and trust) routes live vs Core Pilot defaults. > **Install order moved.** See [INSTALL_ORDER.md](../archive/INSTALL_ORDER.md). This page now only covers Security / GRC week-one tasks **after** install. **Ticket:** `ONBOARD-SEC-001` (copy into your work tracker) - [ ] **1. Trust narrative** — Read [CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md) (edge → API → SQL/blob; Entra vs API key; private e
**Headings:** Day one — Security / GRC (week one); Scope (3–5 outcomes — check off by end of week one); Escalation

#### `onboarding/day-one-sre.md`
**Scope:** **Scope:** Day one — SRE / Platform (week one) - full detail, tables, and links in the sections below.
**Title:** Day one — SRE / Platform (week one)
**Summary:** **Canonical operator action map:** [OPERATOR_ATLAS.md](../library/OPERATOR_ATLAS.md) — routes, APIs, and CLI in one table (health, deploy, governance surfaces). **Goal:** Know how the **ArchLucid** service **starts**, **fails**, and **deploys** in your environment. **Not** full Terraform depth for every optional root. > **Install order moved.** See [INSTALL_ORDER.md](../INSTALL_ORDER.md). This page now only covers SRE / Platform week-one tasks **after** install. **Ticket:** `ONBOARD-SRE-001` (copy into your work tracker) - [ ] **1. Health model** — Call **`GET /health/live`**, **`GET /health/ready`**, **`GET /health`** against a running instance; know which dependencies block readiness (SQL,
**Headings:** Day one — SRE / Platform (week one); Scope (3–5 outcomes — check off by end of week one); Escalation

### `operations`

#### `operations/MIGRATION_INCIDENT_RUNBOOK.md`
**Scope:** **Scope:** For operators responding to failed DbUp SQL migrations in staging or production—journal drift, rollback scripts, and retry mechanics; **not** general database design or how to author new migrations.
**Title:** Migration incident runbook (DbUp)
**Summary:** Give operators a concise playbook when embedded SQL migrations (`ArchLucid.Persistence/Migrations/*.sql`) fail in production or staging, and clarify how journal drift, rollback scripts, and re-runs interact. - Host uses [`DatabaseMigrator`](../../ArchLucid.Persistence/Data/Infrastructure/DatabaseMigrator.cs) with **per-script transactions** (`WithTransactionPerScript()`). - Journal table is **`dbo.SchemaVersions`** (DbUp default). - Forward migrations are sequential and lexicographically ordered by embedded resource name (`NNN_Name.sql`). 1. **Expectation**: For a single script file, SQL Server runs batches (`GO`-separated) inside **one transaction**. If any batch fails, that script’s change
**Headings:** Migration incident runbook (DbUp); Objective; Assumptions; When a migration fails mid-run; Identifying state from `dbo.SchemaVersions`; Journal drift (empty or missing rows while objects exist); Rollback scripts (`Migrations/Rollback/`); Failure injection / transaction semantics

#### `operations/TENANT_SQL_TOPOLOGY_RUNBOOK.md`
**Scope:** **Scope:** Runbook for **system vs tenant** SQL catalogs when `ArchLucid:SqlTopology:Mode=SystemWithPerTenantCatalogs`; not application-layer debugging or generic SQL performance tuning.
**Title:** Tenant SQL topology — operations
**Summary:** Operators can triage **control-plane** failures separately from **tenant catalog** failures without scanning every tenant on each readiness probe. | Symptom | Likely plane | Checks | |--------|--------------|--------| | `GET /health/ready` — **`sql_system_plane` unhealthy** | System catalog | `ConnectionStrings:ArchLucidSystem`, private DNS to SQL, firewall, identity | | **`database` unhealthy, `sql_system_plane` healthy** | Primary / template catalog or scoped tenant path | `ConnectionStrings:ArchLucid`, `TenantCatalogConnectionStringTemplate`, binding row state | | Registration / trial fails after tenant insert | Tenant provisioning | `TenantDatabaseBindings.ProvisioningState`, app logs fr
**Headings:** Tenant SQL topology — operations; Objective; Symptoms; Commands (redacted); Recovery; References

### `performance`

#### `performance/BACKEND_PERFORMANCE_REVIEW_STATUS.md`
**Scope:** **Scope:** Implementation-status tracker for backend engineers; records what has been shipped against the Backend Performance Review plan (indexes, pagination, caching, N+1 reductions) — not a design doc or benchmark report.
**Title:** Backend performance review — implementation status
**Summary:** This document tracks work done against the Backend Performance Review plan (indexes, keyset pagination, N+1 reductions, caching, artifact metadata-only reads, watchdog). - **Indexes**: See migrations `123`–`126` and `ArchLucid.Persistence/Scripts/ArchLucid.sql` for greenfield alignment (runs scope index, finding filter indexes, audit `EventType` index, background jobs `Running` filtered index). - **Run lists**: Keyset pagination for runs (`IRunRepository`, `CachingRunRepository`, API responses) with `CursorPagedResponse`. - **Findings**: `IFindingsSnapshotRepository.ListFindingRecordsKeysetAsync` with SQL (`SqlFindingsSnapshotRepository`) and in-memory emulation (`InMemoryFindingsSnapshotRep
**Headings:** Backend performance review — implementation status; Done in tree; Partial / follow-up; Operational notes

### `quality`

#### `quality/MANUAL_QA_CHECKLIST.md`
**Scope:** **Scope:** Manual QA and pilot operators validating scenarios that automated tests cannot cover; it is not a substitute for unit, integration, or Playwright coverage.
**Title:** ArchLucid Comprehensive Manual QA Checklist
**Summary:** This checklist focuses **exclusively** on scenarios that are either impossible, extremely brittle, or computationally infeasible to automate. These tests rely on human judgment, subjective evaluation, empathy, and complex out-of-band interactions. Everything else (API contracts, state mutations, RBAC enforcement, standard UI flows) should be handled by automated tests (e.g., unit, integration, Playwright). **Agent output quality (structural / semantic scores, release bar):** A **key** part of manual QA for AI-backed runs is understanding what those metrics mean, why numeric floors should not be pushed toward 1.0 without calibration, and what you can do in prompts and briefs to keep scores le
**Headings:** ArchLucid Comprehensive Manual QA Checklist; 1. User Experience & Cognitive Load (The "Architect" Persona); 1.1. "Run Rationale" Comprehension; 1.2. Graph Snapshot Visualization and Orientation; 1.3. Finding Resolution Context; 2. Onboarding & The "Day One" Experience; 2.1. Azure Marketplace & Procurement Flow (The "Trial Funnel"); 2.2. SCIM Provisioning and First Login

#### `quality/REAL_LLM_GOLDEN_COHORT_GATE_EVIDENCE_2026-05-09.md`
**Scope:** **Scope:** Record of a **2026-05-09** attempt to run the golden-cohort / eval-corpus real-LLM evidence path per [`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) and [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md); includes credential-free **exemplar** scoring from `scripts/ci/eval_agent_corpus.py` — **not** a substitute for live Azure OpenAI completions.
**Title:** Golden cohort real-LLM gate — evidence (2026-05-09)
**Summary:** Live execution requires `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and `AZURE_OPENAI_DEPLOYMENT_NAME` (see [`docs/library/FIRST_REAL_VALUE.md`](../library/FIRST_REAL_VALUE.md)). In the automation shell used for this record, all three were **unset** (`python` `os.environ.get` check on 2026-05-09). **No API or `archlucid try --real` invoke ran**; no cloud credentials were used or logged. **Operator follow-up (live evidence):** 1. Set `ARCHLUCID_REAL_AOAI=1` and the `AZURE_OPENAI_*` variables; start the stack in **Real** mode per `FIRST_REAL_VALUE.md`. 2. Run architecture executes that yield **Topology / Cost / Compliance / Critic** `AgentResult` JSON (or export `ParsedResultJson` / use `
**Headings:** Golden cohort real-LLM gate — evidence (2026-05-09); Live Azure OpenAI attempt (blocked in this environment); Session record (template fields); Exemplar-only metrics (2026-05-09T17:51:07Z); Links

#### `quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`
**Scope:** **Scope:** Single-session record for real Azure OpenAI (non-simulator) authority runs — supports manual QA §8.3, golden cohort posture, and pilot credibility; **not** a substitute for automated eval jobs.
**Title:** Real-LLM run evidence — session template
**Summary:** **Audience:** Operators and release owners documenting **one** real-mode validation session. | Field | Value | |-------|--------| | **Date (UTC)** | | | **Environment** | Staging / pilot stack — URL pattern only | | **Agent mode** | Real / real-with-fallback (as configured) | | **Model or deployment id** | If policy allows | | **Brief / scenario id** | Internal id or short description (no customer PII) | | **Run id** | Authority run GUID | | **Outcome** | Commit succeeded / blocked / aborted — note | | **Human verdict** | **acceptable for pilot** / **not yet** — 1–3 sentences | | **Structural / semantic scores** | If surfaced (UI, diagnostics, export) | | **Follow-ups** | Prompt, brief quali
**Headings:** Real-LLM run evidence — session template; Session record (copy per run); Checklist (align with [MANUAL_QA_CHECKLIST.md](MANUAL_QA_CHECKLIST.md) §8.3); Green cohort bar (release planning); Links

#### `quality/REAL_MODE_EVIDENCE_RELEASE_CHECKIN.md`
**Scope:** **Scope:** Release-owner checklist stub for **real-mode** (Azure OpenAI) agent output evidence — complements offline `tests/eval-corpus` CI. Not a substitute for `docs/quality/MANUAL_QA_CHECKLIST.md` §8.3.
**Title:** Real-mode agent evidence — release check-in (stub)
**Summary:** **Purpose:** Satisfy the **“check-in Markdown summary”** gap called out in `docs/archive/assessments/QUALITY_ASSESSMENT_2026_05_01_INDEPENDENT_76_76.md` §9 item 6 without inventing AOAI deployment names. 1. **Reference deployment** — Record the **named** Azure OpenAI resource + deployment used for real-mode checks in private release notes (owner tabled until deployment exists). 2. **Manual gate** — Run **`docs/quality/MANUAL_QA_CHECKLIST.md` §8.3** (*Real-LLM / agent output quality*) against **staging** or a designated host. 3. **Corpus** — For offline parity, see **`docs/library/AGENT_EVAL_CORPUS.md`** and **`scripts/ci/eval_agent_quality.py`**; CI remains credential-free. 4. **Conservative
**Headings:** Real-mode agent evidence — release check-in (stub); Before tagging a release candidate; Artifact (optional)

#### `quality/game-day-log/2026-04-29-staging-sql-pool-exhaustion.md`
**Scope:** **Scope:** Closing report scaffold for **2026-04-29** staging chaos game day — SQL connection pool exhaustion under trial-signup load. Fill after the drill; links to [`README.md`](README.md) calendar row.
**Title:** Game day close-out — 2026-04-29 — Staging — SQL pool exhaustion (trial-signup load)
**Summary:** | Field | Value | |-------|-------| | **Date (UTC)** | 2026-04-29 | | **Environment** | Staging only | | **Scenario** | SQL connection pool exhaustion under live trial-signup load | | **RTO/RPO target (staging)** | RTO ≤ **4h**, RPO ≤ **1h** ([RTO_RPO_TARGETS.md](../../library/RTO_RPO_TARGETS.md)) | | **Workflow run** | _Paste GitHub Actions run URL after `simmy-chaos-scheduled.yml` (or manual `dotnet test` evidence if workflow skipped)._ | Per [`README.md`](README.md) § first-run scenario: 1. **`GET /health/ready`** — _Expected:_ non-success / degraded while SQL pool is saturated. _Observed:_ _TBD_ 2. **In-flight commits (UoW)** — _Expected:_ transactions that already hold a connection comp
**Headings:** Game day close-out — 2026-04-29 — Staging — SQL pool exhaustion (trial-signup load); Expected behaviour (validate / correct during close-out); Actual symptoms observed; Recovery; Runbooks; What we changed in the runbook because of this

#### `quality/game-day-log/2026-07-29-staging-placeholder.md`
**Scope:** **Scope:** Reserved closing-report slot for **2026-07-29** quarterly staging chaos game day (scenario TBD). Replace this stub before the run.
**Title:** Game day — 2026-07-29 — Staging — (placeholder)
**Summary:** Scenario and close-out sections will be filled after the Q3 game day. Calendar: [`README.md`](README.md).
**Headings:** Game day — 2026-07-29 — Staging — (placeholder)

#### `quality/game-day-log/2026-10-28-staging-placeholder.md`
**Scope:** **Scope:** Reserved closing-report slot for **2026-10-28** quarterly staging chaos game day (scenario TBD). Replace this stub before the run.
**Title:** Game day — 2026-10-28 — Staging — (placeholder)
**Summary:** Scenario and close-out sections will be filled after the Q4 game day. Calendar: [`README.md`](README.md).
**Headings:** Game day — 2026-10-28 — Staging — (placeholder)

#### `quality/game-day-log/README.md`
**Scope:** **Scope:** Quarterly staging chaos game day calendar, closing-report links, and Simmy workflow alignment; production chaos remains owner-gated ([PENDING_QUESTIONS.md](../../PENDING_QUESTIONS.md) item **34**).
**Title:** Game day log — quarterly staging chaos (calendar)
**Summary:** **Primary automation:** [`.github/workflows/simmy-chaos-scheduled.yml`](../../../.github/workflows/simmy-chaos-scheduled.yml) (cron **14:00 UTC** on each calendar row below; `workflow_dispatch` is **staging-only** — production is blocked at step one per item **34**). **Runbook:** [`docs/runbooks/GAME_DAY_CHAOS_QUARTERLY.md`](../../runbooks/GAME_DAY_CHAOS_QUARTERLY.md) · **RTO/RPO (staging tier):** [`docs/RTO_RPO_TARGETS.md`](../../library/RTO_RPO_TARGETS.md) (≤ **4h** RTO, ≤ **1h** RPO for staging/pre-production) · **Failover:** [`docs/runbooks/DATABASE_FAILOVER.md`](../../runbooks/DATABASE_FAILOVER.md) · **Degraded behaviour:** [`docs/DEGRADED_MODE.md`](../../library/DEGRADED_MODE.md) · **C
**Headings:** Game day log — quarterly staging chaos (calendar); Calendar (next three runs); First run scenario — expected behaviour (2026-04-29); Artifact policy

#### `quality/golden-cohort-drift-latest.md`
**Scope:** **Scope:** Latest golden-cohort drift summary for engineers and CI owners — intent is a single landing place for the most recent nightly cohort run vs baseline; not a full manifest diff or substitute for workflow run logs.
**Title:** Golden cohort drift report
**Summary:** This file is the **latest** drift summary for the fixed golden cohort (`tests/golden-cohort/cohort.json`). | Field | Value | | --- | --- | | Last pipeline run | _(pending — populated by CI on first nightly execution)_ | | Mode | simulator (default) | | Real LLM | disabled (`ARCHLUCID_GOLDEN_COHORT_REAL_LLM` not set) | _No automated drift body yet — extend the nightly workflow to append manifest/category diffs here._ Archived copies: `docs/quality/archive/` (dated filenames).
**Headings:** Golden cohort drift report; Results

### `runbooks`

#### `runbooks/ADVISORY_SCAN_FAILURES.md`
**Scope:** **Scope:** Runbook: Advisory scan failures and schedule advance - full detail, tables, and links in the sections below.
**Title:** Runbook: Advisory scan failures and schedule advance
**Summary:** **Last reviewed:** 2026-04-16 - Logs: **`Advisory scan failed for schedule {ScheduleId}`** from **`AdvisoryScanHostedService`**. - **`AdvisoryScanExecution`** rows with **`Status=Failed`** or advisory UI showing repeated failures for a schedule. **`AdvisoryScanRunner`** records execution status and **still advances** the schedule’s next run (failures do not block cadence indefinitely). Verify this matches product expectations before changing code. 1. **Correlation:** Match **`ScheduleId`** / **`ExecutionId`** in logs to **`AdvisoryScanSchedule`** and latest **`AdvisoryScanExecution`**. 2. **Scope:** Confirm **`AmbientScopeContext`** during the run matches tenant/workspace/project on the sche
**Headings:** Runbook: Advisory scan failures and schedule advance; Symptoms; What should happen (v1); Triage; Mitigation; Escalation

#### `runbooks/AGENT_EXECUTION_FAILURES.md`
**Scope:** **Scope:** Agent execution failures - full detail, tables, and links in the sections below.
**Title:** Agent execution failures
**Summary:** **Last reviewed:** 2026-04-24 **Audience:** Operators and on-call engineers triaging failed or stuck architecture runs after `POST .../runs/{runId}/execute` (or internal `ExecuteRunAsync`). - HTTP **500** / **409** from execute, or run stuck in **TasksGenerated** / **WaitingForResults** while logs show agent errors. - Audit events such as **Architecture.RunFailed** with exception type names after **Architecture.RunStarted**. - **Real** mode: Azure OpenAI timeouts, 429s, or empty model output; **Simulator** mode: handler gaps or invalid synthetic payloads. - **Nodes:** API → `ArchitectureRunService` → `IAgentExecutor` → per-`AgentType` handlers → optional LLM / tools; persistence: `AgentResul
**Headings:** Agent execution failures; Symptoms; System boundaries (for diagrams); Triage checklist; Security; Reliability & cost; Related docs

#### `runbooks/ALERT_DELIVERY_FAILURES.md`
**Scope:** **Scope:** Alert delivery failures - full detail, tables, and links in the sections below.
**Title:** Alert delivery failures
**Summary:** **Last reviewed:** 2026-04-16 **Audience:** Operators debugging outbound alert notifications (webhooks, email, or other channels) and subscription health. - Operators see alerts **evaluated** in the API but no message at the destination. - HTTP webhook returns non-2xx or times out; metrics `alert_delivery_failed` (if enabled) increase. - API listing of **AlertDeliveryAttempt** rows shows **Failed** status with `ErrorMessage` populated. - **Nodes:** `AlertDeliveryDispatcher` → `IAlertDeliveryChannel` implementations → external endpoints; persistence: `AlertDeliveryAttempts`, `AlertRoutingSubscriptions`, alert rows. - **Edges:** Subscription match on severity/channel → attempt row **Started**
**Headings:** Alert delivery failures; Symptoms; System boundaries (for diagrams); Triage checklist; Security; Reliability & cost; Related docs

#### `runbooks/API_KEY_ROTATION.md`
**Scope:** **Scope:** Runbook: API key rotation (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** Runbook: API key rotation (ArchLucid)
**Summary:** **Last reviewed:** 2026-04-16 Rotate **development / automation API keys** accepted by `ArchLucid.Api` (`ApiKeys:AdminKey`, `ApiKeys:ReadOnlyKey`) without downtime for well-behaved clients, using **comma-separated dual values** during cutover. - Keys are stored in **Key Vault references** or **App Service / Container Apps** settings (not committed to git). - Callers can be updated in a **controlled window** (hours to days), not instantaneously. - **SMB (port 445)** is not used for exposing tenant data at the API edge (see workspace security rules). - A single flat key value cannot overlap old+new without parser support — ArchLucid binds **comma-separated** keys so both values authenticate du
**Headings:** Runbook: API key rotation (ArchLucid); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow (rotation); 7. Security model

#### `runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md`
**Scope:** **Scope:** Grafana / Prometheus remediation for authority pipeline metering — dashboards, backlog, stale outbox rows, data-consistency signals; full procedural detail in sections below.
**Title:** Authority pipeline metering and Grafana remediation
**Summary:** **Last reviewed:** 2026-04-29 Turn **Grafana** panels and **Prometheus** alerts on authority-pipeline and data-consistency metrics into **actionable steps** (queue depth, SQL health, worker capacity) without changing product semantics. - Metric names match **`docs/library/OBSERVABILITY.md`** (source **`ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`**). - **Prometheus** scrapes the API and worker **`/metrics`** (or OTLP fan-out) with stable label names (`stage`, `outcome`, `table`, `column`). - Ops can open **`GET /v1/admin/diagnostics/outboxes`** (or equivalent admin surface) for row-level outbox detail when authorized. - **Do not** relax SQL RLS or tenant isolation to “clear” backl
**Headings:** Authority pipeline metering and Grafana remediation; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `runbooks/AZURE_EXTRACTOR_INGEST.md`
**Scope:** **Scope:** Operator runbook — customer Azure extractor ZIP upload, schema, and audit events; not buyer legal text.
**Title:** Azure extractor ingest (operator)
**Summary:** Customers run **`scripts/azure/Get-ArchLucidAzurePackage.ps1`** in their tenant (no ArchLucid credentials in their environment) and upload the resulting **`.zip`** to ArchLucid. - **`POST /v1/azure-extractor/upload`** - **Auth:** ReadAuthority on the route; **ExecuteAuthority** required for the mutation. - **Body:** `multipart/form-data` with field **`file`** (ZIP). - **Query:** optional **`runId`** to associate the upload with an architecture review run in the current workspace scope (run must exist). - **Success:** **202 Accepted** with **`packageId`** (GUID). - **Failure:** **422** when the archive is invalid, **`manifest.json`** is missing or unreadable, or **`schemaVersion`** is not sup
**Headings:** Azure extractor ingest (operator); Overview; API; Schema (`manifest.json`); Persistence and security; Audit; CLI — Terraform export (advisory); Links

#### `runbooks/CANARY_DEPLOYMENT.md`
**Scope:** **Scope:** Canary and blue-green — Azure Container Apps - full detail, tables, and links in the sections below.
**Title:** Canary and blue-green — Azure Container Apps
**Summary:** **Last reviewed:** 2026-04-16 Describe how operators run **revision-based** rollouts for ArchLucid API / worker / UI on **Azure Container Apps**, using Terraform variables, GitHub Actions CD automation, and Azure CLI traffic splits. - Container Apps are deployed from `infra/terraform-container-apps/` with `enable_container_apps = true`. - CI/CD uses `.github/workflows/cd.yml` for image updates; optional **canary** steps split API traffic between revisions before post-deploy smoke and **promote** to 100% when smoke succeeds. - **State safety:** Terraform resource addresses may still contain historical `archiforge` tokens; coordinate `terraform state mv` per Phase 7.5 before renaming resources
**Headings:** Canary and blue-green — Azure Container Apps; Objective; Assumptions; Constraints; Architecture overview; Operational flow; Terraform (one-time or change window); CD automation (ongoing)

#### `runbooks/CMK_ENCRYPTION.md`
**Scope:** **Scope:** Customer-managed keys — Azure Storage and SQL TDE - full detail, tables, and links in the sections below.
**Title:** Customer-managed keys — Azure Storage and SQL TDE
**Summary:** **Last reviewed:** 2026-04-16 Explain how **customer-managed keys (CMK)** protect artifact blob storage in Azure, and where **SQL TDE** fits for database encryption at rest. - Artifact storage is provisioned with `infra/terraform-storage/` (`enable_storage_account = true`). - A **Key Vault** exists (see `infra/terraform-keyvault/` or an existing vault) with a **RSA** or **EC** key suitable for storage encryption. - Storage CMK in Terraform requires the **full key version resource id** (`customer_managed_key_id`). - Key Vault **network** rules and **managed identity** access must allow the storage service to unwrap keys (Microsoft docs: *Customer-managed keys for Azure Storage*). - **SQL TDE*
**Headings:** Customer-managed keys — Azure Storage and SQL TDE; Objective; Assumptions; Constraints; Architecture overview; Terraform; Security; Reliability

#### `runbooks/COMMON_ERRORS.md`
**Scope:** **Scope:** Top 10 operator-visible failure modes (`56R`-style quick fixes) anchored to shipped configuration—not exhaustive root-cause analysis.
**Title:** Common operator errors — top 10
**Summary:** **Audience:** pilots + on-call responders. Prefer **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** first-pass flow; this doc expands repeatable failures. **Symptom:** Log shows DbUp/connectivity failure; **`ConnectionStrings:ArchLucid`** error. **Cause:** **`ArchLucid:StorageProvider`** is **`Sql`** but the connection string cannot open SQL (`localhost` firewall, credential, typo). **Resolution:** Align **`ConnectionStrings:ArchLucid`** with your SQL reachable host; Docker compose users: ensure MSSQL healthy first. **`dotnet user-secrets`** or Key Vault-backed settings in staging/prod (**[CONFIGURATION_KEY_VAULT.md](../library/CONFIGURATION_KEY_VAULT.md)**). **Prevention:** Put secrets only in v
**Headings:** Common operator errors — top 10; 1. API exits at startup — **SQL connection string missing / unreachable**; 2. **`DevelopmentBypass` refused in staging/prod-shaped hosts**; 3. **401 Unauthorized** everywhere; 4. **DbUp / migration failures** on boot; 5. **Real-mode agent** timeouts / breaker open — **missing Azure OpenAI**; 6. **ContentSafety** enforced but **misconfigured SDK**; 7. **403 / empty scopes** despite good auth — tenant / RLS mismatch

#### `runbooks/COMPARISON_RECORD_ORPHAN_REMEDIATION.md`
**Scope:** **Scope:** Runbook: Comparison record orphans (missing authority run) - full detail, tables, and links in the sections below.
**Title:** Runbook: Comparison record orphans (missing authority run)
**Summary:** **Last reviewed:** 2026-04-16 Remove or inspect **`dbo.ComparisonRecords`** rows whose **`LeftRunId`** or **`RightRunId`** parses as a **GUID** but **no** matching **`dbo.Runs.RunId`** exists. This state is **inconsistent** with the authority run model. The product probe (`DataConsistencyOrphanProbeHostedService`) is **detection-only** for counts and metrics; it never **`DELETE`**s. Optionally set **`DataConsistency:OrphanProbeRemediationDryRunLogMaxRows`** to a value **1–500** so each probe pass that finds orphans also logs an **Information**-level sample of candidate keys using the same **`SELECT`** as admin dry-run (golden manifests and findings snapshots use the same option when their co
**Headings:** Runbook: Comparison record orphans (missing authority run); Objective; Assumptions; Constraints; Architecture overview; Preview (read-only); API-assisted remediation (preferred when API is available); Remediation (destructive)

#### `runbooks/COMPARISON_REPLAY_RATE_LIMITS.md`
**Scope:** **Scope:** Runbook: Comparison replay — light vs heavy and rate limits - full detail, tables, and links in the sections below.
**Title:** Runbook: Comparison replay — light vs heavy and rate limits
**Summary:** **Last reviewed:** 2026-04-16 **`AddArchLucidRateLimiting`** registers a **`replay`** partition policy: - **Light** (default formats): higher permit count per window. - **Heavy** (e.g. **`docx`**, **`pdf`** query): lower permit count per longer window. **Batch replay** (`POST .../comparisons/replay/batch`) also uses the **`replay`** rate limiter; each request can trigger multiple replays internally, so operators should keep **`ComparisonReplay:Batch:MaxComparisonRecordIds`** aligned with **`RateLimiting:Replay:*`** windows. Partition key combines the authenticated user (if any) or remote IP with **`light`** vs **`heavy`**. 1. **429 on replay:** Confirm client is not batching heavy exports on
**Headings:** Runbook: Comparison replay — light vs heavy and rate limits; Policy summary; Operator actions; References

#### `runbooks/CONTAINER_APPS_JOBS.md`
**Scope:** **Scope:** Runbook — Azure Container Apps Jobs (ArchLucid.Jobs.Cli) - full detail, tables, and links in the sections below.
**Title:** Runbook — Azure Container Apps Jobs (`ArchLucid.Jobs.Cli`)
**Summary:** **Last reviewed:** 2026-04-19 **ADR:** [ADR 0018](../architecture/adrs/0018-background-workloads-container-apps-jobs.md) Run **one-shot** background iterations (`--job <slug>`) on a schedule or (future) KEDA event triggers, without starting the long-lived `IHostedService` graph from `ArchLucid.Worker`. | Node | Role | |------|------| | `ArchLucid.Jobs.Cli` | Process entry; builds `WebApplication`, validates config, runs DbUp bootstrap, dispatches `ArchLucidJobRunner`. | | `ArchLucid.Worker` | Long-lived host; must **not** run the same logical loop when the job is offloaded (`Jobs:OffloadedToContainerJobs`). | | `azurerm_container_app_job` | Azure **Schedule** (cron) or **Event** (KEDA rules
**Headings:** Runbook — Azure Container Apps Jobs (`ArchLucid.Jobs.Cli`); Objective; Nodes and edges; Configuration; Exit codes (`ArchLucid.Jobs.Cli`); Terraform (`infra/terraform-container-apps/jobs.tf`); CI manifest check; Manual operations

#### `runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md`
**Scope:** **Scope:** Coordinator vs Authority pipeline parity evidence (ADR 0021).
**Title:** Coordinator → Authority parity runbook
**Summary:** **Audience:** Platform / SRE + architecture reviewers. **Objective:** Capture **measurable parity** between the Coordinator and Authority pipelines while ADR 0021 phases execute (latency, audit volume, replay outcomes). | Environment | Minimum frequency | Owner | |-------------|-------------------|-------| | Staging | Weekly during strangler | Platform | | Production | Weekly while both pipelines accept writes | Platform | | Metric | Source | Notes | |--------|--------|-------| | p95 / p99 API latency (`POST /v1/architecture/request`, `POST …/execute`, `POST …/commit`) | Application Insights or Grafana | Split by pipeline discriminator in logs where available. | | Audit row ingest rate | `db
**Headings:** Coordinator → Authority parity runbook; Cadence; Metrics to record; Template (fill per window); Automated probe (`scripts/ci/coordinator_parity_probe.py`); Phase 3 gate status (2026-04-21, updated 2026-04-22); Related

#### `runbooks/COPILOT_CODE_REVIEW_SETUP.md`
**Scope:** **Scope:** Runbook — Enable GitHub Copilot code review (one-time setup) - full detail, tables, and links in the sections below.
**Title:** Runbook — Enable GitHub Copilot code review (one-time setup)
**Summary:** **Priority:** P3 — Reference (one-time setup, not an incident response) **Owner:** Repo maintainer **Last reviewed:** 2026-04-17 **Applies to:** `joefrancisGA/ArchLucid` Turn on **GitHub Copilot code review** so that Copilot is automatically requested as a reviewer on every pull request, using `.github/copilot-instructions.md` as project context. This runbook is the click-by-click follow-up to the in-repo files that were committed alongside it. - You have an active **Copilot Pro** subscription (verify at <https://github.com/settings/copilot>). - You are the repo admin on `joefrancisGA/ArchLucid`. - Branch protection / rulesets for `main` already exist (see [`.github/BRANCH_PROTECTION.md`](..
**Headings:** Runbook — Enable GitHub Copilot code review (one-time setup); Objective; Assumptions; Constraints; Architecture overview; Component breakdown — what's already in the repo; Step-by-step setup; Step 1 — Verify your Copilot subscription includes code review

#### `runbooks/CORE_PILOT_SE_WORKFLOW.md`
**Scope:** **Scope:** Sales-engineer / pilot-lead checklist for Core Pilot completion using existing operator UI and telemetry; not a substitute for customer success contracts.
**Title:** Core Pilot — sales-engineer workflow
**Summary:** **Audience:** Sales engineers and pilot leads guiding a prospect tenant through the **first architecture review** outcome. **Companion:** [`docs/CORE_PILOT.md`](../CORE_PILOT.md), [`docs/go-to-market/DECISION_FAST_LANE.md`](../go-to-market/DECISION_FAST_LANE.md), [`docs/library/CHAMPION_48H_KIT.md`](../library/CHAMPION_48H_KIT.md). - Confirm **auth mode** (Entra / API key / staging bypass) and **simulator vs real** LLM expectation with the champion. - Send Trust Center link: [`docs/go-to-market/trust-center.md`](../go-to-market/trust-center.md) if security is on the thread early. - Optional: ask for **`baselineReviewCycleHours`** at trial signup — feeds value report (see [`docs/library/PILOT
**Headings:** Core Pilot — sales-engineer workflow; 1. Before the session; 2. During the session (operator Home); 3. Telemetry (what posts); 4. Definition of “done” for SE handoff; 5. Related runbooks

#### `runbooks/DATABASE_FAILOVER.md`
**Scope:** **Scope:** Runbook: Azure SQL — failover, connectivity, RPO/RTO - full detail, tables, and links in the sections below.
**Title:** Runbook: Azure SQL — failover, connectivity, RPO/RTO
**Summary:** **Last reviewed:** 2026-04-16 **Policy targets (by tier):** see **`docs/RTO_RPO_TARGETS.md`** (e.g. production relational RPO under five minutes with geo-replication; development best-effort). Use this runbook when the primary Azure SQL database is unavailable, when Microsoft initiates a platform failover, or when you are exercising a controlled **geo-failover** drill. - Application health checks report SQL connectivity failures across instances. - Azure Portal / Azure Monitor shows primary region outage or database **Failover** in progress. - You are validating **business continuity** requirements (RPO/RTO) for ArchLucid.
**Headings:** Runbook: Azure SQL — failover, connectivity, RPO/RTO; When to use; Components (mental model); Immediate triage; Failover types; Connection strings after failover; Application behavior; Post-failover validation

#### `runbooks/DATA_ARCHIVAL_HEALTH.md`
**Scope:** **Scope:** Runbook: data_archival readiness check - full detail, tables, and links in the sections below.
**Title:** Runbook: `data_archival` readiness check
**Summary:** **Last reviewed:** 2026-04-16 The API registers an ASP.NET Core health check named **`data_archival`** (readiness tag **`ready`**). It reflects the last outcome of the **data archival hosted service** (`DataArchivalHostedService`) when archival is enabled in configuration. **Nodes (conceptual):** - **Configuration** (`DataArchival:Enabled`) → **Health evaluator** (`DataArchivalHostHealthCheck`) ← **Iteration state** (`DataArchivalHostHealthState`) ← **Hosted loop** (`DataArchivalHostedService` → `IDataArchivalCoordinator`). | Configuration | Hosted state | Health result | |---------------|--------------|---------------| | `DataArchival:Enabled` = **false** | (any) | **Healthy** — archival is
**Headings:** Runbook: `data_archival` readiness check; What it is; Status meanings; Triage; Recovery; Related documentation

#### `runbooks/DATA_CONSISTENCY_ENFORCEMENT.md`
**Scope:** **Scope:** Operator playbook for orphan-probe modes and Prometheus counters (short).
**Title:** Data consistency enforcement (operator snippet)
**Summary:** Use this card when Grafana fires **ArchLucidDataConsistencyOrphansDetected**, **ArchLucidDataConsistencyAlertsRaised**, or **ArchLucidDataConsistencyOrphansQuarantinedActivity** (`infra/prometheus/archlucid-alerts.yml`). **Dashboard:** import or sync **`infra/grafana/dashboard-archlucid-authority.json`** — data-consistency panel plots **`archlucid_data_consistency_orphans_detected_total`**, **`archlucid_data_consistency_alerts_total`**, and **`archlucid_data_consistency_orphans_quarantined_total`** (rates). **Release / handoff:** run **`python scripts/data_consistency_mode_readiness_report.py`** (optional **`ARCHLUCID_DATA_CONSISTENCY_READINESS_SQL`** for read-only orphan **COUNT**s) — see *
**Headings:** Data consistency enforcement (operator snippet); Modes (`DataConsistency:Enforcement:Mode`); Triage checklist

#### `runbooks/DEMO_HOSTED_DEPLOYMENT.md`
**Scope:** **Scope:** Platform operators shipping a public hosted demo (`demo.archlucid.net` or similar); covers wiring, Contoso seeding, hosting, cost ballpark, and reset. Not a generic Azure tutorial.
**Title:** Hosted demo environment (public sandbox)
**Summary:** **Audience:** Platform operators shipping `demo.archlucid.net` (or another public demo host) for buyers and evaluators. - **API + operator UI** in **DevelopmentBypass** (no sign-in) for the simplest evaluator path, or you may switch to **ApiKey** / **JwtBearer** for a stricter public posture. - **Agent execution: Simulator** — deterministic, no Azure OpenAI cost. - **Pre-seeded Contoso data** — on API startup, when `Demo:Enabled` and `Demo:SeedOnStartup` are `true`, `IDemoSeedService` runs after DbUp (`ArchLucid.Application/Bootstrap/DemoSeedService.cs`). It creates **two committed** Contoso Retail runs (baseline + hardened) plus governance/export fixtures, not three. - **On-demand reset** —
**Headings:** Hosted demo environment (public sandbox); What the demo is; Local smoke (docker); Marketing CTA; Azure Container Apps (high level); URLs you can share after seeding; Related

#### `runbooks/EVIDENCE_PACK_OPS.md`
**Scope:** **Scope:** Runbook — Verifying a Day-1 Evidence Pack - full detail, tables, and links in the sections below.
**Title:** Runbook — Verifying a Day-1 Evidence Pack
**Summary:** > > **Status:** Draft (2026-04-20). Endpoint and daily Merkle job not yet implemented; this runbook is the contract the implementation must meet. - The downloaded `evidence-pack.zip`. - Read access to the immutable blob container `audit-merkle` (or a delegated SAS URL). - A machine with `unzip`, `sha256sum` (or `Get-FileHash` on PowerShell), and `jq`.
**Headings:** Runbook — Verifying a Day-1 Evidence Pack; You will need; Step 1 — verify the manifest; MANIFEST.txt has one row per file: <relpath>  <bytes>  <sha256>; Step 2 — verify a daily Merkle root against the immutable blob; Fetch the same day's root from the immutable blob:; Step 3 — independently recompute the root from `audit-export.jsonl`; audit-export.jsonl has one canonical JSON object per line.

#### `runbooks/FRANCIS_ARCHITECTURE_LLC_V1_CUTOVER.md`
**Scope:** **Scope:** Runbook — phased migration of ArchLucid commercial, contractual, and outward vendor identity from the founder’s personal / sole-proprietorship posture to **Francis Architecture, LLC** during the V1 window (not legal advice).
**Title:** Runbook — Francis Architecture, LLC V1 commercial cutover
**Summary:** **Status:** Plan (2026-05-03). **Supersedes nothing automatically:** until this runbook is executed and recorded in [`docs/CHANGELOG.md`](../CHANGELOG.md), the repo’s resolved owner decisions for **Partner Center legal entity** (Joseph Francis, Sole Proprietorship) and **Stripe** operational ownership remain authoritative — see [`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) items **8** and **9**. **Disclaimer:** This document is operational guidance for the ArchLucid team. **Entity structure, contract assignment or novation, tax, and liability** are jurisdiction-specific. Engage **qualified legal counsel and a CPA** before binding the LLC or changing customer agreements. Centralize *
**Headings:** Runbook — Francis Architecture, LLC V1 commercial cutover; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown (workstreams); 5.1 Inventory (first milestone); 5.2 Intellectual property and product

#### `runbooks/GAME_DAY_CHAOS_QUARTERLY.md`
**Scope:** **Scope:** Quarterly game day for Simmy-backed chaos tests — pre-flight, blast radius, abort criteria, metrics, RACI stub. Complements `.github/workflows/simmy-chaos-scheduled.yml`.
**Title:** Quarterly game day — Simmy chaos coverage
**Summary:** Production fault injection is **out of scope for v1 and beyond** per owner decision 2026-04-22 (see [`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) item 34 — **“production never”**). Reopening this stance requires an **explicit ADR**, not an owner approval gate inside this runbook. Run the scheduled Simmy chaos suite under controlled conditions, capture outcomes, and file follow-ups before reliability debt accumulates. - [ ] Confirm target **environment** is **staging** (default). Production fault injection is **out of scope for v1 and beyond** per owner decision 2026-04-22 (see [`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) item 34 — **“production never”**). Reopening this st
**Headings:** Quarterly game day — Simmy chaos coverage; Production stance (2026-04-22); Objective; Pre-flight checklist; Blast radius limits; Abort criteria; Post-run metrics to capture; RACI (stub)

#### `runbooks/GENERIC_OIDC_SETUP.md`
**Scope:** **Scope:** Operators configuring non-Microsoft OIDC issuers for `ArchLucidAuth:Authority` — authoritative checklist forJwtBearer + discovery/JWKS; not Entra tenant onboarding, SAML SP flows, nor a threat model.
**Title:** Generic OIDC issuer setup (`ArchLucidAuth:Authority`)
**Summary:** Use this path when **`ArchLucidAuth:Mode=JwtBearer`** and the issuer is **not** Microsoft Entra — for example **Okta**, **Auth0**, **Keycloak**, or another OIDC provider that publishes **`/.well-known/openid-configuration`** and JWKS. IdP-specific screenshots and expressions live in **[SSO — Okta](../integrations/SSO_OKTA_CONFIGURATION.md)** and **[SSO — Auth0](../integrations/SSO_AUTH0_CONFIGURATION.md)**; this runbook is the **cross-vendor** sequence and troubleshooting layer. | Input | Constraint | | --- | --- | | **`ArchLucidAuth:Authority`** | Base URL of the issuer whose OIDC metadata document is reachable from the API host (HTTPS). Typical shapes: `https://tenant.auth0.com/`, `https:/
**Headings:** Generic OIDC issuer setup (`ArchLucidAuth:Authority`); 1. Preconditions; 2. Step-by-step — ArchLucid configuration; 3. Claim mapping to ArchLucid roles (`ArchLucidRoles`); Examples; 4. Troubleshooting — JWKS and validation errors; 5. Smoke test; Related docs

#### `runbooks/GEO_FAILOVER_DRILL.md`
**Scope:** **Scope:** Geo-failover drill (Azure SQL) — executable runbook - full detail, tables, and links in the sections below.
**Title:** Geo-failover drill (Azure SQL) — executable runbook
**Summary:** **Last reviewed:** 2026-04-16 Validate **RTO** and **RPO** intent from **`docs/RTO_RPO_TARGETS.md`** using a **controlled** failover (production-like or dedicated drill subscription), not developer laptops. - **Auto-failover group** or **geo-replication** is configured (**`infra/terraform-sql-failover`**). - Application connection strings use the **failover group read/write listener** where required (**`docs/runbooks/DATABASE_FAILOVER.md`**). - API and worker revisions exist and pass **`/health/ready`** on the primary region before the drill. - Do **not** target production without change control and a rollback owner. - Expect **brief** write unavailability during cutover; clients must **retr
**Headings:** Geo-failover drill (Azure SQL) — executable runbook; 1. Objective; 2. Assumptions; 3. Constraints; 4. Prerequisites checklist; 5. Execution steps; 6. Measurement template; 7. Failure scenarios

#### `runbooks/GOLDEN_COHORT_BUDGET.md`
**Scope:** **Scope:** Monthly **USD** spend cap and **kill switch** for the optional **real-LLM** golden-cohort nightly path (`ARCHLUCID_GOLDEN_COHORT_REAL_LLM`). Simulator drift (default CI) is unchanged and does not hit Azure OpenAI.
**Title:** Golden cohort Azure OpenAI budget and kill switch
**Summary:** Owner Q&A ([`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) items **15** / **25**): dedicated golden-cohort Azure OpenAI usage is capped at **$50 / calendar month**. > **Updated 2026-04-24 (Improvement 11 — Prompt 11):** the single 90% kill switch was split into a **two-band** Q15-conditional kill-switch: **warn at 80%** ($40 MTD — workflow continues but posts an issue) and **kill at 95%** ($47.50 MTD — workflow skips the cohort run for the rest of the month, does not count as failure). Threshold ratios **0.80 / 0.95** are pinned by [`scripts/ci/assert_golden_cohort_kill_switch_present.py`](../../scripts/ci/assert_golden_cohort_kill_switch_present.py); a PR that weakens them is blocked at m
**Headings:** Golden cohort Azure OpenAI budget and kill switch; Decision (2026-04-22, refined 2026-04-24); Configuration (repo); Probe script; GitHub Actions; When the kill switch fires; Where this does **not** apply

#### `runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`
**Scope:** ﻿> **Scope:** End-to-end operator instructions for the optional **real-LLM** golden-cohort nightly path: how to flip the gate from disabled to required, how to respond when the **kill-switch** trips, and how to read the cost-and-latency Workbook. Pair with [`GOLDEN_COHORT_BUDGET.md`](./GOLDEN_COHORT_BUDGET.md) for the budget mechanics.
**Title:** Golden cohort real-LLM gate â€” operator runbook
**Summary:** ﻿> **Scope:** End-to-end operator instructions for the optional **real-LLM** golden-cohort nightly path: how to flip the gate from disabled to required, how to respond when the **kill-switch** trips, and how to read the cost-and-latency Workbook. Pair with [`GOLDEN_COHORT_BUDGET.md`](./GOLDEN_COHORT_BUDGET.md) for the budget mechanics. [`golden-cohort-nightly.yml`](../../.github/workflows/golden-cohort-nightly.yml) includes: | Job | Purpose | |-----|---------| | **`cohort-real-llm-preflight`** | When **`vars.ARCHLUCID_GOLDEN_COHORT_REAL_LLM`** is **`true`**, runs the budget probe / kill-switch (**[`scripts/golden_cohort_budget_probe.py`](../../scripts/golden_cohort_budget_probe.py)**), opens
**Headings:** Golden cohort real-LLM gate â€” operator runbook; 1. What this gate does; 2. Flip preflight from optional to required (branch protection); 3. Probe exit-code semantics (the kill-switch); 4. Responding to a kill-switch trip; When **WARN** (exit 1) fires; When **KILL â€” SKIPPED** (exit 2) fires; When **probe failed** (exit 3) fires

#### `runbooks/HOSTED_AVAILABILITY_ROLLUP.md`
**Scope:** **Scope:** Rolling-window procedure for interpreting scheduled **hosted-saas-probe** workflow results — **no buyer-facing availability % without real history**.
**Title:** Hosted availability — 30-day rollup (operator runbook)
**Summary:** **Audience:** Platform / SRE assembling procurement- or Trust-Center-adjacent **reliability narrative** from scheduled HTTP probes. Summarize **whether** the public health endpoints (`/health/live`, `/health/ready`) for the configured staging base URL succeeded on each scheduled run, over a chosen window (e.g. **30 days**), **without** implying a production SLA unless that environment is explicitly in scope. - GitHub Actions workflow **[`.github/workflows/hosted-saas-probe.yml`](../../.github/workflows/hosted-saas-probe.yml)** (cron + `workflow_dispatch`). - Repository variable **`ARCHLUCID_STAGING_BASE_URL`**. When unset, the workflow exits cleanly and records a **skipped** probe artifact r
**Headings:** Hosted availability — 30-day rollup (operator runbook); Objective; Inputs; Procedure; Constraints; Optional automation (markdown rollup); Markdown to stdout (default), staging rollup from a folder of downloaded artifacts; Same, write to a file for attaching to an internal note or release bundle

#### `runbooks/INCIDENT_INVESTIGATION.md`
**Scope:** **Scope:** Runbook for investigating production incidents on the ArchLucid hosted SaaS (health, dependencies, telemetry, SQL, worker); not a substitute for customer-specific IR plans or Azure-wide DR runbooks.
**Title:** Incident investigation — hosted SaaS
**Summary:** **Audience:** Platform / on-call responding to **staging** or **production** degradation. Assumes Azure-hosted API (Container Apps), SQL, observability per [`infra/terraform-monitoring/README.md`](../../infra/terraform-monitoring/README.md). | Severity | Definition | |----------|------------| | **P1** | **`GET /health/live`** failing broadly, **all tenants** affected, or **credible data loss** / inability to recover writes. | | **P2** | **Single tenant** or subset impaired; commits / governance **blocked** for production path; **sustained** 5xx for primary workflows. | | **P3** | **Non-critical** path (advisory, digests, background enrichment) degraded; elevated errors with **workaround**. |
**Headings:** Incident investigation — hosted SaaS; Severity (initial classification); First five minutes; Investigation paths; Escalation; Post-incident; Related docs

#### `runbooks/INFRASTRUCTURE_OPS.md`
**Scope:** **Scope:** Infrastructure operations (Terraform roots) - full detail, tables, and links in the sections below.
**Title:** Infrastructure operations (Terraform roots)
**Summary:** **Last reviewed:** 2026-04-16 Give operators a single place to orient on **multiple Terraform roots**, what each is for, and how to validate or triage them without applying blindly. - You have Azure credentials and subscription context appropriate for the stack (`az login`, correct subscription). - Remote state backends (if enabled) are already configured for your environment; CI runs `terraform init -backend=false` and `validate` only. - Production changes follow your change window and approval process; this document does not replace enterprise change management. - SMB (port 445) must not be exposed publicly; storage integration should follow private endpoints and network boundaries (see wo
**Headings:** Infrastructure operations (Terraform roots); Objective; Assumptions; Constraints; Architecture overview (nodes); Component breakdown; Operational flow; Security model

#### `runbooks/ITSM_LIVE_SMOKE_SCAFFOLD.md`
**Scope:** **Scope:** TB-016 scaffold — how to add **live vendor** smoke coverage for first-party ITSM/chat connectors without checking long-lived secrets into git.
**Title:** ITSM connector live smoke (scaffold)
**Summary:** Validate **Jira Cloud**, **ServiceNow developer**, **Slack**, and **Confluence Cloud** paths against real sandbox endpoints on a **scheduled** or **manually dispatched** workflow, with credentials stored in **GitHub Actions secrets** (or equivalent vault). 1. **Secrets (examples):** `ITSM_JIRA_BASE_URL`, `ITSM_JIRA_USER`, `ITSM_JIRA_TOKEN`, `ITSM_SN_INSTANCE`, `ITSM_SN_USER`, `ITSM_SN_PASSWORD`, `ITSM_SLACK_BOT_TOKEN`, `ITSM_CONFLUENCE_BASE_URL`, `ITSM_CONFLUENCE_USER`, `ITSM_CONFLUENCE_TOKEN`. 2. **Workflow:** `.github/workflows/itsm-live-smoke.yml` — `workflow_dispatch` + optional `schedule: cron weekly` — **continue-on-error: true** until the team declares merge-blocking. 3. **Test projec
**Headings:** ITSM connector live smoke (scaffold); Goal; Suggested layout; Safety; Related

#### `runbooks/LLM_PROMPT_REDACTION.md`
**Scope:** **Scope:** LLM prompt deny-list redaction (P2) - full detail, tables, and links in the sections below.
**Title:** LLM prompt deny-list redaction (P2)
**Summary:** **Last reviewed:** 2026-05-08 - You need to **disable** outbound prompt redaction for a short diagnostic window (expect **`archlucid_llm_prompt_redaction_skipped_total`** to rise). - You are validating that **production-like** hosts warn on **`LlmPromptRedaction:Enabled=false`** (`LlmPromptRedactionProductionWarningPostConfigure`). - Forensics found **PII-shaped** tokens still reaching Azure OpenAI — tune deny-list rules in code (`PromptRedactor`) and ship a follow-up migration only if storage shape changes. | Key | Meaning | |-----|--------| | **`LlmPromptRedaction:Enabled`** | When **true**, system and user prompt strings are passed through **`IPromptRedactor`** before **`LlmCompletionAcco
**Headings:** LLM prompt deny-list redaction (P2); When to use this runbook; Configuration; Observability; Security notes; Related

#### `runbooks/LOAD_TEST_RATE_LIMITS.md`
**Scope:** **Scope:** Load test — expensive rate-limit boundary - full detail, tables, and links in the sections below.
**Title:** Load test — expensive rate-limit boundary
**Summary:** **Last reviewed:** 2026-04-16 **Objective:** Validate that burst traffic against **expensive** endpoints receives **429** under configured `RateLimiting:Expensive:*` windows. **Prerequisites:** A running API with known base URL, test identity with **execute** authority, and optional k6 (`brew install k6` / CI image). - **`scripts/load/k6-expensive-rate-limit.js`** — hammers a placeholder expensive route; **edit the URL** to match your environment (e.g. a safe replay or execute stub). - **`scripts/load/k6-scenarios.js`** — multi-scenario read load (compare, run detail, advisory recommendations list). See **`scripts/load/README.md`** for env vars and examples.
**Headings:** Load test — expensive rate-limit boundary; Scripts; Run (example); Interpretation

#### `runbooks/LOGIC_APPS_INCIDENT_CHATOPS.md`
**Scope:** **Scope:** Runbook — Incident ChatOps (Logic Apps + Service Bus) - full detail, tables, and links in the sections below.
**Title:** Runbook — Incident ChatOps (Logic Apps + Service Bus)
**Summary:** **Priority:** P3 — Reference **Last reviewed:** 2026-04-19 Give operators **Teams / PagerDuty** visibility into **`com.archlucid.alert.fired`** and **`com.archlucid.alert.resolved`** without moving alert evaluation or persistence out of ArchLucid. Logic Apps **subscribe** to the integration topic, render adaptive cards, and **call back** into existing **`POST /v1/alerts/...`** routes so lifecycle and audit semantics stay in **`AlertService`**. - `infra/terraform-servicebus/` is applied with **`enable_logic_app_incident_chatops_subscription`** when this workflow is active (subscription SQL: fired **OR** resolved — see module `main.tf`). - The API publishes alert integration events with user p
**Headings:** Runbook — Incident ChatOps (Logic Apps + Service Bus); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture Overview; 5. Component Breakdown; 6. Data Flow; 7. Security Model

#### `runbooks/LOGIC_APPS_STANDARD.md`
**Scope:** **Scope:** Runbook — Azure Logic Apps (Standard) for ArchLucid - full detail, tables, and links in the sections below.
**Title:** Runbook — Azure Logic Apps (Standard) for ArchLucid
**Summary:** **Priority:** P3 — Reference **Last reviewed:** 2026-04-19 (trial / ChatOps / promotion optional dedicated Logic App hosts in `terraform-logicapps`) Operate optional **Logic App (Standard)** hosts that consume ArchLucid **Service Bus integration events** (see `docs/INTEGRATION_EVENTS_AND_WEBHOOKS.md`) without moving trust boundaries out of .NET (ADR **0016** for Marketplace JWTs, ADR **0019** for orchestration posture). - You enabled any combination of **`enable_logic_apps`**, **`enable_governance_approval_logic_app`**, **`enable_marketplace_fulfillment_logic_app`**, **`enable_trial_lifecycle_logic_app`**, **`enable_incident_chatops_logic_app`**, and **`enable_promotion_customer_notify_logic
**Headings:** Runbook — Azure Logic Apps (Standard) for ArchLucid; Objective; When this applies; Assumptions; Procedure; Constraints; Related

#### `runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md`
**Scope:** **Scope:** Operations for sales inbox mail when a visitor submits the marketing **pricing quote** form (`POST /v1/marketing/pricing/quote-request` → `dbo.MarketingPricingQuoteRequests`).
**Title:** Marketing pricing quote → sales notification
**Summary:** - After a **successful persist** (SQL path), the API sends a **transactional email** to the configured inbox with request id, timestamp (UTC), and **non-secret** fields from the submission. Message body HTML-encodes free text. **Secrets must not** appear in email. - **Provider `Noop`:** no SMTP or ACS send; the notifier logs at **Information** that it **would** notify sales (same pattern as other outbound mail when mail is not wired). | Key | Purpose | |-----|---------| | `Email:Provider` | `Noop` (default, dev-safe), `Smtp`, or `AzureCommunicationServices`. | | `Email:PricingQuoteSalesInbox` | Recipient for quote-request notifications (default **`sales@archlucid.net`**). | | `Email:FromAddr
**Headings:** Marketing pricing quote → sales notification; Behaviour; Configuration (`Email` section); Verification; Related

#### `runbooks/MARKETING_STRIPE_GA.md`
**Scope:** **Scope:** Runbook — Public marketing site + Stripe billing GA - full detail, tables, and links in the sections below.
**Title:** Runbook — Public marketing site + Stripe billing GA
**Summary:** This runbook tracks **Marketability Improvement 2** (public marketing go-live and Stripe self-serve paid conversion). It assumes Azure-first deployment and private storage boundaries (no SMB 445 exposure). Ship **`archlucid-ui`** marketing routes (`(marketing)/welcome`, `(marketing)/signup`, …) behind **Azure Front Door** with a custom domain, and operate **Stripe Checkout** + webhooks in **live** mode with idempotent SQL persistence (`docs/BILLING.md`, migration **078**). - Terraform modules under `infra/terraform-edge/` (Front Door + WAF) and application hosting (Container Apps or Static Web Apps) are already provisioned for non-prod. - Stripe **live** keys and webhook signing secrets live
**Headings:** Runbook — Public marketing site + Stripe billing GA; Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `runbooks/MARKETPLACE_CHANGEPLAN_QUANTITY_ROLLBACK.md`
**Scope:** **Scope:** Runbook — Roll back Marketplace ChangePlan / ChangeQuantity to AcknowledgedNoOp - full detail, tables, and links in the sections below.
**Title:** Runbook — Roll back Marketplace `ChangePlan` / `ChangeQuantity` to `AcknowledgedNoOp`
**Summary:** **Audience:** SRE / on-call billing engineer. **When to use:** A `ChangePlan` or `ChangeQuantity` webhook from Azure Marketplace has misbehaved (mis-mapped tier, wrong seat count, unexpected mutation), and you need to **stop further mutations** while you investigate. The system was migrated to **`Billing:AzureMarketplace:GaEnabled=true`** as the shipped default on **2026-04-20** (Quality Assessment Improvement 4 Marketplace flip — see [`docs/CHANGELOG.md`](../CHANGELOG.md)). The `false` branch is **deliberately preserved** as the supported rollback path and is not dead code. **Related:** [`docs/BILLING.md`](../library/BILLING.md) (operational considerations table), [`docs/AZURE_MARKETPLACE_S
**Headings:** Runbook — Roll back Marketplace `ChangePlan` / `ChangeQuantity` to `AcknowledgedNoOp`; First 5 minutes (copy-paste); Architecture overview; Component breakdown; Data flow during rollback; Re-process a webhook from `dbo.BillingWebhookEvents`; Reconcile `Tier` / `SeatsPurchased` after a `ChangePlan` mis-map; Confirm the rollback held

#### `runbooks/MARKETPLACE_PUBLISHER_IDENTITY.md`
**Scope:** **Scope:** Runbook — Microsoft Partner Center / Azure Marketplace publisher identity placeholders for commerce go-live (owner-provided IDs).
**Title:** Runbook — Marketplace publisher identity
**Summary:** **Status:** Scaffold (2026-04-22). **No live Partner Center keys** in this repository. Decisions are recorded in [`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-04-22 (assessment owner Q&A — 16 decisions)* (items **8** / **9d**). **`ArchLucid`** — the customer-facing **publisher display name** on the commercial marketplace listing (owner decision 2026-04-22). <!-- TODO(owner) --> **MPN ID:** `<<MPN_ID>>` — replace after the owner records the real Microsoft Partner Network ID from Partner Center. <!-- TODO(owner) --> **Offer / product ID:** `<<OFFER_ID>>` — maps to application configuration key **`Billing:AzureMarketplace:MarketplaceOfferId`** (see [`ArchLucid.Api/appset
**Headings:** Runbook — Marketplace publisher identity; Publisher display name; Microsoft Partner Network (MPN) ID; Marketplace Offer ID; CI alignment; Footnote (legal entity vs display name); Related

#### `runbooks/MIGRATION_ROLLBACK.md`
**Scope:** **Scope:** SQL migration rollback (DbUp / ArchLucid.Persistence) - full detail, tables, and links in the sections below.
**Title:** SQL migration rollback (DbUp / ArchLucid.Persistence)
**Summary:** **Last reviewed:** 2026-04-16 Describe how operators recover when a **forward-only** DbUp migration is wrong, partially applied, or must be undone in an emergency. This complements **`docs/SQL_DDL_DISCIPLINE.md`** (item **249**). - Production schema evolves via **embedded scripts** under **`ArchLucid.Persistence/Migrations/`**, applied in lexicographic order by **`DatabaseMigrator`**. - **`ArchLucid.sql`** is the consolidated reference for greenfield bootstrap; brownfield servers may have run the same logical change through a numbered migration first. - **DbUp does not ship “down” scripts**; rollback is a **manual** DBA operation with a **restore-first** bias. - Prefer **point-in-time restor
**Headings:** SQL migration rollback (DbUp / ArchLucid.Persistence); Objective; Assumptions; Constraints; Architecture overview; Data flow (rollback decision); Security model; Operational considerations

#### `runbooks/PILOT_RESCUE_PLAYBOOK.md`
**Scope:** **Scope:** Operators and pilot evaluators stuck during the Core Pilot; symptom-first triage with links to canonical runbooks—not incident response, security coordination, or a full RCA guide.
**Title:** Pilot rescue playbook (V1)
**Summary:** Use when you need **symptom → likely cause → first command → deeper doc**. Full flow: **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** and **[CORE_PILOT.md](../CORE_PILOT.md)**. **Correlation:** Include **`X-Correlation-ID`** (and `correlationId` inside ProblemDetails JSON) in notes whenever you open a thread, grep logs, or attach diagnostics. **Support bundle:** From a machine with CLI access to the tenant, run **`archlucid support-bundle --zip`** (or your deployment’s equivalent). Open **`README.txt`** then **`next-steps.json`**; use **`references.json`** for doc paths from repo root. Inspect contents before external send—see **support bundle** row below and [TROUBLESHOOTING.md](../TROUBLES
**Headings:** Pilot rescue playbook (V1)

#### `runbooks/PRODUCTION_DEPLOYMENT.md`
**Scope:** **Scope:** Hosted SaaS production deployment (Terraform + Container Apps + edge) for internal operators — numbered checklist with verification, minimum Azure RBAC, owner-only vs automatable steps; does not replace root `README.md` files under `infra/terraform-*/` or org change control.
**Title:** Production deployment runbook (hosted SaaS stack)
**Summary:** **Audience:** Platform / release operators deploying ArchLucid into a **clean Azure subscription** (greenfield) or promoting a validated release to production. **Canonical references (do not duplicate their logic here):** - Apply order and pilot vs multi-root: [`docs/library/REFERENCE_SAAS_STACK_ORDER.md`](../library/REFERENCE_SAAS_STACK_ORDER.md), [`docs/library/FIRST_AZURE_DEPLOYMENT.md`](../library/FIRST_AZURE_DEPLOYMENT.md), [`infra/README.md`](../../infra/README.md). - Orchestration script: [`infra/apply-saas.ps1`](../../infra/apply-saas.ps1) (`-MultiRoot` = per-root state in dependency order; default without `-MultiRoot` is **`infra/terraform-pilot`** only — profile validation, **no**
**Headings:** Production deployment runbook (hosted SaaS stack); 1. Pre-flight checks; 2. Terraform plan review (WhatIf equivalent); 3. Terraform apply sequence; 4. Post-Terraform validation (health, version, billing gate); 5. Database migration verification (DbUp); 6. Smoke test (production base URL); 7. DNS cutover and Front Door verification

#### `runbooks/PROVENANCE_INDEXING.md`
**Scope:** **Scope:** Runbook: Provenance indexing — failure modes and retries (v1) - full detail, tables, and links in the sections below.
**Title:** Runbook: Provenance indexing — failure modes and retries (v1)
**Summary:** **Last reviewed:** 2026-04-16 After a successful authority commit, **retrieval indexing** may run via **`IRetrievalRunCompletionIndexer`** / **`RetrievalRunCompletionIndexer`**, building documents from manifest, artifacts, and **`DecisionProvenanceGraph`**. - **Indexing throws:** The committed run remains authoritative; search/RAG may lag until indexing is retried manually or a future outbox/retry job exists (see **`NEXT_REFACTORINGS.md`** outbox items). - **OpenAI / embedding outages:** Same as above — symptom is empty or stale retrieval results for the run. - Tracing: **`ArchLucid.Retrieval.Index`** **`ActivitySource`** (tag **`archlucid.run_id`**) when OTLP tracing includes **`AddSource`*
**Headings:** Runbook: Provenance indexing — failure modes and retries (v1); Flow; Failure modes; Observability; Mitigation (v1); Hardening backlog

#### `runbooks/QUALITY_GATE_REJECTION.md`
**Scope:** **Scope:** HTTP 409 when agent output fails the post-execute quality gate (BlockRunOnReject) — problem details, configuration, and operator actions.
**Title:** Quality gate rejection (HTTP 409)
**Summary:** **Last reviewed:** 2026-05-09 When a workspace enforces **agent output quality** after a successful **POST** `…/run/{runId}/execute`, a **rejected** gate outcome can surface to API clients as **HTTP 409 Conflict** with **RFC 9457 Problem Details** (`application/problem+json`). This runbook explains the **stable machine fields**, how to **diagnose**, and how to **remediate** without guessing. - **`ArchLucid:AgentOutput:QualityGate:Enabled`** is **true** (typical production-like hosts). - **`EnforceOnReject`** and **`BlockRunOnReject`** are both **true** (otherwise rejected traces are logged/metered but execute may still complete without this 409). - Callers can issue **ReadAuthority** request
**Headings:** Quality gate rejection (HTTP 409); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow (diagnosis); 7. Security model

#### `runbooks/README.md`
**Scope:** **Scope:** Runbooks index - full detail, tables, and links in the sections below.
**Title:** Runbooks index
**Summary:** **Last reviewed:** 2026-05-01 Operational guides for ArchLucid operators. Each runbook is self-contained; cross-links point to deeper design docs where useful. **Availability policy:** [RTO / RPO targets by tier](../library/RTO_RPO_TARGETS.md) — development vs staging vs production (SQL geo-replication, RPO/RTO examples). | Tag | Meaning | |-----|---------| | **P1 — Critical** | Production incident, data integrity, **security rotation**, or **DR / failover** paths that must be executable under pressure. | | **P2 — Important** | Recurring triage, degraded features, data hygiene, or observability workflows that restore normal operations. | | **P3 — Reference** | Drills, load-test quirks, devel
**Headings:** Runbooks index; Priority tags (convention)

#### `runbooks/REDIS_HEALTH.md`
**Scope:** **Scope:** Redis health (development and cache-oriented deployments) - full detail, tables, and links in the sections below.
**Title:** Redis health (development and cache-oriented deployments)
**Summary:** **Last reviewed:** 2026-04-16 Describe how Redis appears in ArchLucid’s **local Docker Compose** profile, how to verify it is healthy, and what production operators should verify when Redis (or Azure Cache for Redis) backs session/cache features. - **Local:** `docker compose up -d` starts the `redis` service with a `redis-cli ping` healthcheck (see repo `docker-compose.yml`). - **Production:** If you introduce Azure Cache for Redis, networking is private (VNet integration / private endpoint) per organizational standards—not a public endpoint. - Compose defaults are for **developer laptops**; passwords and ports are not production secrets. - This runbook does not mandate Redis for core API pe
**Headings:** Redis health (development and cache-oriented deployments); Objective; Assumptions; Constraints; Architecture overview; Operational checks; Docker Compose; Application

#### `runbooks/RELIABILITY_DRILL_PACKAGE.md`
**Scope:** **Scope:** Lightweight, non-destructive reliability rehearsal tied to observable health probes.
**Title:** Reliability Drill Package
**Summary:** | Input | Meaning | |---|---| | **`BaseUrl`** | API host (**HTTPS** staging or local); never a shared destructive environment | | **TimeoutSeconds** | Web request ceiling for scripted probes | Artifacts land under **`dist/reliability-drill/`**: | Artefact | Format | |---|---| | `evidence-summary.json` | Structured pass/fail with probe metadata | | `evidence-summary.md` | Sponsor-friendly mirror for ticket attachment | Generation command (PowerShell):
**Headings:** Inputs; Outputs; Query / metric cues (recovery validation); Constraints

#### `runbooks/SECRET_AND_CERT_ROTATION.md`
**Scope:** **Scope:** Runbook: secret and certificate rotation - full detail, tables, and links in the sections below.
**Title:** Runbook: secret and certificate rotation
**Summary:** **Last reviewed:** 2026-04-16 Describe how operators rotate credentials and TLS-related material for ArchLucid deployments without assuming a single cloud SKU. The API and UI are commonly hosted on Azure App Service with secrets in Key Vault or app settings; adjust names to match your environment. - You have a maintenance window or blue/green path for app restarts when connection strings or signing keys change. - SQL connectivity uses private networking (private endpoint / VNet integration); SMB (port 445) is not exposed publicly (see workspace security rules). - Rotating **`ConnectionStrings:ArchLucid`** requires the API to restart (or reload config if you implement hot reload for that sect
**Headings:** Runbook: secret and certificate rotation; Objective; Assumptions; Constraints; Architecture overview (rotation flow); Component breakdown; Data flow (webhook HMAC rotation); Security model

#### `runbooks/SECRET_HISTORY_REWRITE.md`
**Scope:** **Scope:** Runbook — Rewriting git history to evict a leaked secret - full detail, tables, and links in the sections below.
**Title:** Runbook — Rewriting git history to evict a leaked secret
**Summary:** > > **Status:** Draft (2026-04-20). Trigger when the marketability honesty boundary in `docs/MARKETABILITY_ASSESSMENT_2026_04_18.md` is acted on, or when any future leak is identified. 1. **Rotate the credential at the provider.** Always do this first; history rewrites cannot un-leak a credential that has already been observed by anyone with access to the repository at any time. Treat the credential as compromised. 2. **Add the secret to detection lists.** Update `.gitleaks.toml` (or equivalent configuration consumed by `gacts/gitleaks` in CI) so future commits cannot reintroduce the same value or pattern. 3. **Then** — and only then — consider rewriting history. If the credential is rotated
**Headings:** Runbook — Rewriting git history to evict a leaked secret; Decide first — three orthogonal actions, do them in this order; When **not** to rewrite; Pre-flight checklist (block until complete); Procedure (using `git filter-repo`); 1. Fresh, mirror clone (so all refs are present, no working tree).; 2. Build a replacements file. One pattern per line:; literal-secret==>REDACTED

#### `runbooks/SLO_PROMETHEUS_GRAFANA.md`
**Scope:** **Scope:** SLO, Prometheus burn-rate alerts, and Grafana - full detail, tables, and links in the sections below.
**Title:** SLO, Prometheus burn-rate alerts, and Grafana
**Summary:** **Last reviewed:** 2026-04-16 Give operators a **repeatable** way to: - Define **service level indicators (SLIs)** from OpenTelemetry → Prometheus metrics. - **Alert on error-budget burn rate** (not only static thresholds) so SLO erosion is visible before backlog gauges explode. - Optionally **provision** committed Grafana JSON into **Azure Managed Grafana** via Terraform. - HTTP traffic is instrumented with **`http.server.request.duration`** (Prometheus names often `http_server_request_duration_seconds_*`) or legacy **`http_server_duration_milliseconds_*`**. - Prometheus loads **`infra/prometheus/archlucid-slo-rules.yml`** next to **`archlucid-alerts.yml`**. - **99.9% monthly availability**
**Headings:** SLO, Prometheus burn-rate alerts, and Grafana; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `runbooks/STAGING_DEPLOYMENT_VALIDATION.md`
**Scope:** **Scope:** For platform engineers validating ArchLucid in Azure staging after deployment; operational checks for IaC alignment, containers, SQL, health, and a sample run—not Terraform module authoring or production promotion.
**Title:** Staging deployment validation
**Summary:** **Objective:** Confirm the ArchLucid stack in Azure staging is safe to hand to pilot users: Terraform state matches intended resources, containers run current images, SQL is migrated, health checks pass, and one full architecture run can execute and commit with a retrievable golden manifest. **Assumptions:** You have Azure subscription access, Terraform backends and `tfvars` for staging, ACR push rights, and an API key (or Entra principal) that can call staging APIs. **Constraints:** This runbook does not modify Terraform modules—only documents apply order and human checks. Adjust names (`staging`, resource groups) to match your environment files under `infra/environments/`.
**Headings:** Staging deployment validation; Architecture Overview; Suggested Terraform apply order; Post-Terraform checklist; Smoke test (automated); Observability and alerts; Security Model; Reliability, scalability, cost

#### `runbooks/STAGING_TRIAL_VALIDATION_CHECKLIST.md`
**Scope:** **Scope:** Staging trial funnel validation checklist — manual and automated steps to confirm the trial path works on staging before production release.
**Title:** Staging trial funnel validation checklist
**Summary:** **Audience:** Pre-release validation. Run this checklist against `https://staging.archlucid.net` before marking a release candidate as production-ready. **Related docs:** - [TRIAL_FUNNEL_END_TO_END.md](TRIAL_FUNNEL_END_TO_END.md) — full architecture map - [TRIAL_END_TO_END.md](TRIAL_END_TO_END.md) — Playwright live acceptance suite - [TRIAL_FUNNEL.md](TRIAL_FUNNEL.md) — Prometheus observability runbook | Requirement | How to verify | |-------------|--------------| | Staging API is healthy | `Invoke-RestMethod https://staging.archlucid.net/health/ready` returns `Healthy` | | Staging UI loads | Browser navigates to `https://staging.archlucid.net` without errors | | DNS resolves | `nslookup sta
**Headings:** Staging trial funnel validation checklist; Prerequisites; Validation steps; Phase 1: Landing and signup (anonymous); Phase 2: Sample run experience (first-value path); Phase 3: Operator flow (new run); Phase 4: Trial metering and limits; Phase 5: Checkout and conversion (Noop/Stripe TEST)

#### `runbooks/STRIPE_OPERATOR_CHECKLIST.md`
**Scope:** **Scope:** Operator checklist to finish Stripe self-serve (Team tier). Code paths exist (`StripeBillingProvider`, `BillingStripeWebhookController`); this list is configuration + verification.
**Title:** Stripe integration — operator completion checklist
**Summary:** **Canonical monthly amount** for interim Team Checkout: [`PRICING_PHILOSOPHY.md` § 3.2](../go-to-market/PRICING_PHILOSOPHY.md#32-interim-stripe-team-self-serve-bundled-sku). **Stripe Dashboard — Test vs Live.** Keys (`sk_test_…` / `sk_live_…`), **Price IDs** (`price_…`), and **webhook signing secrets** (`whsec_…`) are **mode-isolated**. Staging stays on **TEST** until you consciously cut over production. Copy this checklist into tickets or strike items as you go. **Synced to assessments (2026-05-01).** Narrative updates in **`QUALITY_ASSESSMENT_*_INDEPENDENT_*`** assume you completed § **A** (Product + recurring Price + **`price_…`**) and injected **`Billing:Stripe:PriceIdTeam`** in at least
**Headings:** Stripe integration — operator completion checklist; A. Stripe account (Product Catalog); B. API configuration (ArchLucid.Api); C. Stripe webhooks; D. Buyer journey verification; E. Marketing UX (`pricing.json` → Team “Subscribe with Stripe”); F. Production cutover (owner calendar); Assessments — visibility rule

#### `runbooks/STRIPE_STAGING_E2E_VERIFICATION.md`
**Scope:** **Scope:** Operators exercising Stripe Test mode against staging (checkout, webhooks, SQL) without code changes — not production billing policy or contract terms.
**Title:** Stripe staging — end-to-end verification (test mode)
**Summary:** **Objective:** An operator with **no code changes** can **wire, exercise, and verify** Stripe Test mode + ArchLucid staging: checkout session, webhook, SQL ledger, and tenant conversion. **Context and product copy:** [STRIPE_CHECKOUT.md](../go-to-market/STRIPE_CHECKOUT.md) (canonical Stripe hand-off). This runbook is the **operational, command-level** sequence and SQL. **Code references (read-only):** | Item | Location | |------|----------| | Checkout API (Admin) | `ArchLucid.Api/Controllers/Billing/BillingCheckoutController.cs` — `POST` **`/v1/tenant/billing/checkout`**, policy **`AdminAuthority`**, model **`BillingCheckoutPostRequest`** | | Webhook | `ArchLucid.Api/Controllers/Billing/Bill
**Headings:** Stripe staging — end-to-end verification (test mode); 0. Gaps between STRIPE_CHECKOUT.md and the repo (as of 2026-04-25); 1. Prerequisites; 2. Environment variables (illustrative names); 3. Step-by-step: configure API, webhook, product/price, UI, checkout, webhook, SQL; 3.1 Load configuration (operator); 3.2 Register the Stripe **test** webhook; 3.3 Create a test **Product** and **Price** (Stripe Test mode)

#### `runbooks/STRIPE_WEBHOOK_INCIDENT.md`
**Scope:** **Scope:** Runbook — Stripe webhook incident - full detail, tables, and links in the sections below.
**Title:** Runbook — Stripe webhook incident
**Summary:** > > **Status:** Draft (2026-04-20). Endpoint not yet implemented; this runbook is staged so that when the second billing provider lands, the operational story is already in place. | Symptom | First check | |---|---| | Stripe dashboard shows webhook deliveries failing with HTTP 401 | Stripe signing-secret rotation; ArchLucid's `Billing:Stripe:WebhookSigningSecret` may be stale. | | Stripe shows HTTP 200 but no row mutation in `dbo.BillingSubscriptions` | `Billing:Stripe:GaEnabled` is false (intentional rollback); confirm before changing anything. | | ArchLucid logs show `StripeWebhookSignatureInvalid` | Signing-secret mismatch, replay window exceeded, or proxy mutated the body. | | ArchLucid
**Headings:** Runbook — Stripe webhook incident; Symptom map; Statement descriptor; Triage steps (15 minutes); Rotation (signing secret); Manual replay (after a fix); In Stripe dashboard: Developers → Events → <event id> → Resend; When to engage product

#### `runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`
**Scope:** **Scope:** Operators aligning Terraform **remote state** with committed **`infra/**/*.tf`** resource addresses after the ArchLucid rename — greenfield verification, brownfield **`terraform state mv`**, optional DEV/Prod inventory — not application runtime behavior.
**Title:** Terraform Phase 7.5 — State alignment runbook
**Summary:** Committed Terraform under **`infra/**/*.tf`** uses **`archlucid`** resource labels only (historical rename initiative closed **2026-04-19**). Representative roots that previously carried **`archiforge`** addresses now declare, for example: - **`infra/terraform`:** `azurerm_api_management.archlucid`, `azurerm_api_management_api.archlucid` - **`infra/terraform-monitoring`:** `azurerm_dashboard_grafana.archlucid`, `grafana_folder.archlucid`, `azurerm_monitor_alert_prometheus_rule_group.archlucid_slo` **Greenfield applies** (first subscription deploy after this posture): remote state is created already aligned — **no** imperative **`state mv`** required. Run from repository root (POSIX **`rg`**,
**Headings:** Terraform Phase 7.5 — State alignment runbook; Greenfield / main-branch IaC posture (V1); Mandatory grep audit (repository acceptance); Operator rehearsal — remote state vs `.tf`; Brownfield — imperative `terraform state mv`; Subscription × root inventory (assessment **P1**); Related documents

#### `runbooks/TRACE_A_RUN.md`
**Scope:** **Scope:** Trace a run — audit, logs, and distributed traces - full detail, tables, and links in the sections below.
**Title:** Trace a run — audit, logs, and distributed traces
**Summary:** **Last reviewed:** 2026-04-16 Given a **run id** (no-dash hex or standard GUID string accepted by the API), reconstruct the **end-to-end story** of that run: creation, authority pipeline, commit, governance, exports, and failures — across **durable SQL audit** (`dbo.AuditEvents`), **OpenTelemetry** traces, and **structured logs** (Serilog), so operators can answer “what happened, in what order, under which request?” - The API is reachable with a token or **DevelopmentBypass** as in local/CI docs. - **Trace backend** (Jaeger, Grafana Tempo, Azure Application Insights, etc.) ingests OTLP or platform traces; you have a **trace viewer URL template** (same placeholder semantics as the operator UI
**Headings:** Trace a run — audit, logs, and distributed traces; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow (step-by-step); Prerequisites

#### `runbooks/TRIAL_END_TO_END.md`
**Scope:** **Scope:** Self-serve trial — end-to-end live acceptance - full detail, tables, and links in the sections below.
**Title:** Self-serve trial — end-to-end live acceptance
**Summary:** **Audience:** engineers running the merge-blocking Playwright suite locally, cleaning up after manual runs, or replaying billing harness calls. **Canonical spec:** [`archlucid-ui/e2e/live-api-trial-end-to-end.spec.ts`](../../archlucid-ui/e2e/live-api-trial-end-to-end.spec.ts) Prove **self-serve trial in production shape**: anonymous `POST /v1/register`, SQL-backed tenant + trial rows, operator UI (DevelopmentBypass scope), trial metering (`402` + `application/problem+json`), **Noop** checkout URL, harness-simulated **subscription activation** (same activator as Stripe `checkout.session.completed`), Prometheus funnel counters, and **Converted** trial UI (trial banner hidden). | Requirement |
**Headings:** Self-serve trial — end-to-end live acceptance; Objective; Preconditions; Run locally; Email + integration events; Cleaning up test tenants; Replaying the billing harness (idempotency); Related docs

#### `runbooks/TRIAL_FUNNEL.md`
**Scope:** **Scope:** Trial funnel observability runbook - full detail, tables, and links in the sections below.
**Title:** Trial funnel observability runbook
**Summary:** **Objective:** Operate self-service trial as a **measurable product funnel** (signup → verify → first committed manifest → usage → billing → conversion), with **Prometheus metrics** as the quantitative source of truth and **durable audit types** as the forensic complement. **Assumptions:** API exposes `GET /metrics` when `Observability:Prometheus:Enabled` is **true**; Grafana is wired from `infra/terraform-monitoring/grafana_dashboards.tf`; Alertmanager routes `severity=page` vs ticket-style labels per your org. **Constraints:** Trials use **`SystemWithPerTenantCatalogs`**: **each tenant organization has its own product SQL catalog** (same supported model as paying tenants—not a pooled share
**Headings:** Trial funnel observability runbook; Architecture overview (nodes and edges); Dashboard: `dashboard-archlucid-trial-funnel.json`; Alerting (`infra/prometheus/archlucid-alerts.yml`, group `archlucid-trial-funnel`); Escalation; Automated verification; Related documents

#### `runbooks/TRIAL_FUNNEL_END_TO_END.md`
**Scope:** **Scope:** Self-serve trial funnel — end-to-end map (signup → tenant → sample run → first commit → sponsor banner) - full detail, tables, and links in the sections below.
**Title:** Trial funnel — end-to-end (signup → first commit → sponsor banner)
**Summary:** **Audience:** engineers, product, and onboarding owners who need a single map of what happens between a prospect typing their email on `/signup` and the operator dashboard showing the **Day N since first commit** badge with a **before vs measured** review-cycle delta. **Companion docs (do not duplicate them here):** - [`docs/go-to-market/TRIAL_AND_SIGNUP.md`](../go-to-market/TRIAL_AND_SIGNUP.md) — product design of the trial. - [`docs/runbooks/TRIAL_END_TO_END.md`](TRIAL_END_TO_END.md) — live Playwright + harness acceptance with **real SQL** and the Noop checkout activator. - [`docs/runbooks/TRIAL_FUNNEL.md`](TRIAL_FUNNEL.md) — Prometheus + Grafana **observability** runbook. - [`docs/runbook
**Headings:** Trial funnel — end-to-end (signup → first commit → sponsor banner); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Step-by-step happy path; Step 1 — Prospect lands on `/signup`; Step 2 — `POST /api/proxy/v1/register` → `POST /v1/register`

#### `runbooks/TRIAL_LIFECYCLE.md`
**Scope:** **Scope:** Trial lifecycle runbook (expiry → read-only → export-only → purge) - full detail, tables, and links in the sections below.
**Title:** Trial lifecycle runbook (expiry → read-only → export-only → purge)
**Summary:** **Last reviewed:** 2026-05-11 (operator infra-teardown urgency note under **Operational considerations**) Describe automated **self-service trial** lifecycle transitions after `TrialExpiresUtc`, operator overrides, and **recovery** when data was removed by mistake. - Trial parameters follow [TRIAL_AND_SIGNUP.md](../go-to-market/TRIAL_AND_SIGNUP.md) §3 (30-day window is product policy; phase **durations** are configurable under `Trial:Lifecycle`). One-time 14-day extension available via in-app button. - `dbo.Tenants.TrialStatus` drives API behaviour (`GET /v1/tenant/trial-status`, `TrialLimitGate`). - Worker runs `TrialLifecycleSchedulerHostedService` (leader lease `hosted:trial-lifecycle-aut
**Headings:** Trial lifecycle runbook (expiry → read-only → export-only → purge); Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `runbooks/TRIAL_TO_PAID_IDENTITY_MIGRATION.md`
**Scope:** **Scope:** Operators and platform engineers executing trial→paid tenant conversion and Entra directory binding; excludes billing SKU design and generic Entra admin guides.
**Title:** Trial → paid identity handoff
**Summary:** After a self-service trial tenant is marked **converted** (`POST /v1/tenant/convert`), corporate Entra JWTs need a stable mapping from the directory id (`tid` claim) to the existing ArchLucid tenant row. Without that mapping, operators relied on manual scope headers or ad-hoc SQL. This runbook describes the **two-step** product flow and how to retire **local email/password** trial users safely. - Trial data (runs, manifests, findings) stays under the **same** `dbo.Tenants` row; conversion does not clone tenants. - Commercial sign-in uses **workforce Entra** (multi-tenant app) with `tid` matching the customer’s Microsoft Entra tenant. - Optional **local trial identity** (`dbo.IdentityUsers`)
**Headings:** Trial → paid identity handoff; Objective; Assumptions; Operator flow; 1. Convert the trial (billing / stub); 2. Bind the corporate directory; 3. Observe handoff status; Retiring LocalIdentity mode

#### `runbooks/TROUBLESHOOTING.md`
**Scope:** **Scope:** Troubleshooting for pilots and operators (56R) - full detail, tables, and links in the sections below.
**Title:** Troubleshooting for pilots and operators (56R)
**Summary:** **Goal:** Faster triage without reading the whole codebase. **Symptom index:** [Pilot rescue playbook](PILOT_RESCUE_PLAYBOOK.md) maps common stuck states (API down, health, auth, trial limits, commit readiness, governance gate, artifacts, real-mode AI, bundle redaction) to first commands and deeper docs. 1. See **[Common operator errors (top 10)](COMMON_ERRORS.md)** for step-by-step fixes to startup, auth, migrations, OpenAI, rate limits, concurrency, and readiness checks. 2. **`GET /health/live`** — process up? Then **`GET /health/ready`** — read JSON `entries[]` for the first **`Unhealthy`** / **`Degraded`** check. 2. **`GET /version`** — capture build identity for your report (same info a
**Headings:** Troubleshooting for pilots and operators (56R); First-line steps (try in order); Problem Details (`application/problem+json`) and `supportHint`; Quick matrix; API startup failures; Logs — what to search for; Artifact list empty or download 404; Support bundle (attach to tickets)

#### `runbooks/TRUST_CENTER_FRESHNESS.md`
**Scope:** **Scope:** How procurement-facing trust artefacts stay mechanically fresh — merge-blocking vs advisory checks.
**Title:** Trust Center Freshness
**Summary:** Keep `docs/go-to-market/trust-center.md` honest: links resolve and posture timestamps stay within policy windows documented here. | Script | Behaviour | |---|---| | [`scripts/ci/check_trust_center_links.py`](../../scripts/ci/check_trust_center_links.py) | **Fail-fast** broken relative / `blob/main/` links referenced from the trust-center page | | [`scripts/ci/check_trust_center_posture_freshness.py`](../../scripts/ci/check_trust_center_posture_freshness.py) | **Fail-fast** on malformed posture dates · **warnings** (`STALE_ROW`) when “Last reviewed” exceeds status-class budget (unless `--fail-on-stale`) | Maintenance rule: whenever you update a factual row in **`## Posture summary`**, set **L
**Headings:** Objective; Checks (CI); Optional strict mode

#### `runbooks/support-triage-drill.md`
**Scope:** **Scope:** For operators practicing support triage, routing, and evidence capture; not a full incident response plan or subsystem-specific deep runbook.
**Title:** Support triage drill (operator)
**Summary:** **Objective:** Practice routing customer-impacting issues to the right owner with evidence, without guessing at root cause. **Assumptions:** ArchLucid API and UI are reachable; you have read access to logs, SQL (when applicable), and the customer’s tenant scope identifiers. **Constraints:** Do not paste secrets, API keys, or full payloads into public tickets; use correlation IDs and redacted excerpts only. - **Dispatcher:** Owns the timeline, communication, and severity. - **Resolver:** Owns technical diagnosis (may be same person in small teams). - **SEV1:** Total loss of authority/commit path for multiple tenants, or confirmed data loss. - **SEV2:** Degraded commit or execute for a single
**Headings:** Support triage drill (operator); Roles; Severity sketch; Triage checklist (15 minutes); Post-incident (same week); Security / scalability / reliability / cost

### `samples`

#### `samples/policy-packs/README.md`
**Scope:** **Scope:** Sample **`PolicyPackContentDocument`** JSON for pilots and procurement demos — not a certification artifact.
**Title:** Sample policy packs
**Summary:** These files match the persisted shape described in **`ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackContentDocument`**: `complianceRuleIds`, `complianceRuleKeys`, `alertRuleIds`, `compositeAlertRuleIds`, `advisoryDefaults`, `metadata` (all **`metadata` / `advisoryDefaults` values are strings**). | File | Intent | |------|--------| | [soc2-compliance-baseline.json](./soc2-compliance-baseline.json) | **Severity gate** (Warning+) via `governance.blockCommitMinimumSeverity`, plus checklist strings for classification / encryption citations / least-privilege wording. Selects logging, encryption, and access catalog rules (`saas-ctrl-001` … `003`). | | [cloud-migration-readiness.json](./clo
**Headings:** Sample policy packs; Prerequisites; Validate JSON shape (local); Import via API; PowerShell example (create); Dry-run without persisting; Customize

### `security`

#### `security/ACCESSIBILITY_MAILBOX.md`
**Scope:** **Scope:** Security and accessibility operations owners provisioning and routing the `accessibility@archlucid.net` alias; not WCAG engineering guidance (see root [`ACCESSIBILITY.md`](../../ACCESSIBILITY.md) and marketing **`/accessibility`**).
**Title:** Accessibility mailbox (`accessibility@archlucid.net`)
**Summary:** **`accessibility@archlucid.net`** exists as a **public-facing alias** for reporting **accessibility barriers** (WCAG / usability / assistive-technology friction). Mail routes to the **same operational custodian** as **`security@archlucid.net`** so one accountable owner triages inbound mail; the subject line and message body should make **accessibility vs coordinated security disclosure** obvious. This document records **intent and provisioning steps**. Creating the alias in DNS / tenant admin is **owner-only** (same gate as the canonical `security@` mailbox). | Mailbox | Role | | ------- | ---- | | `security@archlucid.net` | Canonical coordinated disclosure + security inquiries (see [`SECURI
**Headings:** Accessibility mailbox (`accessibility@archlucid.net`); Decision (2026-04-22); Custodian alignment; Public surfaces; Provisioning checklist (Microsoft 365 / Exchange Online) — use if `security@` is an Exchange mailbox or shared mailbox in Entra ID; Provisioning checklist (Google Workspace) — use if `security@` is a Google Workspace user or group; Operational notes

#### `security/ASK_RAG_THREAT_MODEL.md`
**Scope:** **Scope:** Threat model sketch — Ask and RAG - full detail, tables, and links in the sections below.
**Title:** Threat model sketch — Ask and RAG
**Summary:** Capture **primary threats** and **controls** for the **Ask** surface and **retrieval-augmented generation (RAG)** path so security reviews and architecture diagrams stay aligned with implementation choices. - The model may be **Azure OpenAI** or a **simulator** in development; production uses **private networking** and **managed identity** where possible. - **Retrieval** can be in-memory or **Azure AI Search**; vector stores hold **chunks derived from committed runs / ingested context**. - **Prompt injection** cannot be fully eliminated; mitigate with **grounding rules**, **output filtering**, and **scope isolation**. - **Third-party model providers** introduce **subprocessor** and **data pr
**Headings:** Threat model sketch — Ask and RAG; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `security/AUTHORIZATION_BOUNDARY_TEST_INVENTORY.md`
**Scope:** **Scope:** Developers finding Core integration tests for RBAC, API keys, and tenant RLS — not a complete threat model or compliance attestation.
**Title:** Authorization boundary test inventory
**Summary:** Integration tests that lock in **RBAC** (Reader / Operator / Admin policy surfaces), **API key** behavior, and **tenant isolation** (SQL row-level security with `SESSION_CONTEXT`) are listed below. They are part of the **Core** integration suite. **How to run**
**Headings:** Authorization boundary test inventory; Authorization boundary tests (`AuthorizationBoundaryTests`); Tenant isolation (`TenantIsolationSmokeTests`); Policy reference (read-only; attributes are not changed in tests)

#### `security/CAIQ_LITE_2026.md`
**Scope:** **Scope:** CAIQ Lite-style questionnaire (Cloud Security Alliance **CAIQ v4** alignment). **Not** a completed STAR / CCM submission — pre-filled for procurement drafts.
**Title:** CAIQ Lite — ArchLucid (2026 pre-fill)
**Summary:** **Source alignment:** CSA Consensus Assessment Initiative Questionnaire (CAIQ) **Lite** themes. Download the authoritative **CAIQ v4** spreadsheet from [Cloud Security Alliance](https://cloudsecurityalliance.org/) and **map each row’s official CAIQ control ID** when submitting through a STAR registry — the tables below use **internal theme codes** (for example **GOV**, **HRS**) for navigation; they are **not** substitutes for spreadsheet row IDs. **Dry-run note (procurement):** Rows marked **Partial** include an explicit **Gap / next step** in this file or in linked evidence (not silent N/A). Owner must still transpose answers into the buyer’s CAIQ workbook cell-for-cell. **Product context:*
**Headings:** CAIQ Lite — ArchLucid (2026 pre-fill); Governance (GOV); Human resources (HRS); Information management (IMC); Operations (OPS); Application security (APP); Related

#### `security/COMPLIANCE_MATRIX.md`
**Scope:** **Scope:** Map SOC 2 self-assessment themes to concrete repository evidence.
**Title:** Compliance evidence matrix (SOC 2 alignment)
**Summary:** This table links **control themes** from [`SOC2_SELF_ASSESSMENT_2026.md`](SOC2_SELF_ASSESSMENT_2026.md) to **verifiable artifacts** in-repo. | Theme | Evidence path | Notes | |-------|----------------|-------| | Authentication / authorization | [`ArchLucid.Host.Core/Startup/AuthSafetyGuard.cs`](../../ArchLucid.Host.Core/Startup/AuthSafetyGuard.cs), `ArchLucid.Api/Program.cs`, [`SECURITY.md`](../library/SECURITY.md) | Fail-closed defaults | | Tenant isolation | `docs/security/MULTI_TENANT_RLS.md`, SQL migrations under `ArchLucid.Persistence/Migrations/` | Historical RLS object names may still include `Archiforge*` per rename policy | | API contract hardening | `.github/workflows/ci.yml` (`api
**Headings:** Compliance evidence matrix (SOC 2 alignment); Related

#### `security/DSAR_PROCESS.md`
**Scope:** **Scope:** GDPR Data Subject Access Request (DSAR) process — identifies PII storage locations and documents the manual fulfillment process.
**Title:** GDPR Data Subject Access Request (DSAR) process
**Summary:** **Audience:** DPOs, compliance officers, operators, and procurement teams who need to understand how ArchLucid handles GDPR data subject rights. **Status:** V1 manual process. This document covers the data map, the fulfillment steps for each right, and known limitations. **Not legal advice:** This document describes technical capabilities and operational processes. It does not constitute legal advice. Consult qualified counsel for jurisdiction-specific obligations. - [DPA_TEMPLATE.md](../go-to-market/DPA_TEMPLATE.md) — Data Processing Agreement template - [TRUST_CENTER.md](../go-to-market/TRUST_CENTER.md) — buyer-facing trust index - [AUDIT_RETENTION_POLICY.md](../library/AUDIT_RETENTION_POL
**Headings:** GDPR Data Subject Access Request (DSAR) process; Related; 1. Personal data map; 1.1 SQL Server tables containing PII; 1.2 Other storage locations; 2. Right of access (Article 15); 3. Right to rectification (Article 16); 4. Right to erasure (Article 17)

#### `security/EVIDENCE_PACK.md`
**Scope:** **Scope:** Day-1 Evidence Pack - full detail, tables, and links in the sections below.
**Title:** Day-1 Evidence Pack
**Summary:** > > **Status:** Specification draft (2026-04-20). The endpoint and hosted service are not yet implemented; this document is the contract that the implementation must satisfy. Today an operator who wants to satisfy a "show me your evidence" request must: 1. Run the audit export (`GET /v1/audit/export`). 2. Manually screenshot RLS settings. 3. Manually grab the content-safety configuration. 4. Manually compute SLO numbers from Prometheus. 5. Manually list installed policy packs and their versions. Each step is its own runbook. The evidence pack collapses that into one signed artefact.
**Headings:** Day-1 Evidence Pack; Why this exists; Endpoint; Bundle contents; Daily Merkle root; Failure modes and behaviour; Tests (must exist before merge); Companion runbook

#### `security/GITLEAKS_PRE_RECEIVE.md`
**Scope:** **Scope:** Git server administrators installing server-side secret scanning; not client-side hook alternatives or ArchLucid application runtime security.
**Title:** Gitleaks — server-side pre-receive hook
**Summary:** **Goal:** Block pushes that introduce secrets into the canonical Git server **before** objects become reachable from default branches. Install [gitleaks](https://github.com/gitleaks/gitleaks) on the Git host (Linux bare/self-managed `git` is the reference environment). From the bare repository on the server:
**Headings:** Gitleaks — server-side pre-receive hook; Prerequisite; Install; Behaviour; Client-side complement; Historical Stripe-shaped fixture

#### `security/GOVERNANCE_DRY_RUN_MITIGATIONS.md`
**Scope:** **Scope:** For security and platform teams assessing governance dry-run controls—audit signals, throttling, and opaque errors; **not** full governance API reference or non–dry-run promotion workflows.
**Title:** Governance dry-run mitigations (enumeration & SIEM visibility)
**Summary:** Document controls added for governance **dry-run** flows so security and platform teams can reason about residual risk after `dryRun=true` skips repository writes, baseline audit rows, durable rows for real commits, and integration outbox work. | Area | Control | |------|---------| | **Approval request** `POST /v1/governance/approval-requests?dryRun=true` | After successful in-scope validation, the app emits **`GovernanceDryRunValidationAttempted`** (durable audit) so operators cannot probe run existence without a forensic row. | | **Promotion** `POST /v1/governance/promotions?dryRun=true` | Same **`GovernanceDryRunValidationAttempted`** event after validation succeeds (including prod approv
**Headings:** Governance dry-run mitigations (enumeration & SIEM visibility); Objective; What changed (product behavior); Configuration keys; Data flow (audit); Security / scalability / reliability / cost; Related code

#### `security/MANAGED_IDENTITY_SQL_BLOB.md`
**Scope:** **Scope:** Managed identity for Azure SQL and Blob (ArchLucid) - full detail, tables, and links in the sections below.
**Title:** Managed identity for Azure SQL and Blob (ArchLucid)
**Summary:** Give operators a **repeatable pattern** for connecting the API to **Azure SQL** and **Azure Blob** using **Microsoft Entra ID authentication** (managed identity on Azure App Service / Container Apps / AKS workload identity), instead of storing SQL or storage keys in configuration. - The API runs on Azure with a **user-assigned or system-assigned managed identity**. - SQL is **Azure SQL**; storage is **Azure Storage** with blob containers used by ArchLucid features that target blob. - Network path uses **private endpoints** where required by policy (see `infra/terraform-private/`). - **Least privilege:** grant only `db_datareader` / `db_datawriter` / custom roles as needed, not `db_owner`, un
**Headings:** Managed identity for Azure SQL and Blob (ArchLucid); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `security/MULTI_TENANT_RLS.md`
**Scope:** **Scope:** Multi-tenant row-level security (SQL) — design sketch - full detail, tables, and links in the sections below.
**Title:** Multi-tenant row-level security (SQL) — design sketch
**Summary:** Describe how ArchLucid enforces **tenant / workspace / project isolation in SQL Server** so a compromised application tier or query bug cannot read or mutate another customer’s rows, while keeping the current **application-level scope** model (`IScopeContextProvider`) as the primary authorization gate. - Primary store is **SQL Server** (Azure SQL or boxed) with **private connectivity**; SMB/file shares are not used for tenant data at the API boundary. - **Entra ID** (or API keys in constrained scenarios) identifies the caller; **scope** (tenant, workspace, project) is derived from claims or headers and validated in the application layer. - When **`ArchLucid:SqlTopology:Mode=SystemWithPerTena
**Headings:** Multi-tenant row-level security (SQL) — design sketch; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `security/MULTI_TENANT_RLS_RESIDUAL_RISK_MATRIX.md`
**Scope:** **Scope:** Residual multi-tenant isolation — mapping uncovered SQL surfaces to compensating controls (extends `MULTI_TENANT_RLS.md`).
**Title:** Multi-tenant RLS — residual risk matrix
**Summary:** > Give operators and security reviewers a **single table-style view** of SQL surfaces that **do not** participate in `rls.ArchLucidTenantScope`, the **primary compensating control** already in production code, and how **monitoring / process** reduces residual lateral-movement risk. - Application-layer scope enforcement (`IScopeContextProvider`, governance APIs) remains authoritative for business authorization. - In `SystemWithPerTenantCatalogs` (production) mode, the database boundary provides sufficient tenant isolation. RLS is not required for defense-in-depth and this matrix describes optional hardening only. In `SingleCatalog` (dev/test) mode, the compensating controls below remain relev
**Headings:** Multi-tenant RLS — residual risk matrix; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `security/OWNER_SECURITY_ASSESSMENT_2026_Q2.md`
**Scope:** **Scope:** Owner-conducted security assessment (Q2 2026) — full detail, tables, and links in the sections below.
**Title:** Owner-conducted security assessment — Q2 2026
**Summary:** **Status:** Owner-conducted assessment **(not third-party audited).** When we say third-party penetration test coverage or SOC 2, read `docs/library/V1_DEFERRED.md` §6c — those artefacts are tracked for V1.1 separately. **This is not a third-party penetration test and is not a SOC 2 attestation.** It is an **internal security self-assessment** performed by the product owner / engineering team, structured for buyer transparency until a separately funded external assessor delivers a redacted summary under [`pen-test-summaries/`](pen-test-summaries/README.md). **Assessment window (planned):** `2026-04-28` — `2026-04-28` **Scope in / out:** ArchLucid API surface (ASP.NET Core), operator UI (Next
**Headings:** Owner-conducted security assessment — Q2 2026; Method; Findings summary; Sign-off (internal); Limitations

#### `security/PENTEST_EXTERNAL_UI_CHECKLIST.md`
**Scope:** **Scope:** External browser UI pen test checklist (authorized, UI-only scope) — methodology hints, no live test results or customer data.
**Title:** External UI pen test checklist
**Summary:** **Audience:** Qualified assessors and security owners running a **time-boxed**, **authorized** assessment of ArchLucid’s **publicly reachable web UI** (e.g. `archlucid-ui`). **Tools:** primarily a **reverse proxy** (Burp Suite or OWASP ZAP) plus a modern browser and DevTools. **Not in scope for this document:** API-only engagements, internal network testing, cloud control-plane reviews, or denial-of-service. Expand scope explicitly in the statement of work if needed. **Related:** [Penetration test — SOW template](./PEN_TEST_SOW_TEMPLATE.md), [OWASP ZAP baseline rules](./ZAP_BASELINE_RULES.md) (CI baseline targets the API, not a substitute for manual UI testing). 1. **Rules of engagement:** C
**Headings:** External UI pen test checklist; 1. Before testing; 2. Authentication and session; 3. Authorization; 4. Injection and browser execution; 5. Cross-site request forgery and framing; 6. Data leakage and caching; 7. Transport and headers

#### `security/PEN_TEST_REDACTED_SUMMARY_TEMPLATE.md`
**Scope:** **Scope:** Penetration test — redacted summary (customer template) - full detail, tables, and links in the sections below.
**Title:** Penetration test — redacted summary (customer template)
**Summary:** **Purpose:** Publishable **one-to-two page** summary after an internal full report exists. Remove internal hostnames, account emails, and stack traces. | Field | Value | |-------|--------| | Vendor | ArchLucid | | Assessor | `<legal entity>` | | Window | `<UTC start>` – `<UTC end>` | | Environment | Staging / pre-production (not customer production) | `<One paragraph: APIs, UI, identity mode, data stores in test>.` | Severity | Count | Representative themes | |----------|-------|------------------------| | Critical | `<n>` | `<e.g. authZ bypass — illustrative only>` | | High | `<n>` | `<e.g. injection class>` | | Medium | `<n>` | `<e.g. information disclosure>` | | Low | `<n>` | `<e.g. harde
**Headings:** Penetration test — redacted summary (customer template); Engagement; Scope summary; Findings overview; Remediation status; Statement

#### `security/PEN_TEST_SOW_TEMPLATE.md`
**Scope:** **Scope:** Penetration test — statement of work (template) - full detail, tables, and links in the sections below.
**Title:** Penetration test — statement of work (template)
**Summary:** **Audience:** Vendor + qualified assessor. **Do not** paste production secrets, connection strings, or customer PII into this document. Authorize a **time-boxed** technical assessment of ArchLucid’s exposed attack surface (web API, operator UI, supporting infrastructure in scope). | In scope | Out of scope (unless explicitly added) | |----------|------------------------------------------| | HTTPS API surface documented in OpenAPI | Customer-owned IdP misconfiguration | | Operator UI (`archlucid-ui`) staging tenant | Physical / social engineering | | Azure OpenAI integration (rate limits, auth) | Third-party SaaS outside subprocessors list | | SQL Server with **RLS session context** enabled a
**Headings:** Penetration test — statement of work (template); 1. Objective; 2. Scope; 3. Methodology; 4. Deliverables; 5. Artifacts for assessor

#### `security/PGP_KEY_GENERATION_RECIPE.md`
**Scope:** **Scope:** Security custodian (owner) generating, exporting, publishing, and rotating the OpenPGP key used for coordinated disclosure to **`security@archlucid.net`**. Not Stripe/Marketplace secrets, not CI automation of private keys.
**Title:** PGP key generation and publication (coordinated disclosure)
**Summary:** ArchLucid publishes a **public** OpenPGP key so vulnerability reporters can **encrypt** findings to **`security@archlucid.net`** before the public key exists at **`https://archlucid.net/.well-known/pgp-key.txt`**, coordinated disclosure uses **plain email** only (see [SECURITY.md](../../SECURITY.md)). This document is an **executable recipe** for the **owner-self custodian** (decision **2026-04-22**, [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) items **10** / **21**). The **private** key never enters this repository, CI secrets, or Azure Key Vault (Key Vault is for application secrets such as Stripe/Marketplace—not PGP private material). 1. Install **GnuPG 2.4.x** (or newer **2.x**) on
**Headings:** PGP key generation and publication (coordinated disclosure); Purpose; Prerequisites; Choose algorithm; Generate (ECC sign and encrypt, Curve25519) — interactive; Generate (RSA 4096) — interactive; Generate (non-interactive batch) — optional; Export public key (ASCII armor)

#### `security/PII_EMAIL.md`
**Scope:** **Scope:** PII boundary for transactional email - full detail, tables, and links in the sections below.
**Title:** PII boundary for transactional email
**Summary:** Define what **personally identifiable information (PII)** may appear in **trial lifecycle transactional email** bodies, how that relates to **audit-derived mailbox resolution**, and how future **tenant policy** could widen content safely. - Trial lifecycle templates intentionally avoid **architecture artefacts** (manifest JSON, finding text, run narratives). - The **To** address is sourced from **durable audit actor ids** (`TrialProvisioned` / `TenantSelfRegistered`) and is therefore already classified as **identity contact data** in the audit store. - **Default posture:** emails contain **product metadata** (tenant display name, counts, dates, tier labels) — not **customer workload content*
**Headings:** PII boundary for transactional email; Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `security/PII_RETENTION_CONVERSATIONS.md`
**Scope:** **Scope:** PII classification and retention — Ask / conversation data - full detail, tables, and links in the sections below.
**Title:** PII classification and retention — Ask / conversation data
**Summary:** Give operators and engineers a **first-principles frame** for what might constitute **personally identifiable information (PII)** in ArchLucid **conversation / Ask** artifacts, how long to keep them, and how to reduce risk without blocking product value. - **Ask threads** may contain user free text, pasted logs, names, emails, or internal system names that indirectly identify people or systems. - **Retention** requirements vary by industry; defaults should be **conservative** and **configurable**. - Not all deployments store full message bodies in SQL long term; some may truncate or offload to blob with separate lifecycle. - **Incomplete requirements** are normal: legal/compliance teams may
**Headings:** PII classification and retention — Ask / conversation data; 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `security/PRIVACY_NOTE.md`
**Scope:** **Scope:** Operators and privacy or compliance reviewers; states controller-side processing activities and legal-basis framing for ArchLucid operational telemetry. Not legal advice, a full subprocessors inventory, tenant workload DPA terms, or a consumer-facing privacy policy.
**Title:** ArchLucid privacy notice (operator-facing)
**Summary:** > **Status:** **APPROVED — 2026-04-25.** All four owner sign-off items resolved. See §6 change history. Document the personal-data processing activities that ArchLucid carries out as a **data controller** for tenant operator interactions with the SaaS surface. This file is the canonical reference for **GDPR Article 30** records of processing and the **Article 6(1)(f)** legitimate-interest balancing tests cited in shipping code. - ArchLucid's primary commercial relationship is **B2B SaaS**: the data subject is the operator employee at a tenant organisation, not a consumer. - Tenant-supplied **architecture artefacts** (manifests, findings, run narratives) are **customer workload content** and
**Headings:** ArchLucid privacy notice (operator-facing); 1. Objective; 2. Assumptions; 3. Named processing activities; 3.A — First-tenant onboarding funnel (Improvement 12); 3.B — Trial lifecycle transactional email; 3.C — Operator-shell client-error telemetry; 4. Subject rights

#### `security/RLS_DENORM_GAP_ANALYSIS_2026_05_02.md`
**Scope:** **Scope:** Security/engineering analysis of SQL RLS denormalization coverage vs migrations; not an attestation or production sign-off.
**Title:** RLS Denormalization Gap Analysis
**Summary:** **Date:** 2026-05-02 **Migrations analyzed:** 036, 046, 070, 129 (plus spot-checks of 104, 118, 121, 122, 133) **Policy name progression:** `rls.ArchiforgeTenantScope` → renamed `rls.ArchLucidTenantScope` in 108 **Security policy predicate:** `rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId)` The system ran two explicit denormalization waves and several targeted per-feature additions. | Migration | Wave | Tables reached | |-----------|------|----------------| | 036 | Policy creation | 26 primary/parent tables with FILTER-only predicates | | 046 | Wave 1 child | `ContextSnapshots`, `FindingsSnapshots`, `GoldenManifestAssumptions` | | 070 | New table | `UsageEvents` — born with
**Headings:** RLS Denormalization Gap Analysis; 1. What the denormalization campaign achieved; Wave 2 (129) table families; 2. Confirmed gaps — join-through-only or no-predicate tables; CRITICAL — Agent execution lineage (no TenantId column); HIGH — `dbo.FindingReviewEvents` (migration 121); HIGH — `dbo.ImportedArchitectureRequests` (migration 122); MEDIUM — `dbo.ComparisonRecords` (migration 002)

#### `security/RLS_RISK_ACCEPTANCE.md`
**Scope:** **Scope:** Row-level security (RLS) — residual risk acceptance (template) - full detail, tables, and links in the sections below.
**Title:** Row-level security (RLS) — residual risk acceptance (template)
**Summary:** Record **explicit acceptance** of residual risks when **SQL Server RLS** is enabled, partially rolled out, or when **uncovered tables** remain application-scoped only. This is a **governance artifact**, not executable policy. - RLS design is described in [MULTI_TENANT_RLS.md](MULTI_TENANT_RLS.md) (§9 covered / uncovered inventory). - The API continues to enforce **tenant / workspace / project** authorization (`IScopeContextProvider`, policies). - **Private connectivity** to SQL; no public SMB/file share exposure for tenant payloads at the API boundary. - RLS **cannot** fix application logic bugs that use the correct tenant but wrong business rules. - **Uncovered** tables (see MULTI_TENANT_RL
**Headings:** Row-level security (RLS) — residual risk acceptance (template); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; Uncovered tables inventory (mirror of MULTI_TENANT_RLS §9); 6. Data flow

#### `security/SCIM_THREAT_MODEL.md`
**Scope:** **Scope:** Security reviewers assessing inbound SCIM risks and mitigations for v1; not a complete enterprise risk register, pen-test report, or IdP-specific configuration guide.
**Title:** SCIM threat model (inbound, v1)
**Summary:** - **SCIM bearer tokens** — long-lived automation credentials per tenant. - **`dbo.ScimUsers` / `dbo.ScimGroups` / `dbo.ScimGroupMembers`** — provisioned identity projections. - **Enterprise seat counters** on `dbo.Tenants`. | Actor | Goal | |-------|------| | **External anonymous** | Enumerate or mutate SCIM without credentials. | | **Token thief** | Replay a leaked bearer token to create rogue admins or exhaust seats. | | **Malicious insider (tenant admin)** | Mint many tokens, exfiltrate hashes from DB backups. | | Risk | Mitigation | |------|------------| | Anonymous access | All SCIM controllers require **`ScimBearer` + `ScimWrite`**; architecture tests forbid `[AllowAnonymous]` under `C
**Headings:** SCIM threat model (inbound, v1); Assets; Adversaries; Controls; Residual risks; Out of scope (v1)

#### `security/SIG_CORE_2026.md`
**Scope:** **Scope:** Shared Assessments **SIG Core**-style control mapping (pre-fill). **Not** a completed SIG submission — use for RFP appendix drafts.
**Title:** SIG Core — ArchLucid (2026 pre-fill)
**Summary:** **Source alignment:** Shared Assessments SIG **Core** control families. Obtain the current SIG Core workbook from [Shared Assessments](https://sharedassessments.org/) and copy **authoritative SIG control IDs** into your vendor profile — the **A–H family headings** here are a **summary index**, not a complete SIG row checklist. **Dry-run note (procurement):** Status values (**Strong**, **Partial**, **In flight**, **Inherited**) are explained in-line with evidence links. **Partial** rows describe what exists in-repo vs what needs NDA or external artefact follow-up — they are **not** implicit full SIG “pass” without buyer mapping. | Control intent | Status | Evidence | |----------------|-------
**Headings:** SIG Core — ArchLucid (2026 pre-fill); Control family A — Corporate governance; Control family B — Risk management; Control family C — Human resources; Control family D — Information security; Control family E — Asset management; Control family F — Physical / environmental; Control family G — Operations

#### `security/SOC2_SELF_ASSESSMENT_2026.md`
**Scope:** **Scope:** SOC 2 Trust Services Criteria — **self-assessment only** (not CPA attestation). **2026-05-01:** third-party pen test is **V2**; V1 uses owner-conducted testing per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6c. CAIQ/SIG pre-filled; Type I scoping funded as a **readiness** milestone (not yet an opinion).
**Title:** SOC 2 — Owner self-assessment (2026)
**Summary:** > **IMPORTANT:** This document is an **internal / buyer-transparency self-assessment**. It is **not** a SOC 2 Type I or Type II **audit opinion** and must not be represented as third-party attestation. **In scope:** Security (CC) and Availability (A) criteria most relevant to the hosted API + SQL data plane. Confidentiality, Processing Integrity, and Privacy are **partially** addressed where they overlap engineering controls (see gap register). | TSC theme | ArchLucid evidence (examples) | Maturity | |-----------|-------------------------------|----------| | Security — logical access | Entra / JWT roles, API keys, RBAC policies; `AuthSafetyGuard`; privileged operations audited per [`AUDIT_CO
**Headings:** SOC 2 — Owner self-assessment (2026); Scope; Control summary (high level); Gap register; SOC 2 Type I — funded scoping (Q2–Q3 2026); Pending questions (G-001); Related

#### `security/SYSTEM_THREAT_MODEL.md`
**Scope:** **Scope:** ArchLucid — system STRIDE threat model (summary) - full detail, tables, and links in the sections below.
**Title:** ArchLucid — system STRIDE threat model (summary)
**Summary:** Give security reviewers a **single** STRIDE-oriented view of the **whole** product boundary (not only Ask/RAG — see **`ASK_RAG_THREAT_MODEL.md`** for that slice). - Azure-first deployment: **Container Apps**, **Azure SQL**, optional **Service Bus**, **Blob**, **Front Door + WAF**, **Entra ID**. - Operators are **authenticated**; **DevelopmentBypass** exists only in non-production with guardrails. - Incomplete requirements and misconfiguration are **expected**; controls are **defense in depth**. - This is **not** a formal penetration-test report; it informs controls and backlog. - **No public SMB (445)**; data plane via **private endpoints** where configured (**`docs/CUSTOMER_TRUST_AND_ACCESS
**Headings:** ArchLucid — system STRIDE threat model (summary); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown (STRIDE — representative threats); 5.1 Anonymous demo read surfaces (`/v1/demo/*`); 5.2 Local first-real-value path (`archlucid try --real`)

#### `security/TENANT_ISOLATION_IMPLEMENTATION_NOTES.md`
**Scope:** **Scope:** Concrete tenant-isolation enforcement in code (RLS, policies, blob paths, tests) for engineers; not a full threat-model paper or customer-facing trust narrative.
**Title:** Tenant isolation — implementation notes (2026-04)
**Summary:** This doc ties code changes to the tenant-isolation threat model: what was enforced in SQL, HTTP, blob paths, and tests. - **Parity guard:** [RlsTenantScopePolicyParityIntegrationTests.cs](../../ArchLucid.Persistence.Tests/RlsTenantScopePolicyParityIntegrationTests.cs) compares `sys.security_predicates` targets for `ArchiforgeTenantScope` vs `ArchLucidTenantScope` when both policies exist; post–migration 108 only `ArchLucidTenantScope` remains, and the test still asserts it is non-empty. - **DDL guard:** [TenantScopedTableDdlTests.cs](../../ArchLucid.Architecture.Tests/TenantScopedTableDdlTests.cs) was extended for `ContextSnapshots`, `GoldenManifests` blob URI column, `ScimUsers` (tenant-onl
**Headings:** Tenant isolation — implementation notes (2026-04); SQL (RLS); HTTP authorization; Audit scope backfill; Blob paths (artifact offload); Integration tests; Diagram (nodes / edges)

#### `security/TRIAL_AUTH.md`
**Scope:** **Scope:** Trial-tier authentication (External ID + local identity) - full detail, tables, and links in the sections below.
**Title:** Trial-tier authentication (External ID + local identity)
**Summary:** **Last reviewed:** 2026-04-17 Document the **trust boundary**, **configuration switches**, and **operational trade-offs** for ArchLucid **self-service trial** sign-in when the buyer has **no workforce Entra tenant** federated yet. - Trial buyers may authenticate with **Microsoft personal accounts (MSA)**, **Google**, or **email/password** hosted in **Entra External ID (CIAM)** (`Auth:Trial:Modes` contains `MsaExternalId`). - Some pilots need a **fallback** without any Microsoft consumer directory: **local email/password** backed by SQL (`Auth:Trial:Modes` contains `LocalIdentity`, migration **077**, table **`dbo.IdentityUsers`**). - Production hosts are **misconfigured by default** if Extern
**Headings:** Trial-tier authentication (External ID + local identity); 1. Objective; 2. Assumptions; 3. Constraints; 4. Architecture overview; 5. Component breakdown; 6. Data flow; 7. Security model

#### `security/TRIAL_LIMITS.md`
**Scope:** **Scope:** Trial limits (runs, seats, expiry) - full detail, tables, and links in the sections below.
**Title:** Trial limits (runs, seats, expiry)
**Summary:** Enforce SaaS **trial quotas** and **read-only after expiry** for tenants whose `dbo.Tenants` trial columns (see migration **072**) indicate an **Active** self-service trial. Clients must not rely on the UI: limits are **authoritative on the server**. - Trial state is stored in SQL (`TrialStatus`, `TrialExpiresUtc`, `TrialRunsLimit` / `TrialRunsUsed`, `TrialSeatsLimit` / `TrialSeatsUsed`). - **Converted** or **non-trial** tenants are not blocked by this gate. - Billing conversion (`POST /v1/tenant/convert`) must remain callable while on trial (see **`SkipTrialWriteLimit`** on that route). - **ReadAuthority** endpoints stay available when the trial is expired or exhausted (**read-only** postur
**Headings:** Trial limits (runs, seats, expiry); Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

#### `security/VPAT_2_4_WCAG_2_1_DRAFT.md`
**Scope:** **Scope:** Procurement, accessibility reviewers, and security/compliance stakeholders evaluating **ArchLucid Operator UI** (web) against **WCAG 2.1 Level A and AA**; draft **VPAT® 2.4 Rev–style** ACR excerpt in Markdown; **not** a legal opinion, **not** certification, **not** a substitute for full manual conformance assessment across every workflow.
**Title:** Accessibility Conformance Report (Draft) — ArchLucid Operator UI
**Summary:** **Template basis:** [ITI Voluntary Product Accessibility Template (VPAT®)](https://www.itic.org/policy/accessibility/vpat), **WCAG 2.1** reporting columns aligned with **VPAT® 2.4 Rev** (four conformance columns: conformance level **+ remarks**). VPAT® is an ITI registered service mark. **Edition reported:** WCAG **2.1** (Levels **A** and **AA** only — fifty success criteria). **Draft disclaimer:** This document is provided for informational purposes and reflects the current state of automated accessibility testing. Manual evaluation of criteria marked **Not Evaluated** is recommended. | Field | Value | | ----- | ----- | | **Product name** | ArchLucid Operator UI (web application) | | **Prod
**Headings:** Accessibility Conformance Report (Draft) — ArchLucid Operator UI; Section 1: Product information; Evaluation methods used (summary); Section 2: WCAG 2.1 Level A and AA tables; How to read conformance columns; Remarks shorthand; Principle 1: Perceivable; Principle 2: Operable

#### `security/VPAT_2_5_WCAG_2_1_AA.md`
**Scope:** **Scope:** Procurement, accessibility, and legal reviewers; ITI VPAT® 2.5–style Accessibility Conformance Report (ACR) for ArchLucid **web content** (marketing and operator UI) against **WCAG 2.1 Level A and AA**; not a legal determination of compliance, not covering non-web REST API or CLI except as noted.
**Title:** Accessibility Conformance Report — ArchLucid (VPAT® 2.5 structure, WCAG 2.1)
**Summary:** **Based on:** [ITI Voluntary Product Accessibility Template (VPAT®) 2.5](https://www.itic.org/policy/accessibility/vpat) — **WCAG** edition reporting columns adapted to Markdown. The VPAT® name and form are ITI registered service marks; this document is an in-repo ACR aligned with that structure. **Report date:** 2026-04-30 This report uses the four conformance levels defined by ITI for VPAT **2.5**: **Supports**, **Partially Supports**, **Does Not Support**, and **Not Applicable**. **Not Evaluated** is used only where no substantive evidence was available for this revision. **Honest limitations:** Conformance is assessed primarily from **automated** `@axe-core/playwright` and **jest-axe** r
**Headings:** Accessibility Conformance Report — ArchLucid (VPAT® 2.5 structure, WCAG 2.1); Instructions and disclaimers; Section 1: Product information; Evaluation methods used; Related repository artifacts; Section 2: WCAG 2.1 Level A and AA success criteria; Principle 1: Perceivable; Principle 2: Operable

#### `security/VPAT_EVIDENCE_MAP.md`
**Scope:** **Scope:** Accessibility and procurement reviewers mapping **WCAG 2.1 Level A and AA** criteria to **repository test artifacts** and **CI jobs** for ArchLucid web UI; companion to [`VPAT_2_5_WCAG_2_1_AA.md`](VPAT_2_5_WCAG_2_1_AA.md). This is an evidence index, not a substitute for the conformance judgments in the VPAT.
**Title:** VPAT evidence map — WCAG 2.1 A / AA ↔ tests and CI
**Summary:** **Related ACR:** [`docs/security/VPAT_2_5_WCAG_2_1_AA.md`](VPAT_2_5_WCAG_2_1_AA.md) **How to read this document** - **Merge-blocking** means the GitHub Actions job fails the PR when the check fails (see [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)). - **Axe** cannot prove full conformance for every success criterion; where the map says “axe rules,” it means “rules in the configured tag bundle may fire on this criterion’s topic—**zero serious/critical violations** is evidence, not certification.” - **No row below** claims complete manual WCAG conformance testing. | Job (workflow) | Command / driver | Merge-blocking | Role | | -------------- | ---------------- | :------------:
**Headings:** VPAT evidence map — WCAG 2.1 A / AA ↔ tests and CI; 1. Continuous integration jobs; 2. Playwright — live API + SQL (`ui-e2e-live`); 2.1 [`archlucid-ui/e2e/helpers/axe-helper.ts`](../../archlucid-ui/e2e/helpers/axe-helper.ts); 2.2 [`archlucid-ui/e2e/live-api-accessibility.spec.ts`](../../archlucid-ui/e2e/live-api-accessibility.spec.ts); 2.3 [`archlucid-ui/e2e/live-api-accessibility-focus.spec.ts`](../../archlucid-ui/e2e/live-api-accessibility-focus.spec.ts); 3. Vitest + jest-axe (`ui-axe-components`); 4. Radix UI primitives (design system)

#### `security/ZAP_BASELINE_RULES.md`
**Scope:** **Scope:** OWASP ZAP baseline rules (baseline-pr.tsv) - full detail, tables, and links in the sections below.
**Title:** OWASP ZAP baseline rules (`baseline-pr.tsv`)
**Summary:** ArchLucid wires **OWASP ZAP** baseline scanning into **GitHub Actions** using `zap-baseline.py` and a small **rule override file** in the repository. The CI job builds **`ArchLucid.Api/Dockerfile`**, waits for **`/health/live`**, then runs the scanner against the API on an isolated Docker network. The baseline **target URL** is the API origin (`http://archlucid-zap-api:8080`). ZAP’s automation expects **HTTP 200** on **`/`**, **`/robots.txt`**, and **`/sitemap.xml`**; the API serves minimal anonymous responses there so the spider plan does not fail on **404** bodies. **`SecurityHeadersMiddleware`** uses **`Cache-Control: public, max-age=3600`** on those paths (not `no-store`) so passive **10
**Headings:** OWASP ZAP baseline rules (`baseline-pr.tsv`); What “blocking” means; File location and mount; `baseline-pr.tsv` format; Adding a rule; Removing a rule; Triage process for new findings; Related docs

#### `security/pen-test-summaries/2026-Q2-DRAFT.md`
**Scope:** **Scope:** Penetration test — redacted summary (Q2 2026 draft placeholder) - full detail, tables, and links in the sections below.
**Title:** Penetration test — redacted summary (Q2 2026 draft)
**Summary:** **STATUS:** DRAFT — **do not** treat as a completed engagement. Replace every `<<...>>` token after the assessor (`<<VENDOR_LEGAL_NAME>>`) delivers a staging report and security leadership approves redaction. **Purpose:** Publishable **one-to-two page** summary after an internal full report exists. Remove internal hostnames, account emails, and stack traces. | Field | Value | |-------|--------| | Vendor | ArchLucid | | Assessor | `<<VENDOR_LEGAL_NAME>>` | | Window | `<<UTC_START>>` – `<<UTC_END>>` | | Environment | Staging / pre-production (not customer production) | `<<ONE_PARAGRAPH_SCOPE>>` | Severity | Count | Representative themes | |----------|-------|------------------------| | Critica
**Headings:** Penetration test — redacted summary (Q2 2026 draft); Engagement; Scope summary; Findings overview; Remediation status; Statement

#### `security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md`
**Scope:** **Scope:** Owner-conducted 2026-Q2 penetration-style exercise — empty findings tracker, methodology, and Trust Center cross-links only; not third-party assessor deliverables, exploit reproductions, or attestations.
**Title:** 2026-Q2 Owner-conducted penetration-style assessment
**Summary:** > **Publication:** Owner-conducted security exercise — summary structure only. **Detailed findings and reproducible exploitation steps are intentionally omitted from the public repo**; redacted artefacts follow NDA posture in [`docs/go-to-market/TRUST_CENTER.md`](../../go-to-market/TRUST_CENTER.md). > | ID | Category | Severity | Status | Date Found (UTC) | Date Resolved (UTC) | |----|----------|----------|--------|------------------|---------------------| | _Owner to populate — do not invent findings in automation._ | | Field | Value | |-------|-------| | Assessor | ArchLucid engineering / security liaison (internal) | | Trigger | Quarterly assurance cadence aligned with [`PENTEST_EXTERNAL_
**Headings:** 2026-Q2 Owner-conducted penetration-style assessment; Findings tracker; Engagement; Scope summary; Methodology; Tools; Pen test findings remediation (links placeholder); Overall posture assessment (stub)

#### `security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md`
**Scope:** **Scope:** Penetration test — redacted summary (customer template) — for use after a **V2** third-party assessor delivers a report. **V1** does not require this artefact for readiness scoring ([`V1_DEFERRED.md`](../../library/V1_DEFERRED.md) §6c, owner 2026-05-01). Repository procurement anchor (template): [`2026-Q2-SOW.md`](2026-Q2-SOW.md). Replace every `TODO` only from assessor-approved customer-shareable text — **do not invent severities, counts, or themes.**
**Title:** Penetration test — redacted summary (customer template)
**Summary:** **Status:** Awaiting **V2** third-party assessor delivery — DO NOT PUBLISH as findings until then **Purpose:** Publishable **one-to-two page** summary after an internal full report exists. Remove internal hostnames, account emails, and stack traces. | Field | Value | |-------|--------| | Vendor | ArchLucid | | Assessor | `<TODO: legal entity>` | | Window | `<TODO: UTC start>` – `<TODO: UTC end>` | | Environment | Staging / pre-production (not customer production) | `<TODO: one paragraph: APIs, UI, identity mode, data stores in test>.` | Severity | Count | Representative themes | |----------|-------|------------------------| | Critical | `<TODO:n>` | `<TODO: assessor themes only>` | | High |
**Headings:** Penetration test — redacted summary (customer template); Engagement; Scope summary; Findings overview; Remediation status; Statement

#### `security/pen-test-summaries/2026-Q2-SOW.md`
**Scope:** **Scope:** External penetration test — statement of work **template** (2026 Q2). **Not awarded** — reserved for a **V2** third-party vendor programme; no assessor committed for V1. V1 uses **owner-conducted** testing per [`2026-Q2-OWNER-CONDUCTED.md`](2026-Q2-OWNER-CONDUCTED.md) and [`V1_DEFERRED.md`](../../library/V1_DEFERRED.md) §6c (owner 2026-05-01).
**Title:** Penetration test — Statement of Work (2026 Q2) — template
**Summary:** **Status:** **Template only** — fill when a **V2** third-party vendor is selected and funded. **Do not** embed production secrets in this repository. **Independent quality assessments must not** treat absence of an executed third-party SoW as a **V1** deficit. Authorize a **time-boxed** technical assessment of ArchLucid’s **staging** attack surface aligned to OWASP ASVS-style depth, without destructive mutation of production. | In scope | Out of scope (unless explicitly added) | |----------|------------------------------------------| | Public HTTPS **v1** API (`/v1/*`, OpenAPI contract) | Customer-owned IdP misconfiguration | | Operator UI (`archlucid-ui`) against staging tenant | Physical /
**Headings:** Penetration test — Statement of Work (2026 Q2) — template; 1. Objective; 2. Scope; 3. Methodology; 4. Deliverables; 5. Assessor fields (executed — after V2 vendor award); 6. Artifacts for assessor (staging); 7. Redacted publication

#### `security/pen-test-summaries/README.md`
**Scope:** **Scope:** Penetration test redacted summaries — publication folder - full detail, tables, and links in the sections below.
**Title:** Penetration test redacted summaries — publication folder
**Summary:** **Audience:** Security leadership, procurement, and customer-facing sales engineering. **Purpose:** This directory is the **single place** redacted third-party penetration test summaries land once an engagement completes. It mirrors the structure of [`PEN_TEST_REDACTED_SUMMARY_TEMPLATE.md`](../PEN_TEST_REDACTED_SUMMARY_TEMPLATE.md) but stores **customer-ready** copies with internal hostnames, credentials, and stack traces removed. 1. **Source of truth** remains the assessor’s full report (not committed here). 2. **Redaction:** follow the checklist in the template’s preamble; scrub internal URLs, personal emails, and repro steps that expose live tenant ids. 3. **Cadence:** publish within **10
**Headings:** Penetration test redacted summaries — publication folder; Publication discipline; Files; Related

#### `security/pen-test-summaries/REMEDIATION_TRACKER.md`
**Scope:** **Scope:** Security lead, engineering, and release managers tracking pen-test remediation status — not publishing raw findings (NDA-gated summaries stay in this folder per `README.md`).
**Title:** Penetration test — remediation tracker
**Summary:** **Status:** Template — populate rows when vendor findings are triaged. Redacted summaries remain **NDA-gated** per [`README.md`](README.md) in this folder. 1. **Intake** — vendor assigns finding IDs; copy into this table. 2. **Triage** — severity, owner, target date. 3. **Fix** — link PRs in Notes; keep status `In Progress` until merged and verified. 4. **Verify** — re-test or vendor retest; set `Remediated` or `Accepted Risk` with rationale. 5. **Close** — never delete rows; append closure note in Notes. Allowed **Status** values: `Open`, `In Progress`, `Remediated`, `Accepted Risk`, `Deferred`. | Finding ID | Severity | Title | Status | Owner | Target date (UTC) | Verification | Notes | |-
**Headings:** Penetration test — remediation tracker; Workflow; Remediation table; CI hygiene; Related

#### `security/trust-center.md`
**Scope:** **Scope:** Redirect — canonical Trust Center body moved next to other buyer-facing GTM indexes.
**Title:** Trust Center (moved)
**Summary:** The consolidated buyer-facing Trust Center markdown now lives at **[`docs/go-to-market/trust-center.md`](../go-to-market/trust-center.md)** (same content; CI checks target that path).
**Headings:** Trust Center (moved)

### `support`

#### `support/TIER_1_RUNBOOK.md`
**Scope:** **Scope:** Tier-1 support runbook (10-minute first response) - full detail, tables, and links in the sections below.
**Title:** Tier-1 support runbook (10-minute first response)
**Summary:** Resolve or **triage** common ArchLucid issues without data mutation, using only **read** APIs, **health** probes, and **support bundle** collection. - Caller has an **operator URL**, **correlation id** from a failing request, and either **JWT** or **API key** (per `ArchLucidAuth`). - SQL connectivity is allowed from the operator’s network path for **`GET /health/ready`**. - **Do not DELETE** rows in **production** from tier-1. - **Do not** paste **secrets** into tickets — use [`archlucid support-bundle`](REPOSITORY_README.md) output **after** redaction (Bearer, `X-Api-Key`, connection secrets stripped in bundle writer). **Client** → **ArchLucid.Api** → **SQL** / **blob** / **optional Service Bus*
**Headings:** Tier-1 support runbook (10-minute first response); Objective; Assumptions; Constraints; Architecture overview; Component breakdown — ordered checks; Symptom rescue matrix; Data flow (failing run)

### `templates`

#### `templates/README.md`
**Scope:** **Scope:** Ready-to-submit `ArchitectureRequest` JSON examples for pilots — not the live API contract alone; see linked contract and ingestion docs.
**Title:** Architecture request templates
**Summary:** These files are **minimal valid** bodies for `POST /v1/architecture/request` (OpenAPI: `ArchitectureRequest`). Replace `requestId` if you need a stable idempotency key. | File | Summary | |------|---------| | [microservices-ecommerce.json](./microservices-ecommerce.json) | Container Apps–based e‑commerce platform (API gateway, catalog, orders, payments, notifications). | | [event-driven-iot.json](./event-driven-iot.json) | IoT telemetry ingestion, stream processing, tiered storage, and observability on Azure. | | [regulated-healthcare-api.json](./regulated-healthcare-api.json) | HIPAA-minded patient API with identity, auditing, encryption, and private networking posture. | Set `BASE` and `KE
**Headings:** Architecture request templates; Files; Submit with curl; CLI (`archlucid`); References

#### `templates/architecture-requests/README.md`
**Scope:** **Scope:** Copy-paste architecture request templates for `POST /v1/architecture/request` — same JSON shape as the repo-root example file.
**Title:** Architecture request templates
**Summary:** JSON files in this directory are **ready-to-send** payloads (or wizard import paste bodies) aligned with [`ArchitectureRequest`](../../../ArchLucid.Contracts/Requests/ArchitectureRequest.cs): `requestId`, `systemName`, `description`, `environment`, `cloudProvider`, plus optional lists such as `constraints`, `topologyHints`, and `securityBaselineHints`. | Template | Description | File | |----------|-------------|------| | **Enterprise RAG (reference)** | Secure Azure AI Search + SQL RAG pattern — canonical sample used in tests | [`../../../enterprise-rag-request.json`](../../../enterprise-rag-request.json) | | **Cloud migration assessment** | 3‑tier lift/replatform — App Service, Azure SQL, R
**Headings:** Architecture request templates; How to use

#### `templates/policy-packs/README.md`
**Scope:** **Scope:** Azure Well-Architected–analogue policy pack starter — import body and curl for `POST …/policy-packs`; not a Microsoft-certified WAF assessment artifact.
**Title:** Policy pack templates (`docs/templates/policy-packs`)
**Summary:** These files support **`POST /v1/governance/policy-packs`** (Administrator role; **Standard** commercial tier). | File | Role | |------|------| | [azure-well-architected-content.json](./azure-well-architected-content.json) | **`PolicyPackContentDocument`** only (what goes in **`initialContentJson`** if you assemble the request by hand). Uses existing **`saas-ctrl-00x`** keys from `templates/policy-packs/saas/`. | | [create-azure-waf-policy-pack.request.json](./create-azure-waf-policy-pack.request.json) | Full **`CreatePolicyPackRequest`** body for **`curl`** / REST clients. | **Important:** This mapping is **documentation and pilot convenience**—it is **not** an official Microsoft Azure Well-
**Headings:** Policy pack templates (`docs/templates/policy-packs`); Azure Well-Architected analogue (starter); Import with curl; Why reuse `saas-ctrl-*` keys?; References

### `testing`

#### `testing/MUTATION_TESTING_CRITICAL_PATHS.md`
**Scope:** **Scope:** Commit path + governance gate mutation testing — describes the scoped Stryker config, CI workflow, and human-readable notes; it is not the canonical OpenAPI or persistence contract.
**Title:** Mutation testing — commit integrity and pre-commit governance
**Summary:** Exercise **Stryker.NET** against code that affects **authority manifest commit** and the **optional pre-commit governance gate**, without mutating all of `ArchLucid.Application`. | Item | Value | |------|--------| | Config file (repo root) | [`stryker-config.application-commit-critical-paths.json`](../../stryker-config.application-commit-critical-paths.json) | | Scheduled CI label | **ApplicationCommitCriticalPaths** | | Mutate globs | `ArchLucid.Application/Governance/**/*.cs`, `AuthorityDrivenArchitectureRunCommitOrchestrator.cs`, `ManifestFinalizationService.cs` | | Test filter | Governance tests, `Runs/Finalization` tests, and orchestrator tests whose FQN matches `AuthorityDrivenArchitec
**Headings:** Mutation testing — commit integrity and pre-commit governance; Objective; Configuration; CI; Reporting; Why not rely on local runs only?

### `trust-center.md`

#### `trust-center.md`
**Scope:** **Scope:** Redirect — canonical Trust Center body lives under buyer go-to-market docs.
**Title:** Trust Center (moved)
**Summary:** The consolidated buyer-facing Trust Center markdown now lives at **[`docs/go-to-market/trust-center.md`](go-to-market/trust-center.md)** (same content; CI checks target that path).
**Headings:** Trust Center (moved)

### `ui`

#### `ui/DEMO_OPERATOR_DOM_SCAN.md`
**Scope:** **Scope:** Contributors and CI maintainers: documents the Playwright demo-readiness DOM scan that blocks leaked engineering tokens in customer-visible `main` content; not a general Playwright or operator UX guide.
**Title:** Demo-mode DOM token scan (Playwright)
**Summary:** Prevent internal engineering tokens from appearing in customer-visible `main` content when `NEXT_PUBLIC_DEMO_MODE` is enabled. - **`e2e/demo-readiness.spec.ts`** — `demo pages do not leak internal tokens in main content @demo-readiness` walks a fixed path list and asserts `innerText` does not match banned regexes (e.g. `undefined`, `fixture`, `localhost`, `Execute+`). - **False positives:** extend patterns carefully — e.g. `null` uses word boundaries to avoid matching unrelated words. - **Scope:** assertions target `role="main"` only; technical footers or collapsed developer tools may still mention implementation details by design.
**Headings:** Demo-mode DOM token scan (Playwright); Objective; Where it lives; Operational notes; Diagram (flow)

#### `ui/OPENAI_UI_ASSESSMENT_IMPLEMENTATION.md`
**Scope:** **Scope:** For engineers maintaining ArchLucid UI demo/showcase flows; summarizes what shipped for the OpenAI UI assessment path; not a product spec, roadmap, or buyer-facing guarantee.
**Title:** OpenAI UI Assessment — Implementation Notes
**Summary:** This note captures what was implemented for the OpenAI UI assessment demo path (operator + marketing). **Do not treat this as a product spec** — it is engineering bookkeeping. Improve screenshot/demo reliability, reduce misleading loading states, align marketing showcase copy with operator timelines, and tighten invalid-route handling. | Area | Behavior | |------|-----------| | **Teams integration** | Spinner only while loading *and* connection unresolved (`loading && !conn`), so errors are not buried under “Loading…”. | | **Demo builds** | Screenshot / mock E2E flows document `NEXT_PUBLIC_DEMO_MODE` / `NEXT_PUBLIC_DEMO_STATIC_OPERATOR` (see `archlucid-ui/README.md`, `playwright.mock.config.
**Headings:** OpenAI UI Assessment — Implementation Notes; Objective; What shipped (high level); Diagram (logical flow); Security / reliability / cost; Operational verification

### `whitepapers`

#### `whitepapers/state-of-ai-architecture-2026.md`
**Scope:** **Scope:** State of AI-Assisted Architecture Design (2026) - full detail, tables, and links in the sections below.
**Title:** State of AI-Assisted Architecture Design (2026)
**Summary:** **Status:** Draft for publication (Marketability Improvement 6). **Audience:** Enterprise architects, platform engineering leaders, and AI governance stakeholders. Frame how **AI-assisted architecture design** is moving from novelty demos to **governed, evidence-backed engineering**—and where products like ArchLucid sit in that shift. - Model capabilities continue to improve faster than most enterprises can operationalize them. - Regulated and safety-critical buyers will require **traceability**, **policy alignment**, and **human-in-the-loop** controls—not raw token output. - Vendor-neutral claims should be anchored to observable product behaviors (runs, manifests, approvals) rather than mod
**Headings:** State of AI-Assisted Architecture Design (2026); Objective; Assumptions; Constraints; Architecture overview; Component breakdown; Data flow; Security model

---

## Part 7 — Archive summary

Archive content is valuable but should be treated as historical evidence, not canonical documentation. The archive contains assessments, prompts, superseded onboarding material, previous refactoring notes, historical rename logs, and dated quality reports. It should have one index and be excluded from ordinary onboarding search paths.

### Largest archive documents

| File | Size KB |
|---|---:|
| `archive/assessments/ARCHLUCID_ASSESSMENT_WEIGHTED_READINESS_2026_05_06_INDEPENDENT__docs_library.md` | 40599.9 |
| `archive/NEXT_REFACTORINGS_ARCHIVE_2026_04_15.md` | 142.3 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_10_Independent_First_Principles_70_28.md` | 141.3 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_10_Independent_First_Principles_69_95.md` | 133.7 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_10_Independent_First_Principles_74_43.md` | 106.2 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_05_16.md` | 103.3 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_09_Independent_First_Principles_76_02.md` | 100.1 |
| `archive/assessments/ARCHLUCID_ASSESSMENT_WEIGHTED_READINESS_2026_05_06_FIRST_PRINCIPLES_73_67.md` | 97.2 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_24_INDEPENDENT_68_49.md` | 94.2 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_10_Independent_First_Principles_69_82.md` | 93.9 |
| `archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md` | 90.8 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_30_INDEPENDENT_D_65_32.md` | 82.8 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_25_INDEPENDENT_62_18.md` | 82.1 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_25_INDEPENDENT_61_91.md` | 81.9 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_28_INDEPENDENT_67_23.md` | 81.7 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_05_02_INDEPENDENT_FIRST_PRINCIPLES_66_58.md` | 79.7 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_24_INDEPENDENT_67_41.md` | 77.8 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_27_INDEPENDENT_67_89.md` | 77.6 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_25_INDEPENDENT_71_35.md` | 77.2 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_29_INDEPENDENT_74_19.md` | 77.1 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_28_INDEPENDENT_67_86.md` | 75.6 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_07_Independent_First_Principles_78_39.md` | 72.1 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_28_INDEPENDENT_67_28.md` | 71.7 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_29_INDEPENDENT_66_70.md` | 70.9 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_28_INDEPENDENT_66_25.md` | 70.3 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_05_01_INDEPENDENT_76_76.md` | 69.0 |
| `archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md` | 68.6 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_06_First_Principles_78_07.md` | 68.2 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_24_INDEPENDENT_65_99.md` | 66.5 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_06_Independent_First_Principles_76_35.md` | 66.2 |
| `archive/QUALITY_ASSESSMENT_2026_04_14.md` | 65.0 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_06_INDEPENDENT.md` | 62.9 |
| `archive/assessments/ARCHLUCID_ASSESSMENT_WEIGHTED_READINESS_2026_05_02_INDEPENDENT_FIRST_PRINCIPLES_73_24.md` | 62.7 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_07_Independent_First_Principles_79_24.md` | 62.4 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_26_INDEPENDENT_62_65.md` | 61.5 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_07_Independent_First_Principles_78_59.md` | 61.0 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_05_01_INDEPENDENT_68_20.md` | 60.6 |
| `archive/quality/2026-04-21-assessments/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21.md` | 60.0 |
| `archive/assessments/MARKETABILITY_ASSESSMENT_2026_04_18.md` | 56.7 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_28_INDEPENDENT_66_63.md` | 56.1 |
| `archive/quality/QUALITY_ASSESSMENT_2026_04_20_WEIGHTED_75_37.md` | 54.3 |
| `archive/assessments/ArchLucid_Assessment_Weighted_Readiness_2026_05_08_Independent_First_Principles_76_83.md` | 54.0 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_29_INDEPENDENT_73_52.md` | 53.5 |
| `archive/MARKETABILITY_ASSESSMENT_2026_04_15_PRE_M2.md` | 52.8 |
| `archive/agent-prompts/CURSOR_PROMPTS_GA_TASKS_27_32.md` | 51.9 |
| `archive/assessments/ARCHLUCID_ASSESSMENT_WEIGHTED_READINESS_2026_05_04_FIRST_PRINCIPLES.md` | 51.9 |
| `archive/quality/2026-04-23-doc-depth-reorg/QUALITY_ASSESSMENT_2026_04_14_WEIGHTED.md` | 51.7 |
| `archive/root-superseded-2026-05-01/USABILITY_SOLUTION_QUALITY_ASSESSMENT_2026_04_25_69_52.md` | 51.6 |
| `archive/assessments/QUALITY_ASSESSMENT_2026_04_29_INDEPENDENT_72_55.md` | 50.5 |

### Archive categories

- `assessments`: 83 files
- `quality`: 34 files
- `root-superseded-2026-05-01`: 5 files
- `agent-prompts`: 3 files
- `artifacts-phase3-2026-04-23`: 2 files
- `CHANGE_SET_55R_SUMMARY.md`: 1 files
- `CHANGE_SET_56R.md`: 1 files
- `CHANGE_SET_57R.md`: 1 files
- `CHANGE_SET_58R.md`: 1 files
- `CHANGE_SET_59R.md`: 1 files
- `FIRST_30_MINUTES.md`: 1 files
- `FIRST_5_DOCS.md`: 1 files
- `FIRST_FIVE_DOCS.md`: 1 files
- `FIRST_FIVE_DOCS_SUPERSEDED_2026_04_22.md`: 1 files
- `FIRST_RUN_WALKTHROUGH.md`: 1 files
- `FIRST_RUN_WIZARD.md`: 1 files
- `IMPROVEMENTS_COMPLETE_2026_04_21.md`: 1 files
- `INSTALL_ORDER.md`: 1 files
- `MARKETABILITY_ASSESSMENT_2026_04_15_PRE_M2.md`: 1 files
- `MARKETABILITY_ASSESSMENT_2026_04_15_PRE_M3.md`: 1 files
- `MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY_PRE_IMP2_6.md`: 1 files
- `MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY_PRE_TRUST_CENTER.md`: 1 files
- `NAVIGATOR.md`: 1 files
- `NEXT_REFACTORINGS_ARCHIVE_2026_04_15.md`: 1 files
- `ONBOARDING_CONTRIBUTOR_ONBOARDING_2026_04_17.md`: 1 files
- `ONBOARDING_GOLDEN_CHANGE_PATH_2026_04_17.md`: 1 files
- `ONBOARDING_GOLDEN_PATH_2026_04_17.md`: 1 files
- `ONBOARDING_HAPPY_PATH_2026_04_17.md`: 1 files
- `ONBOARDING_PILOT_GUIDE_2026_04_17.md`: 1 files
- `ONBOARDING_START_HERE_2026_04_17.md`: 1 files
- `PENDING_QUESTIONS_RESOLVED_HISTORY.md`: 1 files
- `PRODUCT_PACKAGING_THREE_LAYERS_2026_04_23.md`: 1 files
- `QUALITY_ASSESSMENT.md`: 1 files
- `QUALITY_ASSESSMENT_2026_04.md`: 1 files
- `QUALITY_ASSESSMENT_2026_04_14.md`: 1 files
- `README.md`: 1 files
- `READ_THIS_FIRST.md`: 1 files
- `TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md`: 1 files
- `dual-pipeline-navigator-superseded.md`: 1 files

---

## Appendix A — Full current-folder file counts

- `library`: 217 Markdown files
- `go-to-market`: 91 Markdown files
- `runbooks`: 64 Markdown files
- `architecture`: 44 Markdown files
- `security`: 40 Markdown files
- `integrations`: 31 Markdown files
- `quality`: 9 Markdown files
- `engineering`: 8 Markdown files
- `deployment`: 6 Markdown files
- `onboarding`: 6 Markdown files
- `demo`: 3 Markdown files
- `evidence`: 3 Markdown files
- `templates`: 3 Markdown files
- `artifacts`: 2 Markdown files
- `compliance`: 2 Markdown files
- `operations`: 2 Markdown files
- `ui`: 2 Markdown files
- `ARCHITECTURE_ON_ONE_PAGE.md`: 1 Markdown files
- `BUYER_FIRST_30_MINUTES.md`: 1 Markdown files
- `CHANGELOG.md`: 1 Markdown files
- `CONTRIBUTOR_ON_ONE_PAGE.md`: 1 Markdown files
- `CORE_PILOT.md`: 1 Markdown files
- `PENDING_QUESTIONS.md`: 1 Markdown files
- `READ_THIS_FIRST.md`: 1 Markdown files
- `START_HERE.md`: 1 Markdown files
- `TROUBLESHOOTING.md`: 1 Markdown files
- `assessments`: 1 Markdown files
- `brand`: 1 Markdown files
- `data-consistency`: 1 Markdown files
- `diagrams`: 1 Markdown files
- `explainability`: 1 Markdown files
- `performance`: 1 Markdown files
- `samples`: 1 Markdown files
- `support`: 1 Markdown files
- `testing`: 1 Markdown files
- `trust-center.md`: 1 Markdown files
- `whitepapers`: 1 Markdown files

## Appendix B — Terms to standardize

| Avoid / constrain | Prefer | Reason |
|---|---|---|
| run | architecture review / review package | Run is implementation language and conflicts with buyer-facing review vocabulary. |
| pipeline | review workflow / lifecycle | Pipeline sounds internal/CI-oriented. |
| warning | monitored risk / finding | Warning sounds like compiler or system health output. |
| raw manifest line diff | technical comparison appendix | Raw diff language belongs in advanced/auditor contexts. |
| mutation | material change | Mutation is API/database terminology. |
| replay | audit review / evidence trail | Replay sounds like test harness language. |
| connected workspace | configured enterprise workspace | Connected workspace can imply demo incompleteness. |
| fixture | sample / illustrative data | Fixture is test-data language. |
