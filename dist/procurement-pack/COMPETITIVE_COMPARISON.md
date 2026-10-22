> **Scope:** Procurement-facing competitive comparison — category-level contrasts only; ArchLucid claims grounded in shipped product docs (`docs/library/V1_SCOPE.md`, `docs/go-to-market/POSITIONING.md`). No competitor logos or trademarks.

# Competitive comparison — procurement pack

**Audience:** Security, architecture, and sourcing reviewers evaluating ArchLucid against common incumbent patterns.

**Last reviewed:** 2026-05-10

**How to use this doc**

- Treat competitor descriptions as **typical patterns** for each category — implementations vary by organization.
- **Do not** quote cells below as factual statements about a named vendor without confirming against that vendor’s own materials.

**Related:** [`POSITIONING.md`](POSITIONING.md) (value proposition), [`COMPETITIVE_LANDSCAPE.md`](COMPETITIVE_LANDSCAPE.md) (market-level matrices), [`ENTERPRISE_COMPARISON_ONE_PAGE.md`](ENTERPRISE_COMPARISON_ONE_PAGE.md) (short procurement PDF source).

---

## 1. Where each category tends to excel

| Category | What organizations usually get right |
|---------|--------------------------------------|
| **Manual architecture review + general-purpose documentation portals** | Flexible narratives, stakeholder familiarity, low incremental license friction when portals already exist, embedding diagrams and meeting notes beside prose. |
| **Diagram-first collaboration tools** | Fast visual alignment across teams, whiteboarding rituals, accessible canvases for workshops and lightweight inventories when fidelity requirements are modest. |
| **Enterprise GRC and IT governance suites** | Control libraries, workflow enforcement for attestations, linkage into broader risk registers when platforms are already the system of record for controls and exceptions. |

---

## 2. Capability matrix (ArchLucid vs three incumbent patterns)

Legend — **ArchLucid** cells summarize shipped posture documented for V1; **category** cells describe typical gaps or partial coverage **without** asserting what any particular product guarantees.

| Dimension | ArchLucid (evidence-backed) | Manual review + documentation portals | Diagram-first collaboration | Enterprise GRC / IT governance suites |
|-----------|-----------------------------|--------------------------------------|-----------------------------|-------------------------------------|
| **Structured output (manifest vs freeform)** | Golden manifest and synthesized artifacts as structured outputs from an authority run (see `POSITIONING.md`, `V1_SCOPE.md`). | Output shape follows templates and author discipline; structure varies by author and project phase. | Visual graphs and sticky-note semantics dominate; export formats vary and rarely equal a single canonical manifest for downstream gates. | Structured control records and attestations; architecture-specific manifest semantics are usually out of scope unless custom-built. |
| **Evidence trail** | Explainability traces on findings, citations into aggregate explanations, provenance graph surfaces (see `POSITIONING.md` pillars). | Evidence lives in attachments, comments, and tribal knowledge; retrieval depends on search hygiene. | Workshop artifacts capture intent; lineage to committed architecture decisions is typically manual. | Evidence attachments on controls exist; automated linkage from AI-assisted architecture findings is not the default pattern. |
| **Governance gate** | Pre-commit governance gate, policy packs, approvals with segregation-of-duties patterns documented for V1 (`POSITIONING.md`). | Governance relies on boards, checklists, and sign-off emails; enforcement is procedural. | Informal consensus during sessions; hard gates usually live outside the diagram tool. | Strong where controls and workflows are modeled; architecture manifest gates often require integration work. |
| **Typed findings** | Findings engines produce typed severities and structured finding payloads consumed by operator surfaces (`COMPETITIVE_LANDSCAPE.md` §3 summary). | Findings are prose bullets or slide bullets; consistent typing across teams requires manual standards. | Risks are annotated visually or in notes; typed, machine-checkable finding models are uncommon without separate tooling. | Risk issues are typed within GRC schemas; architecture-agent findings are not native unless mirrored manually. |
| **Comparison / replay** | Documented comparison and replay flows for authority runs (see `COMPETITIVE_LANDSCAPE.md` §3 — comparison and drift). | Diffing packages is manual (documents, slides); reproducibility depends on version control discipline outside portals. | Side-by-side canvases are manual; deterministic replay of an architecture analysis pipeline is out of band. | Configuration audits compare controls over time; architecture iteration diff is not the primary primitive. |
| **API-first** | REST `/v1` contract documented (`docs/library/API_CONTRACTS.md`); clients and UI consume the same surfaces. | Portal APIs exist but assembly into an architecture proof pipeline is custom integration work. | APIs skew toward content export and workspace automation; substituting for an authority API is non-standard. | Strong APIs for tickets and controls; modeling ArchLucid-class authority runs is typically bespoke. |
| **Audit trail** | Typed audit events with append-only persistence called out in positioning (`POSITIONING.md`). | Audit depends on portal history, backups, and records management policies; completeness varies. | Activity logs focus on collaboration actions; architecture-decision audit equivalence requires supplemental records. | Enterprise-grade audit for governance actions; capturing AI-assisted architecture reasoning needs deliberate scope. |
| **Cost model transparency** | Pilot-facing instrumentation and procurement-facing narratives reference metered LLM usage and hosted economics (`POSITIONING.md`, pilot docs); token budgets and quotas appear in product literature. | Labor cost dominates; LLM spend may appear elsewhere as shadow IT. | Seat-based SaaS is common; incremental inference spend for architecture agents is usually absent. | Platform licensing dominates; variable inference tied to architecture agents is typically out of scope. |

