> **Scope:** Per-session dismissal-trigger capture + weekly triage runbook for principal-architect validation. Market-validation instrumentation only — not product claims.

# Principal architect dismissal log

**Audience:** Founder / facilitator after each principal-architect session (first-session cohort, blind bakeoff, or paid-pilot debrief).  
**Companion JSON:** [`templates/principal-architect-dismissal-log.template.json`](templates/principal-architect-dismissal-log.template.json)  
**Execution tracked as:** GTM backlog **M-44 (V1.1)** — filing real logs requires live sessions; this instrument is the V1 design half.

This log answers one question per session: **what is the single most likely reason this architect would not return voluntarily?** It complements — does not replace — the cohort playbook, lighter JSON adjuncts, and synthesis rubric.

---

## When to file

| Session type | File one log when | Storage path (local; do not commit raw quotes) |
| --- | --- | --- |
| First-session cohort | Session ends (dismissal, near-dismissal, or explicit no-dismissal) | `artifacts/first-session/<cohort>/sessions/session-NN-dismissal-log.json` |
| Blind bakeoff / insight validation | Debrief completes | `artifacts/principal-architect/<runId>/dismissal-log.json` |
| Paid-pilot debrief | Within 48 h of handoff | `artifacts/pilot-dismissal-triggers/<runId>/dismissal-log.json` |

Copy the JSON template before each session. Set `noDismissalObserved: true` when no dismissal or near-dismissal signal occurred — still file the log so weekly review has a complete denominator.

---

## Required fields (per session)

### 1. Single most likely dismissal trigger

Pick **one** primary code from the taxonomy in [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](../FIRST_SESSION_DISMISSAL_PLAYBOOK.md) § Dismissal-trigger taxonomy (**D1–D8**). Use **D8** only when no near-dismissal signal occurred.

| Field (JSON) | Rule |
| --- | --- |
| `primaryTriggerCode` | One of **D1–D8** |
| `primaryTriggerLabel` | Matching label (e.g. `export-handoff-hidden` for **D4**) |

Secondary hesitation codes (H1–H8) belong in session notes — not as a second primary trigger.

### 2. Confidence level

| Level | When to use |
| --- | --- |
| **high** | Verbatim participant quote **and** observable behavior (aborted, refused review #2, explicit "I would not use this") |
| **medium** | Hesitation codes + closing-interview answer imply dismissal; no single smoking-gun quote |
| **low** | Facilitator hypothesis only — flag for re-validation in the next session |

Record `confidenceRationale` in one sentence. Weekly triage may **ignore** low-confidence singletons until a second session confirms the same code.

### 3. Evidence from participant quotes

`evidenceQuotes[]` — minimum **one** redacted quote when dismissal or near-dismissal observed; empty array when `noDismissalObserved: true`.

| Subfield | Rule |
| --- | --- |
| `quote` | Redacted verbatim phrase — no names, tenant IDs, or infra identifiers |
| `context` | `during-session`, `closing-interview`, or `debrief` |

### 4. Contradicting signals

`contradictingSignals[]` — evidence that **pulls against** the primary trigger. Required when any of these occurred:

- Participant said they **would** run review #2.
- Participant praised evidence trail, export, or packaging after friction earlier.
- Participant completed and rated output sponsor-ready despite complaining about process.

| Subfield | Rule |
| --- | --- |
| `signal` | Short redacted description |
| `weight` | `strong` (changes triage priority) or `weak` (note only) |

Empty array is valid only when no contradicting behavior was observed.

### 5. Before or after evidence-trail walkthrough

The **evidence-trail walkthrough** is the 3–5 minute debrief step where the facilitator opens the audit / evidence trail for **one** committed finding and asks where it is stronger than raw frontier-AI output (see [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) and [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../GENERIC_AI_BAKEOFF_PROTOCOL.md)).

| `timingRelativeToTrigger` | Meaning |
| --- | --- |
| `before-walkthrough` | Primary dismissal signal stated **before** the walkthrough began |
| `after-walkthrough` | Signal emerged **only after** seeing the evidence trail |
| `trigger-during-walkthrough` | Signal surfaced while walking the trail |
| `not-performed` | Session ended without a walkthrough (document why) |

Set `triggerShiftedAfterWalkthrough: true` when the participant's **primary** trigger category changed after the walkthrough (e.g. **D1** → **D8**). This is a high-value signal for differentiation messaging.

---

## Weekly review runbook (30 minutes)

Run every **Monday** (or within 2 business days after each new session). Owner: founder / GTM lead.

### Step 1 — Collect (5 min)

1. Gather all `dismissal-log.json` files filed since the last review (all protocols).
2. Count: total sessions, sessions with `noDismissalObserved: false`, near-dismissal count.
3. Do **not** merge into product backlog yet.

### Step 2 — Tally triggers (10 min)

| Tally | Rule |
| --- | --- |
| Primary code count | One vote per session for `primaryTriggerCode` (ignore secondary tags) |
| Confidence filter | Count **high** and **medium** only for promotion; log **low** as watch |
| Walkthrough shift | Note any session with `triggerShiftedAfterWalkthrough: true` |

### Step 3 — Prioritize top 2 only (10 min)

Select **at most two** recurring triggers to act on this week:

| Promotion rule | Action |
| --- | --- |
| Same **D*** code in **≥2** sessions (high or medium confidence) | **Promote** — eligible for product decision gate ([`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](../FIRST_SESSION_DISMISSAL_PLAYBOOK.md) § Product decision gate) |
| Same code in **1** session only | **Watch** — no action this week |
| Conflicting contradicting signals across sessions | **Observe** — schedule one more session before prioritizing |

**Hard cap:** work only the **top 2** recurring triggers by count. Park everything else until next week.

### Step 4 — Record and route (5 min)

1. Update the cohort synthesis or private weekly notes with: top-2 codes, session IDs, confidence mix, walkthrough-shift count.
2. If a promoted trigger cleared the product decision gate as **Justified now**, route to engineering via existing batch gate — do not open ad-hoc UI work.
3. File a **sanitized** weekly aggregate under [`../validation-runs/`](../validation-runs/) only when committing summary stats (counts and codes — no quotes). See [`../validation-runs/README.md`](../validation-runs/README.md).

### Anti-patterns (do not)

- Promote a trigger from a single angry quote without a second session.
- Treat facilitator impatience as participant dismissal.
- Change messaging or UI based on weekly review before **≥2** sessions confirm the same code.
- Commit raw `evidenceQuotes` to the repository.

---

## Related assets (do not duplicate)

| Asset | Role |
| --- | --- |
| [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](../FIRST_SESSION_DISMISSAL_PLAYBOOK.md) | 3-session cohort protocol + D1–D8 taxonomy + product decision gate |
| [`fixtures/first-session/dismissal-trigger.template.json`](../../../fixtures/first-session/dismissal-trigger.template.json) | Lighter first-session JSON (hesitation codes, no confidence/contradiction fields) |
| [`templates/pilot-dismissal-trigger.template.json`](../templates/pilot-dismissal-trigger.template.json) | Paid-pilot adjunct |
| [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) | Timestamped hesitation observation protocol |
| [`PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md`](../PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md) | Head-to-head dismissal interview (`protocol: blind-bakeoff` feeds this log) |
| [`GTM_BACKLOG.md`](../GTM_BACKLOG.md) **M-44** | Live cohort execution (V1.1) |
