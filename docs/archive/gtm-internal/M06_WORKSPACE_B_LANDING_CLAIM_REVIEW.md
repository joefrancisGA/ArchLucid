> **Reviewed:** 2026-07-24 — archived from `docs/go-to-market/` (closed M-06 / G-REAL-04 deliverable).

> **Scope:** M-06 / G-REAL-04 deliverable — mechanical claim-vs-copy review of Workspace B sample report output against landing-page and positioning claims. **Agent review date:** 2026-07-03. **Owner final sign-off:** **Done 2026-07-19** — landing claims accepted as sufficiently aligned for outreach; optional live DOCX visual check waived. Follow-ups routed: **C8** → M-09 remainder (use-case-card routing fix), **C4** → M-111 (demo-script footnote).

# M-06 — Workspace B sample report vs landing-page claims

**Task:** `M-06` / `G-REAL-04` — confirm Workspace B sample architecture review report section coverage matches landing-page narrative.

**Reviewer:** coding agent (Sonnet-tier mechanical diff). **Sources inspected (no live UI session):**

| Source | Role |
|--------|------|
| `docs/go-to-market/POSITIONING.md` | Positioning statement + proof-point table |
| `docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md` §3 | Three value pillars |
| `archlucid-ui/src/components/marketing/welcome-marketing-copy.ts` | Hero, workflow, use-case cards |
| `archlucid-ui/src/components/marketing/WelcomeMarketingPage.tsx` | Homepage pillar structure |
| `ArchLucid.Application/Bootstrap/RegulatedScenarioWorkspaceSeed.cs` | Workspace B manifest + 9 findings |
| `ArchLucid.Application/Bootstrap/DemoSeedService.cs` | Export artifact + whitelabel pre-fill |
| `fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json` | `expectedCommittedFindingCount: 9` |
| `docs/go-to-market/DEMO_WORKSPACES.md` | Workspace B storyline + export contract |

**Workspace B anchors:** run `61c60d76-2b80-93f9-46bb-2f66fd608b9b` · export stub `meridian-alpine-governance-board-sample.md` · whitelabel **Meridian Advisory Group** / **Alpine Health — AI Governance Engagement**.

---

## 1. Landing / positioning claims extracted

| ID | Claim (buyer-facing) | Source |
|----|----------------------|--------|
| C1 | **Defensible architecture, on demand** — prioritized, evidence-linked review with exportable report | `POSITIONING.md` §1, homepage H1 |
| C2 | **Explicit limits** where the system does not conclude | `POSITIONING.md` §1, `WELCOME_HERO_PITCH` |
| C3 | **Six-stage workflow** Capture → Evidence → Review → Findings → Decisions → Report | `WELCOME_WORKFLOW_STEPS` |
| C4 | **Pillar 1 — AI-native analysis:** multi-agent pipeline (Topology, Cost, Compliance, Critic) → versioned architecture package + structured findings | `EXECUTIVE_SPONSOR_BRIEF.md` §3, homepage pillar 1 |
| C5 | **Pillar 2 — Auditable decision trail:** evidence chain, rules applied, decisions taken; provenance — not "AI said so" | Brief §3, homepage pillar 2 |
| C6 | **Pillar 3 — Enterprise governance:** policy packs, approval workflow, pre-finalize gate, SLA, typed audit events | Brief §3, homepage pillar 3 |
| C7 | **Use case — AI governance + security baseline** on bundled policy packs | `WELCOME_USE_CASE_CARDS[0]` |
| C8 | **Use cases — Azure WAF** and **Azure CAF / landing zone** thematic packs (with disclaimer: not certification) | `WELCOME_USE_CASE_CARDS[1–2]`, `WELCOME_POLICY_PACK_DISCLAIMER` |
| C9 | **Report export:** DOCX/PDF and whitelabeled packages for ARB / audit / procurement | `WELCOME_WORKFLOW_STEPS` (Report stage) |
| C10 | **Consultant whitelabel** export (firm name, engagement title, logo reference) | `DEMO_WORKSPACES.md` Workspace B §Whitelabel |
| C11 | **Regulated / healthtech narrative** without real PHI | `DEMO_WORKSPACES.md`, seed governance tags |

---

## 2. What Workspace B report output actually contains

| Output surface | Shipped content (fixture-backed) |
|----------------|----------------------------------|
| **Committed findings** | **9** findings (`demo-workspaces.fixture.manifest.json`): mix of Error / Warning / Info; themes **AI governance** (`ai-governance-responsible-ai-v1`) and **security baseline** (`security-baseline-v1`) |
| **Policy linkage** | Each finding carries `PolicyRuleId` (e.g. `ai-gov-002`, `sec-base-006`) + rationale text |
| **Human decisions** | Multiple findings include `HumanReviewStatus`, `ReviewNotes`, dispositions (REMEDIATE, ACCEPT_RISK, WAIVE_CONDITIONAL, DEFER) — demonstrates decision stage |
| **Manifest / governance block** | Tags: `HIPAA-aligned-synthetic`, `AI-Governance-Pack-A`, `Security-Baseline-Pack-B`, `PHI-prohibited-evaluator-tenant`; required controls list |
| **Export artifact (seed)** | Markdown scaffold `meridian-alpine-governance-board-sample.md` — whitelabel firm/engagement/logo reference strings |
| **Export pre-fill JSON** | `dbo.RunExportRecords.AnalysisRequestJson` mirrors `ReviewBoardWhitelabel*` fields for tooling/UI pre-fill |
| **Pending / open items** | 3 findings remain `HumanReviewStatus.Pending` — supports "explicit limits" narrative |

