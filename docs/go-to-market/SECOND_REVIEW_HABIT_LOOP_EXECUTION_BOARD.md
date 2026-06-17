> **Scope:** 6-week execution board for second-review habit-loop validation across 3 pilot accounts — market validation only; no product features unless ≥2 accounts show same failure.

# Second-review habit loop — execution board

**Audience:** Founder, pilot operator, architecture lead  
**Last reviewed:** 2026-06-17

**Purpose:** Operationalize repeat-review validation so ArchLucid proves **habit-loop value** (compare, drift, packaging speed) versus re-prompting frontier AI on review #2.

**Canonical protocol:** [`SECOND_REVIEW_HABIT_LOOP_VALIDATION.md`](SECOND_REVIEW_HABIT_LOOP_VALIDATION.md)  
**Operator cookbook:** [`REPEAT_REVIEW_LOOP.md`](../library/REPEAT_REVIEW_LOOP.md)  
**Templates:** [`fixtures/second-review/`](../../fixtures/second-review/)

**Artifact root:** `artifacts/second-review/<cohort-label>/` (local; no customer-identifying content in git)

---

## Cohort parameters

| Parameter | Value |
| --- | --- |
| Duration | 6 weeks |
| Pilot accounts | 3 (pseudonymous labels) |
| Time box per account | Review #2 within **14 days** of review #1 commit |
| Engineering gate | Only if **≥2** accounts show the **same** observed failure |
| Cohort pass | **≥2** of 3 accounts pass account-level validation |

---

## Account selection

| Criterion | Required |
| --- | --- |
| Review #1 committed (Real or labeled Simulator) | Yes |
| Material packet change planned for review #2 | Yes — not typo-only |
| Architecture lead available for 15-min interview | Yes |
| Proof permission for internal ops use | Yes |

**Disqualify:** demo-only Contoso with no buyer path to review #2 within 6 weeks.

---

## 6-week board (founder view)

| Week | Milestone | Owner | Done when |
| --- | --- | --- | --- |
| **1** | Open cohort folder; assign 3 account labels; confirm run-A ids | Founder | `execution-board.md` populated |
| **2** | Account 1: packet evolution + review #2 commit + proof | Operator | Account 1 row = PASS or FAIL |
| **3** | Account 2: same | Operator | Account 2 row complete |
| **4** | Account 3: same | Operator | Account 3 row complete |
| **5** | Cohort synthesis + weekly digests consolidated | Founder | Rollup section complete |
| **6** | Positioning decision; engineering escalation (if any) | Founder | Board verdict recorded |

---

## Per-account workflow

### 1. Baseline (review #1 — already done)

```powershell
.\scripts\collect-first-pilot-proof.ps1 -RunId '<run-A>' -RunNumber 1 -SponsorHandoff
```

Record: `runAId`, manifest id, cycle time, disposition, reuse intent baseline (if known).

### 2. Evolve packet (3 bullets max)

Document material changes between A and B in account tracker.

### 3. Second review + compare

- Core Pilot path for run B
- Compare against run A (UI or API)

### 4. Second-review proof

```powershell
.\scripts\collect-first-pilot-proof.ps1 `
  -RunId '<run-B>' `
  -RunNumber 2 `
  -CompareBaseRunId '<run-A>' `
  -SponsorHandoff `
  -FailOnHold
```

Verify `go-no-go-summary.json` includes `stickinessSignals`.

### 5. Interview (15 min)

| Question | Field |
| --- | --- |
| Did compare change a decision vs B alone? | Y/N + example |
| Run review #3 here vs manual AI? | 1–5 |
| Faster on #2 — packaging or discovery? | Packaging / Discovery / Tie |
| Biggest friction | Open text |

---

## Pass / fail rules (per account)

### Account PASS

- [ ] Run B committed with distinct run + manifest ids
- [ ] Compare output linked in notes or sponsor narrative
- [ ] ≥1 stickiness signal improved **or** explained (minor packet change)
- [ ] ROI basis labeled — no demo-derived dollar outcomes
- [ ] Reuse intent ≥ **3/5**

### Account FAIL

- Any of: no second commit within 14 days (without documented buyer blocker), compare missing expected drift, export loses execution-mode labels, reuse intent ≤ **2/5**, proof pipeline HOLD on valid inputs.

### Cohort PASS

- **≥2** accounts PASS
- Weekly digests filed for weeks 2–5
- No engineering batch unless ≥2 accounts share same failure mode

---

## Stickiness signals (track per account)

| Signal | Improved? | Evidence pointer |
| --- | --- | --- |
| Prior manifest referenced in compare | Y/N | |
| Drift visibility changed priority | Y/N | |
| Cycle time vs review #1 | ↓ / → / ↑ | |
| Governance trend | Y/N | |
| Sponsor disposition | SEND / WARN / HOLD | |

---

## Weekly executive digest

File one digest per week during weeks 2–5 using [`fixtures/second-review/weekly-executive-digest.template.md`](../../fixtures/second-review/weekly-executive-digest.template.md).

**Audience:** Founder / release owner (internal only until permissioned).

**Include:**

- Accounts active this week
- Review #2 status per account
- Top friction theme (if any)
- Cohort pass trajectory (on track / at risk)
- Engineering escalation recommendation (hold / review)

---

## Cohort setup

```powershell
$cohort = "cohort-2026-06"
$root = "artifacts/second-review/$cohort"
New-Item -ItemType Directory -Force -Path "$root/accounts","$root/digests" | Out-Null
Copy-Item fixtures/second-review/execution-board.template.md "$root/execution-board.md"
Copy-Item fixtures/second-review/account-tracker.template.md "$root/accounts/account-01.md"
Copy-Item fixtures/second-review/account-tracker.template.md "$root/accounts/account-02.md"
Copy-Item fixtures/second-review/account-tracker.template.md "$root/accounts/account-03.md"
```

---

## Engineering escalation (hold by default)

Open product work **only** when **≥2** accounts show the same failure, e.g.:

- Compare missing material drift participant expected
- Second-review export loses execution-mode labels
- Proof pipeline fails on `-RunNumber 2` with valid inputs

Otherwise: market signal insufficient — continue validation.

---

## Related

- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — **M-41**
- [`FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md`](FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md)
- [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md)
