> **Scope:** Pre-registered tracker for one blind decision-delta cohort. Lock the plan and thresholds **before** collecting data so results cannot be threshold-gamed after the fact. Market-validation only.

# Blind decision-delta cohort tracker

**Cohort label:** _(e.g. regulated-workload-2026Q3)_
**Pre-registered (UTC):** _(date the thresholds below were frozen — set once, do not edit after first session)_
**Facilitator:** _(name kept in private notes; leave initials only here)_
**Status:** `pre-registered` → `in-progress` → `complete`
**Execution tracked as:** GTM backlog **M-50** (V1.1) — running the live sessions is founder/market work, not coding-agent work.

This tracker does **not** replace the protocol assets — it is the single launch + capture surface that points at them:

- Operating checklist: [`../Architect_Evaluation/BLIND_PRINCIPAL_ARCHITECT_VALIDATION_COHORT.md`](../Architect_Evaluation/BLIND_PRINCIPAL_ARCHITECT_VALIDATION_COHORT.md)
- Scorecard: [`../Architect_Evaluation/PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md`](../Architect_Evaluation/PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md)
- Per-session JSON: [`../templates/principal-architect-session.template.json`](../templates/principal-architect-session.template.json)
- Scoring sheet JSON: [`../templates/blind-validation-scoring-sheet.template.json`](../templates/blind-validation-scoring-sheet.template.json)
- Cohort rollup template: [`../templates/blind-validation-exec-summary.template.md`](../templates/blind-validation-exec-summary.template.md)

---

## 1. Pre-registered hypothesis (lock before session 1)

> ArchLucid produces a materially higher rate of **non-obvious, correct, decision-changing** findings than a competent principal architect using frontier AI manually on the **same** sanitized packet, with **zero critical wrong** findings.

## 2. Pre-registered thresholds (do not edit after session 1)

These mirror the conservative thresholds already in the cohort checklist and scorecard. They are frozen here so the verdict is decided by the plan, not by the data.

| Metric | Pass | Fail |
| --- | --- | --- |
| Non-obvious (**N**) share of material ArchLucid findings | ≥ 25% | < 15% |
| Critical wrong / unsupported (**X**) | 0 | any critical **X** |
| Decision-changing (**D** / decision impact ≥ 4) | ≥ 1 per session, or ≥ 3 across cohort | 0 across cohort |
| Reuse intent | ≥ 2 of 3 (or ≥ 3 of 5) would run review #2 | majority would not return |
| Evidence-trail advantage vs manual AI | majority say ArchLucid stronger | majority say manual AI sufficient |

**Minimum cohort size before any messaging change:** 3 independent sessions. Target 5.

## 3. Session slots

Fill one row per session. Keep names/quotes out of this file; store them privately per the README.

| # | Date (UTC) | Packet (label only) | ArchLucid mode (sim/real/mixed) | Evidence basis | N-rate | Critical X | Max decision impact | Reuse intent | Summary link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | | | | |
| 2 | | | | | | | | | |
| 3 | | | | | | | | | |
| 4 | | | | | | | | | |
| 5 | | | | | | | | | |

## 4. Cohort verdict (fill after ≥ 3 sessions)

| Threshold | Result | Pass / Fail |
| --- | --- | --- |
| N-rate ≥ 25% | | |
| 0 critical X | | |
| ≥ 3 decision-changing across cohort | | |
| Reuse intent majority | | |
| Evidence-trail advantage | | |

**Overall verdict:** `pass` / `mixed` / `fail`
**Action taken (cite the rule, not improvisation):** _(map to the roadmap-guidance table in the scorecard / cohort checklist — e.g. "fail on N-rate, pass on evidence → reposition around durability/audit, do not add features")_

## 5. Honesty checklist (block commit until all true)

- [ ] Thresholds in §2 were frozen before session 1 and not edited afterward.
- [ ] Source mapping revealed to reviewers only after blind scoring.
- [ ] No demo-derived session is cited as customer proof.
- [ ] Participant identities/quotes are stored outside the repository.
- [ ] Verdict in §4 follows §2 thresholds, not a post-hoc rationale.
