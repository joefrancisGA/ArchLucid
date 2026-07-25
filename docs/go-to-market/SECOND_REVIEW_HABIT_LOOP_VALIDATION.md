> **Reviewed:** 2026-07-25

> **Scope:** Second-review validation plan and 6-week execution board — market validation for repeat usage; no product features unless observed failure.

# Second-review habit loop validation

**Audience:** Pilot operators, architecture leads after first successful commit.  
**Last reviewed:** 2026-07-25

**Purpose:** Measure whether **second and subsequent reviews** produce decision-changing drift visibility and reuse intent — where ArchLucid should outperform ad hoc frontier-AI chat.

**Cookbook:** [`REPEAT_REVIEW_LOOP.md`](../library/REPEAT_REVIEW_LOOP.md) · [`PRODUCT_PACKAGING.md`](../library/PRODUCT_PACKAGING.md) · [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md)

**Fixtures:** [`fixtures/second-review/README.md`](../../fixtures/second-review/README.md) · **Artifact root:** `artifacts/second-review/<cohort-label>/` (local; no customer-identifying content in git)

---

## Hypothesis

After the first finalized review, ArchLucid's compare, drift, governance, and evidence trail make the **second review** faster to package and more defensible than re-prompting frontier AI on a changed packet.

---

## Validation setup

| Input | Requirement |
| --- | --- |
| First committed run | `RunId` A with manifest id recorded |
| Updated packet | Material change (cost, region, compliance, or service add) — not typo-only |
| Second committed run | `RunId` B on same project/workspace |
| Baselines | Scorecard baselines captured or labeled defaulted |
| Time box | 2 weeks from first commit to second commit (pilot cadence) |

---

## Procedure

### Step 1 — First review baseline (already done)

Confirm proof collection for run A:

```powershell
.\scripts\collect-first-pilot-proof.ps1 -RunId '<run-A>' -RunNumber 1 -SponsorHandoff
```

Record: cycle time, finding count by severity, sponsor disposition.

### Step 2 — Evolve the architecture packet

Document what changed between A and B (facilitator note — 3 bullets max):

- 
- 
- 

### Step 3 — Second review

Follow Core Pilot path for run B. Use **compare** against run A (UI or API).

### Step 4 — Collect second-review proof

```powershell
.\scripts\collect-first-pilot-proof.ps1 `
  -RunId '<run-B>' `
  -RunNumber 2 `
  -CompareBaseRunId '<run-A>' `
  -SponsorHandoff `
  -FailOnHold
```

Verify `go-no-go-summary.json` includes `stickinessSignals`.

### Step 5 — Participant interview (15 min)

| Question | Record |
| --- | --- |
| Did compare output change a decision vs reviewing B alone? | Y/N + example |
| Would you run a third review in ArchLucid vs manual AI? | 1–5 intent |
| What was faster on review 2 — packaging or finding discovery? | Packaging / Discovery / Tie |
| Biggest friction on review 2 | Open text |

---

## Stickiness signals to measure

| Signal | Source | Pass hint |
| --- | --- | --- |
| Prior manifest referenced | Compare output / findings | Explicit reuse |
| Drift visibility changed priority | Interview + compare | Non-trivial example |
| Cycle time improved | Pilot timing / scorecard | ↓ vs baseline |
| Governance trend | Policy dry-run → enforce | Fewer critical on repeat |
| Sponsor disposition improved | Run 2 proof summary | WARN→READY or HOLD resolved |

See [`REPEAT_REVIEW_LOOP.md`](../library/REPEAT_REVIEW_LOOP.md) § Stickiness signals.

---

## API / UI surfaces (V1)

| Action | UI | API |
| --- | --- | --- |
| Compare two reviews | Operate → compare | Compare endpoints — [`API_CONTRACTS.md`](../library/API_CONTRACTS.md) |
| Replay run | Review detail | Authority replay routes |
| Executive ROI rollup | Exports | ROI basis labels required |
| Governance dry-run | Governance UI | `POST /v1/governance/policy-packs/dry-run` |

---

## Acceptance criteria (validation pass)

- [ ] Second review committed with distinct run and manifest ids
- [ ] Compare output linked in sponsor narrative or facilitator notes
- [ ] ≥1 stickiness signal improved **or** explained why not (packet change too minor)
- [ ] ROI basis remains labeled — no demo-derived dollar outcomes
- [ ] Reuse intent ≥3/5 from participant

**Cohort:** **≥3** pilots with second-review data before product changes.

---

## When to escalate to engineering

Only if **≥2** validation sessions show the same observed failure, e.g.:

- Compare missing material drift the participant expected
- Second-review export loses execution-mode labels
- Proof pipeline fails on `-RunNumber 2` with valid inputs

Otherwise hold feature work — market signal insufficient.

---

## 6-week execution board

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

### Per-account workflow (summary)

1. Baseline proof for run A (`collect-first-pilot-proof.ps1 -RunId … -RunNumber 1`).
2. Evolve packet (3 bullets max — material change).
3. Second review + compare against A.
4. Second-review proof with `-RunNumber 2 -CompareBaseRunId '<run-A>' -FailOnHold`.
5. 15-min interview: decision change Y/N; reuse intent 1–5; packaging vs discovery speed; friction.

**Account PASS:** run B committed with distinct ids; compare linked; ≥1 stickiness signal or explained; ROI labeled; reuse intent ≥3/5.  
**Account FAIL:** no second commit in 14 days (without blocker), missing compare drift, unlabeled exports, reuse ≤2/5, or proof HOLD on valid inputs.

---

## Related

- [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) — run 3 in real-mode matrix
- [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md#evidence-pack-checklist)
