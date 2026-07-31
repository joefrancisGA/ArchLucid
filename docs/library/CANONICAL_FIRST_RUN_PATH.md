> **Reviewed:** 2026-07-31

> **Scope:** Single canonical minimum viable first-run path for V1 pilot operators (seven mandatory steps), plus the architect-workspace first-review UI walkthrough (formerly the body of `FIRST_RUN_WALKTHROUGH.md`; that filename remains a path-stable alias), the controlled-pilot first-run proof checklist (formerly the body of `CONTROLLED_PILOT_FIRST_RUN_CHECKLIST.md`; that filename remains a path-stable alias), the hosted-pilot strict single-path quickstart (formerly the body of `HOSTED_PILOT_SINGLE_PATH.md`; that filename remains a path-stable alias), and the expert principal-architect 15-minute lane (formerly the body of `FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md`; that filename remains a path-stable alias for **M-44** / **M-180** callers). Audience is customer-facing operator onboarding, not a contributor reference.

# Canonical first-run path (V1 pilot)

**Audience:** Buyer operators, design partners, and sales engineers running the first architecture review.

**Last reviewed:** 2026-07-31

**Operational detail:** [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)  
**First-hour operator contract (four steps):** [`FIRST_HOUR_OPERATOR_PATH.md`](FIRST_HOUR_OPERATOR_PATH.md)  
**Architect UI walkthrough (`/reviews/new`):** [`#first-architecture-review-walkthrough`](#first-architecture-review-walkthrough) (`FIRST_RUN_WALKTHROUGH.md` alias)  
**Expert principal-architect lane (15 min):** [`#expert-principal-architect-15-minute-lane`](#expert-principal-architect-15-minute-lane) (`FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md` alias)  
**Hosted / strict RC single path:** [`#hosted-pilot-single-path`](#hosted-pilot-single-path) (`HOSTED_PILOT_SINGLE_PATH.md` alias)  
**Integration commitments (V1 vs V1.1):** [`../go-to-market/INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md) § Commitment boundary  
**Contributor/engineer path (not customer):** [`../engineering/FIRST_30_MINUTES.md`](../engineering/FIRST_30_MINUTES.md)

---

## Seven mandatory steps

| Step | Action | Command / surface | Success signal |
| --- | --- | --- | --- |
| **1** | Confirm platform prerequisites | `.\scripts\Test-ArchLucidPrerequisites.ps1 -Profile FirstPilotMinimum` | No **BLOCK** rows |
| **2** | Run first-run preflight | `dotnet run --project ArchLucid.Cli -- --json pilot preflight` | No **BLOCK** rows |
| **3** | Readiness-only proof (no finalized architecture package yet) | `.\scripts\collect-first-pilot-proof.ps1` | `first-pilot-command-center.md` shows phased status |
| **4** | Sign in and start one architecture review | Architect workspace `/reviews/new` or `POST /v1/architecture/request` | `runId` captured |
| **5** | Finalize the architecture package | `POST /v1/architecture/run/{runId}/commit` (or UI Finalize) | `goldenManifestId` present |
| **6** | Collect committed-run proof | `.\scripts\collect-first-pilot-proof.ps1 -RunId <runId>` | `first-pilot-evidence/first-value-report.md` attached |
| **7** | Sponsor handoff only when SEND-eligible | `.\scripts\collect-first-pilot-proof.ps1 -RunId <runId> -SponsorHandoff -FailOnHold` | `sponsorPacketDisposition` not **HOLD**; `sendEligible` true |

Stop at step 3 when the environment is not ready. Do not sponsor-send until step 7 passes with **COMPLETE** ROI baseline completeness (see [`QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy)).

---

## One script entry point

```powershell
.\scripts\Run-CanonicalFirstPilotPath.ps1 -Phase Readiness
.\scripts\Run-CanonicalFirstPilotPath.ps1 -Phase CommittedProof -RunId '<run-guid>'
.\scripts\Run-CanonicalFirstPilotPath.ps1 -Phase SponsorHandoff -RunId '<run-guid>' -FailOnHold
```

---

## First architecture review walkthrough {#first-architecture-review-walkthrough}

Former standalone body: `docs/library/FIRST_RUN_WALKTHROUGH.md` → this section (filename kept as a path-stable alias). Linear **UI** checklist for creating the first architecture review at **`/reviews/new`** — complements the [seven mandatory steps](#seven-mandatory-steps) (scripted proof path) without screenshots.

**Path-stable alias:** [`FIRST_RUN_WALKTHROUGH.md`](FIRST_RUN_WALKTHROUGH.md).

**Last reviewed:** 2026-07-31

### Objective

Give architects a **linear checklist** for creating the first **architecture review** using **New architecture review** at **`/reviews/new`** (legacy **`/runs/new`** may redirect), without relying on screenshots (which go stale quickly).

### Assumptions

- The UI is available at **`/reviews/new`** (see **[`FIRST_RUN_WIZARD.md`](FIRST_RUN_WIZARD.md)** for design intent).
- Sign-in works for your tenant — see **[Authentication and sign-in](/help/authentication-sign-in)** and **[Pilot guide](/help/pilot-guide)**.

### Constraints

- This walkthrough does not replace **[`LIVE_E2E_HAPPY_PATH.md`](LIVE_E2E_HAPPY_PATH.md)** for HTTP-level scripted parity or **[`onboarding/day-one-developer.md`](../onboarding/day-one-developer.md#following-the-request-past-create-execute--commit--retrieval--ask)** for the request-to-answer narrative spine.

### Steps

1. **Open the workspace** — Sign in with work/school account, email one-time code, or your organization's SSO.
2. **Navigate to New architecture review** — Use **`/reviews/new`** or the primary nav entry **New architecture review**.
3. **Pick a preset or template** — Choose the closest sample if you are evaluating; customize fields only where you have real system facts.
4. **Complete each wizard step** — Advance only when required fields validate; note inline errors reference a correlation id when the UI surfaces API failures — see **[Troubleshooting](/help/troubleshooting)**.
5. **Submit** — Capture the returned review id from the success path or **Reviews** list.
6. **Execute and finalize** — From **review detail**, drive **Execute**, then **Finalize** when the pipeline reports **Ready to finalize** — see **[Workspace navigation](/help/pilot-nav-profile)**.
7. **Verify the architecture package** — Confirm the signed review record and artifacts appear; use **Compare**/**Replay** only after you have two finalized packages or an export need — see **[Architecture packages](/help/review-packages)**.
8. **Attach to your workflow (optional)** — After finalize, collect sponsor proof per **[Pilot guide](/help/pilot-guide)** when your team uses GitHub or Azure DevOps handoff.

<details>
<summary>Administrator details — CLI and HTTP</summary>

- Create path may call **`POST /v1/architecture/request`** (API still uses `run` identifiers).
- Proof collectors: **`collect-first-pilot-proof.ps1`** and workflow handoff docs under `docs/runbooks/`.
- Contributor shell patterns: [`operator-shell.md`](operator-shell.md).

</details>

### Related (UI walkthrough)

- **[Your first architecture review](/help/core-pilot)** — guided first-session checklist.
- **[`FIRST_RUN_WIZARD.md`](FIRST_RUN_WIZARD.md)** — design and UX notes.
- **[Pilot guide](/help/pilot-guide)** — pilot-facing scope and support boundaries.
- **[Workspace navigation](/help/pilot-nav-profile)** — sidebar and first-review path.
- [Seven mandatory steps](#seven-mandatory-steps) — scripted proof / sponsor-handoff path.

---

## Secondary (not first-run)

Operate compare/replay/graph lanes, V1.1 connectors, MCP, marketplace checkout, and broad integration catalog reading are **out of scope** for the default first run. See [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) § Ignore for first pilot.

---

## Expert principal-architect 15-minute lane {#expert-principal-architect-15-minute-lane}

Former standalone body: `docs/library/FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md` → this section (filename kept as a path-stable alias for **M-44** / **M-180** / **M-181** callers). One-page expert lane for principal architects under time pressure — compresses ceremony without replacing the [seven mandatory steps](#seven-mandatory-steps).

**Path-stable alias:** [`FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md`](FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md).

**Last reviewed:** 2026-07-31

**Audience:** Principal / staff architects evaluating ArchLucid — daily frontier-AI users with low patience for process overhead.  
**Not for:** naive operators (use [`FIRST_HOUR_OPERATOR_PATH.md`](FIRST_HOUR_OPERATOR_PATH.md)), contributors (use [`../engineering/FIRST_30_MINUTES.md`](../engineering/FIRST_30_MINUTES.md)), or sponsor-led procurement walks.

**Canonical depth stays elsewhere** — this section is a **focused expert lane** only. Do not remove or replace this document’s [seven mandatory steps](#seven-mandatory-steps), [`CORE_PILOT.md`](../CORE_PILOT.md), or [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

**Timing validation:** GTM backlog **M-44 (V1.1)** — observed first-session cohort measures whether experts hit the step-4 checkpoint within 15 minutes without facilitator narration. Until that cohort completes, do **not** claim product-led “15 minutes without founder narration” as proven (see claim boundary / **M-180**).

### Objective (one)

**Produce one committed finding you would raise in a real architecture review — or stop at minute 12 and record why ArchLucid did not beat your frontier-AI workflow.**

Success is **decision signal**, not completing every UI surface.

### Seven steps (15-minute box)

| # | Action | Time box | Success signal |
| --- | --- | --- | --- |
| **1** | Open **`/reviews/new`** with your architecture brief ready (paste text or upload evidence). Decline feature tours. | 0–2 min | Review request admitted |
| **2** | Submit **minimal intake** — answer MUST questions only; skip optional governance and policy-pack fields. | 2–5 min | `runId` captured |
| **3** | **Execute** the review. Stay on the run detail page — do not open Operate, Graph, Compare, or Governance routes. | 5–12 min | Findings list visible |
| **4** | **STOP-IF-VALUE-NOT-SEEN checkpoint** — see below. | 12–13 min | Pass → step 5; Fail → stop |
| **5** | **Commit** the manifest — only if step 4 passed. | 13–14 min | `goldenManifestId` present |
| **6** | Locate the **sponsor export** or architecture package — unaided. | 14–15 min | Sendable artifact path found |
| **7** | *(Optional)* Walk **one** finding's evidence trail — only when step 4 was marginal. | ≤15 min total | Evidence chain stronger than raw AI output |

### Step 4 — STOP-IF-VALUE-NOT-SEEN (mandatory)

At **minute 12**, scan the top three findings and answer **both**:

1. Is at least **one** finding **non-obvious** — something you had not already concluded from the brief alone?
2. Does that finding link to an **evidence trail** you could defend to a sponsor?

| Result | Action |
| --- | --- |
| **YES to both** | Continue to commit (steps 5–6). |
| **NO to either** | **Stop.** Do not commit. Record primary dismissal code **D1** (equivalent to frontier AI) or **D7** (finding quality doubt) per [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md). File the [principal architect dismissal log](../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#principal-architect-dismissal-log) (alias: [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](../go-to-market/validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md)). |

This checkpoint prevents ceremony completion without value signal — the most common expert dismissal pattern.

### Explicitly skip (first 15 minutes)

| Skip | Why |
| --- | --- |
| Operate: Graph, Compare, Replay | Not required for first value signal |
| Governance dashboards and policy-pack configuration | Deep links below — use after commit |
| ROI baseline scorecard and procurement pack | Post-handoff only |
| Azure extractor setup when brief + uploads suffice | Evidence-only path: [`CORE_PILOT.md`](../CORE_PILOT.md) § Evidence-only |
| Reading full V1 scope or integration catalog | Expert lane assumes platform is already provisioned |

### Optional deep links (after step 4 passes or after commit)

| Topic | Doc |
| --- | --- |
| Evidence trail / audit rows for one finding | [`../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#principal-architect-insight-validation`](../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#principal-architect-insight-validation) (alias: [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md)) |
| Governance gates and policy packs | [`PRODUCT_PACKAGING.md`](PRODUCT_PACKAGING.md) · [`../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) |
| Sponsor packet and export labels | [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) |
| Full seven-step canonical pilot | [Seven mandatory steps](#seven-mandatory-steps) |
| One-sitting timing narrative (operators) | [`../runbooks/FIRST_CREDIBLE_REVIEW_ONE_SITTING.md`](../runbooks/FIRST_CREDIBLE_REVIEW_ONE_SITTING.md) |
| First-session observation protocol | [`../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) |

### Related paths (do not duplicate)

| Path | When to use instead |
| --- | --- |
| [`FIRST_HOUR_OPERATOR_PATH.md`](FIRST_HOUR_OPERATOR_PATH.md) | New tenant operator — four-step first hour |
| [`PILOT_SUCCESS_SCORECARD.md#minimum-viable-pilot-success-lane`](../go-to-market/PILOT_SUCCESS_SCORECARD.md#minimum-viable-pilot-success-lane) | Naive operator — five-step guided intake |
| [`#hosted-pilot-single-path`](#hosted-pilot-single-path) | Platform engineer — strict RC script path |
| [Seven mandatory steps](#seven-mandatory-steps) + [controlled-pilot checklist](#controlled-pilot-first-run-proof-checklist) | Full pilot with proof scripts and sponsor-send gates |

---

## Controlled-pilot first-run proof checklist {#controlled-pilot-first-run-proof-checklist}

Former standalone body: `docs/library/CONTROLLED_PILOT_FIRST_RUN_CHECKLIST.md` → this section (filename kept as a path-stable alias). Complements the [seven mandatory steps](#seven-mandatory-steps) with a sales-led 60–90 minute proof walkthrough and claim-posture picker. Does **not** replace KEEP [`../go-to-market/PILOT_ACCEPTANCE_THRESHOLDS.md`](../go-to-market/PILOT_ACCEPTANCE_THRESHOLDS.md).

**Path-stable alias:** [`CONTROLLED_PILOT_FIRST_RUN_CHECKLIST.md`](CONTROLLED_PILOT_FIRST_RUN_CHECKLIST.md).

**Last reviewed:** 2026-07-31

**Audience:** Operators and evaluators running a sales-led controlled pilot.

### Paths (pick one)

| Path | When to use | Claim posture |
| --- | --- | --- |
| **Simulator-only** | CI parity, dry demos, no AOAI credentials | Simulator labels on all sponsor exports |
| **Partial-real** | Some agents on live model with caveats | Partial-real wording + evidence-basis labels |
| **Full-real** | Staging with current real-mode gate PASS | Full-real only when `real-mode-claim-gate.json` is PASS |

### Checklist (60–90 minutes)

| Step | Action | Success signal | Doc |
| --- | --- | --- | --- |
| 1 | Configure tenant auth and SQL (or use hosted staging). | `GET /health/ready` healthy. | [First architecture review walkthrough](#first-architecture-review-walkthrough) |
| 2 | Sign in; open **New review** (`/reviews/new`). | Wizard loads without auth errors. | [DEMO_QUICKSTART.md](../go-to-market/DEMO_QUICKSTART.md) |
| 3 | Create request; note **run id**. | Run appears in Reviews. | [operator-shell.md](operator-shell.md) |
| 4 | Upload Azure extractor ZIP (Tier 1) or attach evidence. | Upload 200; evidence on run. | [AZURE_EXTRACTOR.md](AZURE_EXTRACTOR.md) |
| 5 | **Execute** agents. | **Ready for commit** or actionable failure + correlation id. | [TROUBLESHOOTING.md](../runbooks/TROUBLESHOOTING.md) |
| 6 | Resolve governance warnings; **Commit** manifest. | Manifest id visible; execution mode persisted. | [V1_SCOPE.md](V1_SCOPE.md) |
| 7 | Verify run detail shows **execution mode** and **evidence basis**. | Real/Simulator/Fallback/Mixed + basis labels. | [CLAIM_READINESS_STATUS.md](../go-to-market/CLAIM_READINESS_STATUS.md) |
| 8 | Collect proof packet. | `collect-first-pilot-proof.ps1` PASS/WARN with limitations.md. | [FIRST_RUN_EVIDENCE_CHECKLIST.md](../runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md) |
| 9 | Export sponsor packet / executive review. | Labels present; no overclaim language. | [PILOT_GUIDE.md](customer-facing/PILOT_GUIDE.md) |

### Expected artifacts

- Committed run with manifest id
- Proof folder: `run-evidence.json`, `limitations.md`, `environment.json`, `governance-outcome-summary.json`
- Sponsor export with execution mode + evidence basis sections

### Failure interpretation

- **Governance block on commit:** read API problem detail for blocking rule and minimum unblock action.
- **Real-mode HOLD:** do not use full-real sponsor wording; use simulator-only or partial-real per claim gate.
- **Proof-packet WARN:** missing ROI baseline or demo tenant — hold external send until resolved.

### Related (controlled-pilot checklist)

- [LIVE_E2E_HAPPY_PATH.md](LIVE_E2E_HAPPY_PATH.md)
- [V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md) (strict RC via `ARCHLUCID_STRICT_RC=1`)
- [Minimum viable pilot success lane](../go-to-market/PILOT_SUCCESS_SCORECARD.md#minimum-viable-pilot-success-lane)
- [Hosted pilot — single path](#hosted-pilot-single-path)

---

## Hosted pilot — single path quickstart {#hosted-pilot-single-path}

Former standalone body: `docs/library/HOSTED_PILOT_SINGLE_PATH.md` → this section (filename kept as a path-stable alias). Operator cookbook for the first **hosted** pilot on ArchLucid-managed Azure — one authoritative strict-RC flow; advanced paths are troubleshooting only. Complements the [seven mandatory steps](#seven-mandatory-steps) and [controlled-pilot checklist](#controlled-pilot-first-run-proof-checklist).

**Path-stable alias:** [`HOSTED_PILOT_SINGLE_PATH.md`](HOSTED_PILOT_SINGLE_PATH.md).

**Last reviewed:** 2026-07-31

**Audience:** Operator or platform engineer cutting the first hosted pilot on ArchLucid-managed Azure.

**Canonical script:** `.\scripts\Invoke-FirstPilotStrictPath.ps1` (strict RC gates + consolidated evidence index).

**Do not branch** until this path completes or emits an explicit **HOLD** with remediation.

**Naive architect workspace path (before strict script):** use `/reviews/new` → **Guided intake (recommended)** → admit draft → answer/skip MUST questions → submit → execute → finalize (API `commit`). Live E2E coverage: `archlucid-ui/e2e/live-api-socratic-intake.spec.ts`.

### Prerequisites (one checklist)

1. Azure Staging (or agreed RC) API base URL and Bearer JWT for live probes — see [`RC_TARGET_ENVIRONMENT_MATRIX.md`](RC_TARGET_ENVIRONMENT_MATRIX.md).
2. Repository clone at the release candidate commit.
3. Python 3.11+ and PowerShell 7 on the operator workstation.

### Single command path

From the repository root:

```powershell
$env:ARCHLUCID_API_BASE_URL = "https://your-staging-api.example"
$env:ARCHLUCID_BEARER_TOKEN = "<staging-jwt>"
.\scripts\Invoke-FirstPilotStrictPath.ps1 -OutDir artifacts/first-pilot-strict
```

#### Expected outputs (stop/fail checkpoints)

| Step | Artifact | PASS signal |
| --- | --- | --- |
| 1 | `artifacts/first-pilot-strict/release-readiness/rc-go-no-go-verdict.json` | `"verdict": "PASS"` or documented `"WARN"` with sponsor caveats |
| 2 | `artifacts/first-pilot-strict/release-readiness/rc-decision-narrative.md` | Decision line matches verdict |
| 3 | `artifacts/first-pilot-strict/release-readiness/first-pilot-timing-budget.json` | `firstValueCommitBudget.disposition` is **PASS** or **WARN** (not silent omission) |
| 4 | `artifacts/first-pilot-strict/first-pilot-strict-summary.json` | `evidenceScope` = `local-plus-staging-live` when API URL supplied |

**HOLD:** Do not send sponsor materials until blockers in `rc-go-no-go-verdict.json` → `blockers` are cleared or explicitly waived per [`RC_RELEASE_GATE.md`](../runbooks/RC_RELEASE_GATE.md).

### After strict path (optional proof rollup)

When attaching sponsor packet evidence for a named environment run:

```powershell
.\scripts\collect-first-pilot-proof.ps1 -ProofDirectory artifacts/first-pilot-proof -RunId "<run-id>"
```

### Advanced / troubleshooting (not the first path)

| Topic | Doc |
| --- | --- |
| Full release checklist | [`V1_RELEASE_CHECKLIST.md`](V1_RELEASE_CHECKLIST.md) |
| Release smoke only | [`RELEASE_SMOKE.md`](RELEASE_SMOKE.md) |
| Live E2E parity matrix | [`LIVE_E2E_AUTH_PARITY.md`](LIVE_E2E_AUTH_PARITY.md) |
| First pilot evidence bundle | [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) |
| Build / local stack | [`docs/engineering/BUILD.md`](../engineering/BUILD.md) |

### Related (hosted single path)

- [`customer-facing/PILOT_GUIDE.md`](customer-facing/PILOT_GUIDE.md) — redirect spine
- [`PILOT_SUCCESS_SCORECARD.md#minimum-viable-pilot-success-lane`](../go-to-market/PILOT_SUCCESS_SCORECARD.md#minimum-viable-pilot-success-lane) — five-step buyer success lane
- [`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) — sponsor narrative of record
