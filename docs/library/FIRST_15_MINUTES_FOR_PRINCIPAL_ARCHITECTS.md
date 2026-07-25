> **Scope:** One-page expert lane for principal architects under time pressure — compresses ceremony without replacing canonical operator paths; audience is customer-facing evaluators, not a contributor reference.

# First 15 minutes for principal architects

**Audience:** Principal / staff architects evaluating ArchLucid — daily frontier-AI users with low patience for process overhead.  
**Not for:** naive operators (use [`FIRST_HOUR_OPERATOR_PATH.md`](FIRST_HOUR_OPERATOR_PATH.md)), contributors (use [`../engineering/FIRST_30_MINUTES.md`](../engineering/FIRST_30_MINUTES.md)), or sponsor-led procurement walks.

**Canonical depth stays elsewhere** — this page is a **focused expert lane** only. Do not remove or replace [`CANONICAL_FIRST_RUN_PATH.md`](CANONICAL_FIRST_RUN_PATH.md), [`CORE_PILOT.md`](../CORE_PILOT.md), or [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

**Timing validation:** GTM backlog **M-44 (V1.1)** — observed first-session cohort measures whether experts hit the step-4 checkpoint within 15 minutes without facilitator narration.

---

## Objective (one)

**Produce one committed finding you would raise in a real architecture review — or stop at minute 12 and record why ArchLucid did not beat your frontier-AI workflow.**

Success is **decision signal**, not completing every UI surface.

---

## Seven steps (15-minute box)

| # | Action | Time box | Success signal |
| --- | --- | --- | --- |
| **1** | Open **`/reviews/new`** with your architecture brief ready (paste text or upload evidence). Decline feature tours. | 0–2 min | Review request admitted |
| **2** | Submit **minimal intake** — answer MUST questions only; skip optional governance and policy-pack fields. | 2–5 min | `runId` captured |
| **3** | **Execute** the review. Stay on the run detail page — do not open Operate, Graph, Compare, or Governance routes. | 5–12 min | Findings list visible |
| **4** | **STOP-IF-VALUE-NOT-SEEN checkpoint** — see below. | 12–13 min | Pass → step 5; Fail → stop |
| **5** | **Commit** the manifest — only if step 4 passed. | 13–14 min | `goldenManifestId` present |
| **6** | Locate the **sponsor export** or architecture package — unaided. | 14–15 min | Sendable artifact path found |
| **7** | *(Optional)* Walk **one** finding's evidence trail — only when step 4 was marginal. | ≤15 min total | Evidence chain stronger than raw AI output |

---

## Step 4 — STOP-IF-VALUE-NOT-SEEN (mandatory)

At **minute 12**, scan the top three findings and answer **both**:

1. Is at least **one** finding **non-obvious** — something you had not already concluded from the brief alone?
2. Does that finding link to an **evidence trail** you could defend to a sponsor?

| Result | Action |
| --- | --- |
| **YES to both** | Continue to commit (steps 5–6). |
| **NO to either** | **Stop.** Do not commit. Record primary dismissal code **D1** (equivalent to frontier AI) or **D7** (finding quality doubt) per [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](../go-to-market/FIRST_SESSION_DISMISSAL_PLAYBOOK.md). File [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](../go-to-market/validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md). |

This checkpoint prevents ceremony completion without value signal — the most common expert dismissal pattern.

---

## Explicitly skip (first 15 minutes)

| Skip | Why |
| --- | --- |
| Operate: Graph, Compare, Replay | Not required for first value signal |
| Governance dashboards and policy-pack configuration | Deep links below — use after commit |
| ROI baseline scorecard and procurement pack | Post-handoff only |
| Azure extractor setup when brief + uploads suffice | Evidence-only path: [`CORE_PILOT.md`](../CORE_PILOT.md) § Evidence-only |
| Reading full V1 scope or integration catalog | Expert lane assumes platform is already provisioned |

---

## Optional deep links (after step 4 passes or after commit)

| Topic | Doc |
| --- | --- |
| Evidence trail / audit rows for one finding | [`../go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) |
| Governance gates and policy packs | [`PRODUCT_PACKAGING.md`](PRODUCT_PACKAGING.md) · [`../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) |
| Sponsor packet and export labels | [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) |
| Full seven-step canonical pilot | [`CANONICAL_FIRST_RUN_PATH.md`](CANONICAL_FIRST_RUN_PATH.md) |
| One-sitting timing narrative (operators) | [`../runbooks/FIRST_CREDIBLE_REVIEW_ONE_SITTING.md`](../runbooks/FIRST_CREDIBLE_REVIEW_ONE_SITTING.md) |
| First-session observation protocol | [`../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) |

---

## Related paths (do not duplicate)

| Path | When to use instead |
| --- | --- |
| [`FIRST_HOUR_OPERATOR_PATH.md`](FIRST_HOUR_OPERATOR_PATH.md) | New tenant operator — four-step first hour |
| [`MINIMUM_VIABLE_PILOT_SUCCESS.md`](MINIMUM_VIABLE_PILOT_SUCCESS.md) | Naive operator — five-step guided intake |
| [`HOSTED_PILOT_SINGLE_PATH.md`](HOSTED_PILOT_SINGLE_PATH.md) | Platform engineer — strict RC script path |
| [`CANONICAL_FIRST_RUN_PATH.md`](CANONICAL_FIRST_RUN_PATH.md) | Full pilot with proof scripts and sponsor-send gates |