---

## 3. ArchLucid differentiation summary (fact-only)

- **Structured authority outputs:** Committed runs anchor a **golden manifest** and associated artifacts rather than free-form pages alone.
- **Explainability and lineage:** Findings carry structured explainability metadata; provenance and citation-bound explanations are first-class surfaces (`POSITIONING.md`).
- **Governance + audit depth:** Policy packs, approval paths, pre-commit gates, and durable audit events are part of the shipped story (`POSITIONING.md`, `COMPETITIVE_LANDSCAPE.md` §3).
- **Deterministic and comparative workflows:** Simulator modes and comparison/replay capabilities support regression-style discipline (`COMPETITIVE_LANDSCAPE.md` §3).

---

## 4. FAQ — “Why not just use [X]?”

### Why not rely on manual architecture review and general-purpose documentation portals?

Manual review remains valuable for judgment calls ArchLucid does not replace. ArchLucid targets **repeatable, evidence-linked architecture reviews** with typed findings, manifests, comparison/replay, and durable audit events — reducing variance when teams scale reviews beyond a small senior cohort.

### Why not standardize on diagram-first collaboration tooling?

Diagram-centric workflows excel at **alignment and visualization**. They rarely substitute for a **canonical manifest**, structured finding types, governance gates tied to manifest commit, or deterministic replay of an analysis pipeline — the combination ArchLucid documents as its core proof package (`POSITIONING.md`).

### Why not satisfy procurement using only our enterprise GRC or IT governance suite?

GRC suites are strong **systems of record for controls and attestations**. They generally do not ship ArchLucid’s **multi-agent architecture analysis pipeline**, explainability traces per finding, or golden-manifest-centric comparison flows without substantial custom integration. ArchLucid is positioned as the **architecture proof engine** feeding evidence into broader governance programs (`POSITIONING.md`, category definition).

### Why not depend solely on free cloud-provider posture assessments?

Cloud-native posture tools deliver **platform-specific recommendations** with variable depth and scope. ArchLucid’s documented scope is **multi-agent architecture review** across topology, cost, compliance, and critique dimensions with exports and governance hooks (`COMPETITIVE_LANDSCAPE.md` §2.2 contrast vs cloud tools — cloud rows describe narrow cloud scope).

---

## 5. Limits of this document

- Category rows describe **common patterns**, not guarantees about any deployment.
- ArchLucid claims above trace to **`POSITIONING.md`**, **`COMPETITIVE_LANDSCAPE.md` §3**, and **`V1_SCOPE.md`** — refresh this page when those sources change materially.
