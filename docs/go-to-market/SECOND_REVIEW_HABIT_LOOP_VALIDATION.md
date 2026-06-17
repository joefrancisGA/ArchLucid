> **Scope:** Second-review validation plan — market validation for repeat usage; no product features unless observed failure.

# Second-review habit loop validation

**Audience:** Pilot operators, architecture leads after first successful commit.  
**Last reviewed:** 2026-06-16

**Purpose:** Measure whether **second and subsequent reviews** produce decision-changing drift visibility and reuse intent — where ArchLucid should outperform ad hoc frontier-AI chat.

**Cookbook:** [`REPEAT_REVIEW_LOOP.md`](../library/REPEAT_REVIEW_LOOP.md) · [`PRODUCT_PACKAGING.md`](../library/PRODUCT_PACKAGING.md) · [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md)

**6-week execution board:** [`SECOND_REVIEW_HABIT_LOOP_EXECUTION_BOARD.md`](SECOND_REVIEW_HABIT_LOOP_EXECUTION_BOARD.md) — 3 pilot accounts, pass/fail rules, weekly digests (**Done 2026-06-17**) · fixtures: [`fixtures/second-review/README.md`](../../fixtures/second-review/README.md)

---

## Hypothesis

After the first committed review, ArchLucid's compare, drift, governance, and evidence trail make the **second review** faster to package and more defensible than re-prompting frontier AI on a changed packet.

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
| Compare reviews | Operate → compare | Compare endpoints — [`API_CONTRACTS.md`](../library/API_CONTRACTS.md) |
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

## Related

- [`SECOND_REVIEW_HABIT_LOOP_EXECUTION_BOARD.md`](SECOND_REVIEW_HABIT_LOOP_EXECUTION_BOARD.md)
- [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) — run 3 in real-mode matrix
- [`FRONTIER_AI_BAKEOFF_EVIDENCE_PACK.md`](FRONTIER_AI_BAKEOFF_EVIDENCE_PACK.md)