**Not in Workspace B seed (by design):** live multi-agent execution traces for each finding (engines are `AiGovernanceSeed` / `SecurityBaselineSeed`); WAF- or CAF-named finding categories; a pre-generated Meridian/Alpine DOCX binary in-repo (samples under `docs/go-to-market/samples/` use Contoso/Northwind branding).

---

## 3. Claim reconciliation matrix

| Claim | Verdict | Evidence / gap |
|-------|---------|----------------|
| **C1** Defensible, prioritized, evidence-linked, exportable | **MATCH** | 9 severitized findings with policy rule IDs + rationales; export stub + whitelabel hints present |
| **C2** Explicit limits | **MATCH** | Pending human-review findings; manifest policy constraints state synthetic/PHI-free boundaries |
| **C3** Six-stage workflow | **PARTIAL** | Findings + decisions + report export stages demonstrated; Capture/Evidence/Review stages are implied by committed run + manifest graph, not spelled out as section headers in the markdown export stub |
| **C4** Multi-agent AI-native analysis | **PARTIAL (demo honesty)** | Marketing is accurate for product capability; Workspace B demo findings are **seed-backed**, not live Topology/Cost/Compliance/Critic traces — narrate as "curated demo storyline" in sales calls |
| **C5** Auditable decision trail | **MATCH** | PolicyRuleId + rationale + reviewed dispositions on findings; provenance surfaces exist on run detail (not re-validated in this doc pass) |
| **C6** Enterprise governance | **PARTIAL** | Policy-pack themes drive findings; approval workflow / pre-finalize gate / SLA not exercised in this single finalized demo run — pillar is product-true, not fully dramatized in Workspace B export stub alone |
| **C7** AI governance + security baseline use case | **MATCH** | Primary Workspace B storyline; finding themes and governance tags align |
| **C8** Azure WAF + CAF/LZ use cases | **MISMATCH (scope, not product lie)** | Homepage cards promise WAF/CAF **pack themes**; Workspace B does **not** showcase WAF/CAF-specific findings — disclaimer covers certification, not demo routing. **Recommendation:** link AI governance card to Workspace B URL; keep WAF/CAF claims tied to bundled packs + Workspace A / policy-pack docs, not Workspace B |
| **C9** DOCX/PDF export | **PARTIAL** | Product ships DOCX/PDF (`IDocxExportService`, samples in `docs/go-to-market/samples/`); Workspace B seed ships **markdown scaffold** + whitelabel pre-fill — operator must invoke export for full DOCX |
| **C10** Consultant whitelabel | **MATCH** | Meridian Advisory / Alpine Health strings in seed artifact + `AnalysisRequestJson` hints |
| **C11** Regulated narrative, no real PHI | **MATCH** | Synthetic labels; `PHI-prohibited-evaluator-tenant` tag; `DEMO_WORKSPACES.md` explicit |

**Summary:** **7 MATCH**, **4 PARTIAL** (expected demo limitations), **1 MISMATCH** (WAF/CAF demo routing vs Workspace B — copy/routing issue, not a missing product capability).

---

## 4. Actionable follow-ups (engineering / copy — not M-06 blockers)

| Priority | Item | Owner |
|----------|------|-------|
| P2 | Add homepage cross-link: **AI governance + security baseline** card → Workspace B canonical URL (`/reviews/61c60d76-…`); keep WAF/CAF cards pointed at policy-pack docs / Workspace A | Marketing / UI — **tracked in M-09 remainder (2026-07-19)** |
| P3 | Optional: generate Meridian/Alpine DOCX sample alongside Contoso samples in `docs/go-to-market/samples/` | GTM / engineering — **not tracked (2026-07-19)**: superseded by **M-93** live dogfood sample |
| P3 | Demo script footnote: Workspace B = seed-backed storyline; live agent traces shown on Workspace A or real pilot | GTM — **tracked as M-111 (2026-07-19)** |

None of the partial/mismatch rows block outreach once narrated honestly; the thematic-mapping disclaimer already covers C8 certification scope.

---

## 5. M-06 completion status

| Work unit | Status | Notes |
|-----------|--------|-------|
| **Agent mechanical review** (this document) | **Done** 2026-07-03 | Claim extraction + reconciliation against seed/fixture sources |
| **Owner download + visual review** of live export (DOCX/PDF from architect workspace) | **Waived** 2026-07-19 → tracked as **G-REAL-09** | ~10-min check from `/reviews/61c60d76-…` before first live demo (M-19) / video recording (M-16); full step-by-step in `GTM_BACKLOG.md` **G-REAL-09** — not required for M-07/M-09 unblock |
| **Owner sign-off** | **Done** 2026-07-19 | Landing claims accepted as sufficiently aligned for outreach; §4 follow-ups routed to M-09 (C8 routing fix) and M-111 (C4 demo-script footnote) |

---

## 6. Verdict for GTM

Workspace B sample output **supports** the homepage narrative for **AI governance + security baseline**, **evidence-linked findings**, **decision dispositions**, and **whitelabel export** — with expected demo limitations on live multi-agent traces and pre-generated DOCX. The only routing mismatch is pointing WAF/CAF use-case curiosity at Workspace B instead of policy-pack docs or Workspace A.

**Recommended owner action:** sign off M-06 after reading §3–§4, or run one live DOCX export from `/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b` if visual confirmation is desired.
