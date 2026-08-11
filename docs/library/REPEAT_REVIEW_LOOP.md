> **Scope:** Customer-facing — operator cookbook guide for second and subsequent finalized architecture reviews — V1 surfaces only — plus the founder/pilot habit-loop validation plan and 6-week execution board (formerly `docs/go-to-market/SECOND_REVIEW_HABIT_LOOP_VALIDATION.md`; that filename remains a path-stable alias).

> **Reviewed:** 2026-07-27


# Your repeat architecture review

**Audience:** Architects and architecture leads **after the first finalized architecture package**; pilot operators running habit-loop validation.

**Last reviewed:** 2026-07-27

**Prerequisite:** One successful Core Pilot finalize — see [Your first architecture review](/help/first-architecture-review).

**Habit-loop validation:** [`#second-review-habit-loop-validation`](#second-review-habit-loop-validation) (`SECOND_REVIEW_HABIT_LOOP_VALIDATION.md` alias).

---

## Why the second review should show more value

| Repeat-review signal | Where you see it | Proof acceptance |
| --- | --- | --- |
| Reused prior decision | Compare / prior package context | Second review references first signed review record in findings or compare output |
| Repeated finding category trend | Product learning rollups | Category counts shift with real evidence changes |
| Improved cycle time | Review duration metrics · pilot timing budget | Wall-clock or architect hours decrease vs baseline in [`PILOT_SUCCESS_SCORECARD.md`](../go-to-market/PILOT_SUCCESS_SCORECARD.md) |
| Governance trend | Policy pack dry-run → enforce | Fewer critical findings on repeat with same pack |
| Executive ROI rollup | Executive ROI summary export | Sponsor-safe ROI basis labels on executive exports |

---

## Recommended loop (after first finalize)

1. **Compare** two architecture packages — use Compare in the architect workspace.
2. **Replay** a saved comparison when investigating regressions — see [Compare and replay](/help/comparison-replay).
3. **Reuse** prior package context in a new review when evidence evolves incrementally — see [Prior package context](/help/prior-manifest-retrieval).
4. **Run governance dry-run** before enforcing a blocking finalize gate — [`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md#6-operator-calibration).
5. **Collect proof** again for the second finalized package — disposition should improve or caveats should shrink.

<details>
<summary>Administrator details — API and CLI surfaces</summary>

| Action | UI | API / CLI |
| --- | --- | --- |
| Compare two reviews | Analysis → Compare | Compare endpoints per [`API_CONTRACTS.md`](../library/API_CONTRACTS.md) |
| Replay review | Review detail replay | Authority replay routes |
| Executive ROI summary | Exports / sponsor views | Export endpoints with ROI basis labels |
| Governance dry-run | Governance UI | `POST /v1/governance/policy-packs/dry-run` |
| Product learning rollups | Analytics where enabled | [`PRODUCT_LEARNING.md`](../library/PRODUCT_LEARNING.md) |

Second-run proof collection (TB-227):

```powershell
./scripts/collect-first-pilot-proof.ps1 -BaseUrl $env:ARCHLUCID_API_URL -RunNumber 2 -RunId '<second-review-id>' -CompareBaseRunId '<first-review-id>'
```

</details>

---

## Second-review proof checklist

- [ ] Second architecture package finalized with a distinct review identity and signed review record.
- [ ] Compare output attached or linked in sponsor narrative.
- [ ] Prior decisions reused or explicitly superseded.
- [ ] Governance dry-run completed before stricter enforce mode (when used).
- [ ] ROI / proof labels remain sponsor-safe.

## Second-review habit loop validation {#second-review-habit-loop-validation}

Former standalone body: `docs/go-to-market/SECOND_REVIEW_HABIT_LOOP_VALIDATION.md` → this section (filename kept as a path-stable alias). Market validation for repeat usage — no product features unless observed failure.

**Purpose:** Measure whether **second and subsequent reviews** produce decision-changing drift visibility and reuse intent — where ArchLucid should outperform ad hoc frontier-AI chat.

**Fixtures:** [`fixtures/second-review/README.md`](../../fixtures/second-review/README.md) · **Artifact root:** `artifacts/second-review/<cohort-label>/` (local; no customer-identifying content in git)

**Also see:** [`PRODUCT_PACKAGING.md`](PRODUCT_PACKAGING.md) · [`PILOT_ROI_MODEL.md`](PILOT_ROI_MODEL.md)

### Hypothesis

After the first finalized review, ArchLucid's compare, drift, governance, and evidence trail make the **second review** faster to package and more defensible than re-prompting frontier AI on a changed packet.

### Validation setup

| Input | Requirement |
| --- | --- |
| First committed run | `RunId` A with manifest id recorded |
| Updated packet | Material change (cost, region, compliance, or service add) — not typo-only |
| Second committed run | `RunId` B on same project/workspace |
| Baselines | Scorecard baselines captured or labeled defaulted |
| Time box | 2 weeks from first commit to second commit (pilot cadence) |

### Procedure

#### Step 1 — First review baseline (already done)

Confirm proof collection for run A:

```powershell
.\scripts\collect-first-pilot-proof.ps1 -RunId '<run-A>' -RunNumber 1 -SponsorHandoff
```

Record: cycle time, finding count by severity, sponsor disposition.

#### Step 2 — Evolve the architecture packet

Document what changed between A and B (facilitator note — 3 bullets max):

- 
- 
- 

#### Step 3 — Second review

Follow Core Pilot path for run B. Use **compare** against run A (UI or API).

#### Step 4 — Collect second-review proof

```powershell
.\scripts\collect-first-pilot-proof.ps1 `
  -RunId '<run-B>' `
  -RunNumber 2 `
  -CompareBaseRunId '<run-A>' `
  -SponsorHandoff `
  -FailOnHold
```

Verify `go-no-go-summary.json` includes `stickinessSignals`.

#### Step 5 — Participant interview (15 min)

| Question | Record |
| --- | --- |
| Did compare output change a decision vs reviewing B alone? | Y/N + example |
| Would you run a third review in ArchLucid vs manual AI? | 1–5 intent |
| What was faster on review 2 — packaging or finding discovery? | Packaging / Discovery / Tie |
| Biggest friction on review 2 | Open text |

### Stickiness signals to measure

| Signal | Source | Pass hint |
| --- | --- | --- |
| Prior manifest referenced | Compare output / findings | Explicit reuse |
| Drift visibility changed priority | Interview + compare | Non-trivial example |
| Cycle time improved | Pilot timing / scorecard | ↓ vs baseline |
| Governance trend | Policy dry-run → enforce | Fewer critical on repeat |
| Sponsor disposition improved | Run 2 proof summary | WARN→READY or HOLD resolved |

See stickiness signals table above in this cookbook.

### API / UI surfaces (V1)

| Action | UI | API |
| --- | --- | --- |
| Compare two reviews | Operate → compare | Compare endpoints — [`API_CONTRACTS.md`](API_CONTRACTS.md) |
| Replay run | Review detail | Authority replay routes |
| Executive ROI rollup | Exports | ROI basis labels required |
| Governance dry-run | Governance UI | `POST /v1/governance/policy-packs/dry-run` |

### Acceptance criteria (validation pass)

- [ ] Second review committed with distinct run and manifest ids
- [ ] Compare output linked in sponsor narrative or facilitator notes
- [ ] ≥1 stickiness signal improved **or** explained why not (packet change too minor)
- [ ] ROI basis remains labeled — no demo-derived dollar outcomes
- [ ] Reuse intent ≥3/5 from participant

**Cohort:** **≥3** pilots with second-review data before product changes.

### When to escalate to engineering

Only if **≥2** validation sessions show the same observed failure, e.g.:

- Compare missing material drift the participant expected
- Second-review export loses execution-mode labels
- Proof pipeline fails on `-RunNumber 2` with valid inputs

Otherwise hold feature work — market signal insufficient.

### 6-week execution board {#6-week-execution-board}

| Parameter | Value |
| --- | --- |
| Duration | 6 weeks |
| Pilot accounts | 3 (pseudonymous labels) |
| Time box per account | Review #2 within **14 days** of review #1 commit |
| Engineering gate | Only if **≥2** accounts show the **same** observed failure |
| Cohort pass | **≥2** of 3 accounts pass |

| Week | Milestone |
| --- | --- |
| **1** | Open cohort folder; assign 3 account labels; confirm run-A ids |
| **2–4** | Accounts 1–3: packet evolution + review #2 commit + proof |
| **5** | Cohort synthesis + weekly digests consolidated |
| **6** | Positioning decision; engineering escalation (if any) |

#### Per-account workflow (summary)

1. Baseline proof for run A (`collect-first-pilot-proof.ps1 -RunId … -RunNumber 1`).
2. Evolve packet (3 bullets max — material change).
3. Second review + compare against A.
4. Second-review proof with `-RunNumber 2 -CompareBaseRunId '<run-A>' -FailOnHold`.
5. 15-min interview: decision change Y/N; reuse intent 1–5; packaging vs discovery speed; friction.

**Account PASS:** run B committed with distinct ids; compare linked; ≥1 stickiness signal or explained; ROI labeled; reuse intent ≥3/5.  
**Account FAIL:** no second commit in 14 days (without blocker), missing compare drift, unlabeled exports, reuse ≤2/5, or proof HOLD on valid inputs.

### Related (validation)

- [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) — run 3 in real-mode matrix
- [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../go-to-market/GENERIC_AI_BAKEOFF_PROTOCOL.md#evidence-pack-checklist)

---

## Related help

- [Compare and replay](/help/comparison-replay)
- [Architecture packages](/help/review-packages)
- [Accelerator chooser](/help/accelerator-chooser)
- [Your first architecture review](/help/first-architecture-review)
- [`#second-review-habit-loop-validation`](#second-review-habit-loop-validation) · [`../go-to-market/SECOND_REVIEW_HABIT_LOOP_VALIDATION.md`](../go-to-market/SECOND_REVIEW_HABIT_LOOP_VALIDATION.md) (alias)
