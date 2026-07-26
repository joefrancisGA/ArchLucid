> **Reviewed:** 2026-07-26

> **Scope:** Per-session dismissal-trigger capture + weekly triage runbook for principal-architect validation, plus the head-to-head dismissal interview script (formerly `PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md`). Market-validation instrumentation only — not product claims.

# Principal architect dismissal log

**Audience:** Founder / facilitator after each principal-architect session (first-session cohort, blind bakeoff, or paid-pilot debrief).  
**Companion JSON:** [`templates/principal-architect-dismissal-log.template.json`](templates/principal-architect-dismissal-log.template.json)  
**Interview capture JSON:** [`../templates/principal-architect-dismissal-interview.template.json`](../templates/principal-architect-dismissal-interview.template.json)  
**Execution tracked as:** GTM backlog **M-44 (V1.1)** — filing real logs requires live sessions; this instrument is the V1 design half.

This log answers one question per session: **what is the single most likely reason this architect would not return voluntarily?** It includes the [head-to-head dismissal interview](#dismissal-interview-script-head-to-head) (`protocol: blind-bakeoff`). It complements — does not replace — the cohort playbook, lighter JSON adjuncts, and synthesis rubric.

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

Pick **one** primary code from the taxonomy in [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) § Dismissal-trigger taxonomy (**D1–D8**). Use **D8** only when no near-dismissal signal occurred.

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
| Same **D*** code in **≥2** sessions (high or medium confidence) | **Promote** — eligible for product decision gate ([`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) § Product decision gate) |
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

## Dismissal interview script (head-to-head)

**Audience:** Founder / facilitator running a 45-minute dismissal interview with a senior architect who is a daily frontier-AI user.  
**Goal:** Answer — **would this architect voluntarily come back, or dismiss ArchLucid as "I'd just do this in Claude/GPT myself"?** — and capture *why*, with evidence.  
**Companion JSON:** [`../templates/principal-architect-dismissal-interview.template.json`](../templates/principal-architect-dismissal-interview.template.json)

This interview is a **head-to-head dismissal test**, not an unguided first-session observation ([`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md)) and not a broad insight scoring pass ([`../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md)). File one log row above with `protocol: "blind-bakeoff"` after each interview.

### What is unique (and what it reuses)

| Concern | Reused from | This interview adds |
| --- | --- | --- |
| Dismissal-trigger taxonomy (**D1–D8**) | [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) § Dismissal-trigger taxonomy | Applies it to a head-to-head, not a solo session |
| Per-session dismissal capture + weekly top-2 triage | Sections above in this document | Interview is one `protocol: blind-bakeoff` source for the log |
| Frontier-AI baseline prompt | [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) § Frontier-AI baseline prompt | The chat-style arm of the bakeoff |
| Honest "where each wins" framing | [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../GENERIC_AI_BAKEOFF_PROTOCOL.md) | Randomized arm order to remove order/polish bias |
| Decision-delta + budget questions | [`PAID_PILOT_EVIDENCE_LEDGER.md#decision-delta-interview-paid-pilots`](PAID_PILOT_EVIDENCE_LEDGER.md#decision-delta-interview-paid-pilots) | Two decisive new questions (below) |
| Recruitment / disqualification profile | [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) § Recruitment criteria | Same profile — do not relax it |

**The two decisive questions:**

1. **30-day voluntary reuse:** *"Which part of what you saw, if any, would you voluntarily reuse in the next 30 days without anyone asking you to?"*
2. **Pay-to-avoid:** *"What here would you pay to avoid doing manually — and roughly what price band?"*

### When to run

| Trigger | Action |
| --- | --- |
| Validating 30-day voluntary usage + frontier-AI survival | Run this interview |
| Need unguided first-use friction signal | Use [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) instead |
| Need per-finding insight scoring | Use [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) |

**Recommended sample:** 6–8 sessions before treating dismissal-rate results as directional. Treat single sessions as anecdotes.

### Recruitment (do not relax)

Use the **exact** profile in [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) § Recruitment criteria. Non-negotiable: principal / staff / lead architect; **daily** frontier-AI user; low tolerance for process overhead; honest critic. If not a fluent frontier-AI user, reschedule — the substitute test is invalid.

### Materials to prepare

| Item | Source / note |
| --- | --- |
| Sanitized architecture packet | One packet for **both** arms. Customer-redacted or Contoso-style, 8–15 pages. |
| **Arm A — chat-style frontier-AI critique** | Same packet via Claude/GPT/Gemini using the baseline prompt in the insight validation protocol. Save transcript + findings list. |
| **Arm B — governed ArchLucid package** | Finalized review on the same packet: findings + policy/compliance mapping, evidence trail, architecture package, audit rows, sponsor packet. Real-mode preferred; label simulator output. |
| Randomized arm order | Decide and record **before** the session. |
| Capture template | [`../templates/principal-architect-dismissal-interview.template.json`](../templates/principal-architect-dismissal-interview.template.json) |
| Dismissal log | This document + JSON template (filed after the session) |

**Both arms must use the same packet.**

### Randomization

| Session number (within cohort) | First arm shown | Second arm shown |
| --- | --- | --- |
| Odd (1, 3, 5, 7) | **Arm A** (chat-style frontier AI) | **Arm B** (governed ArchLucid) |
| Even (2, 4, 6, 8) | **Arm B** (governed ArchLucid) | **Arm A** (chat-style frontier AI) |

- Record `armOrder` (`A-then-B` or `B-then-A`) in the capture JSON **before** the session.
- Present arms as neutral **"Approach 1"** and **"Approach 2"** — do **not** say which is ArchLucid until after the comparison questions (Step 4 reveal).
- Do **not** narrate product nouns while presenting either arm; reveal vocabulary only at Step 5.

### Session flow (45 minutes)

| Minute | Step | Facilitator does |
| --- | --- | --- |
| 0–4 | 1. Context (verbatim) | Read opening script; do not pitch |
| 4–9 | 2. Cold packet read | Participant lists top 3 concerns before seeing either arm |
| 9–19 | 3. First arm (per `armOrder`) | Present neutrally as "Approach 1"; participant thinks aloud |
| 19–29 | 3. Second arm (per `armOrder`) | Present neutrally as "Approach 2"; participant thinks aloud |
| 29–37 | 4. Blind comparison + the two decisive questions | Ask comparison + reuse + pay-to-avoid **before** reveal |
| 37–41 | 5. Reveal + dismissal probe | Reveal which arm was ArchLucid; capture single dismissal trigger |
| 41–45 | 6. Budget / buyer | Ask buying-path questions |

#### Step 1 — Context (verbatim, 4 min)

> "I'm going to show you two approaches to reviewing the same architecture packet. I am not going to tell you who built either one until the end. I want your honest reaction as the person who would actually have to use this. There are no wrong answers, and it's completely fine to tell me one or both are not worth your time. The goal is to find out what, if anything, you'd actually keep using."

**Never say** during Steps 1–4: "ArchLucid", product nouns, ROI math, or which approach is the product.

#### Step 2 — Cold packet read (5 min)

> "Before you see either approach — read the packet and tell me your top three concerns."

Capture `participantTop3ColdConcerns[]`.

#### Step 3 — Present both arms (20 min, order per `armOrder`)

For each arm:

> "Here's Approach [1/2]. Walk through it the way you would if this landed on your desk. Think aloud — tell me what you trust, what you'd throw out, and what you'd have to redo yourself."

While presenting **Arm B** silently make visible (do not name): policy/compliance mapping, evidence trail for at least one finding, execution-mode label, sponsor packet/export. While presenting **Arm A** show the raw transcript and findings list. Log think-aloud dismissal phrases verbatim (redacted).

#### Step 4 — Blind comparison + the two decisive questions (8 min)

Ask **before** revealing which arm is ArchLucid:

1. Which approach found the more useful issues for *this* packet?
2. Which approach would you trust more if a sponsor asked you to *prove* a finding?
3. Where did each approach clearly beat the other? (Force one honest win for each — see [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../GENERIC_AI_BAKEOFF_PROTOCOL.md).)
4. **30-day voluntary reuse:** "Which part of either approach, if any, would you voluntarily reuse in the next 30 days without anyone asking you to?" — capture `thirtyDayReuse.*`.
5. **Pay-to-avoid:** "What here would you pay to avoid doing manually — and roughly what price band?" — capture `payToAvoid.*`.

If #4 is "neither" and #5 is "nothing", that is a **dismissal** — proceed to Step 5.

#### Step 5 — Reveal + dismissal probe (4 min)

> "Approach [A/B] was ArchLucid. Knowing that now — what is the single most likely reason you would *not* come back to it?"

Capture exactly **one** primary dismissal trigger (**D1–D8**). Then run the 3–5 minute **evidence-trail walkthrough** and note whether the trigger shifts (see § Before or after evidence-trail walkthrough above). A shift from **D1** to **D8** after the walkthrough is the highest-value differentiation signal.

#### Step 6 — Budget / buyer (4 min)

Reuse [`PAID_PILOT_EVIDENCE_LEDGER.md#decision-delta-interview-paid-pilots`](PAID_PILOT_EVIDENCE_LEDGER.md#decision-delta-interview-paid-pilots) budget questions and the insight validation protocol § Buying-path questions. Minimum capture: `likelyBuyerOrSponsor`, `wouldSponsorPilot` (`yes|no|maybe`).

### Interview redaction rules

Same as [`PAID_PILOT_EVIDENCE_LEDGER.md#decision-delta-interview-paid-pilots`](PAID_PILOT_EVIDENCE_LEDGER.md#decision-delta-interview-paid-pilots) § Redaction rules — never commit raw `evidenceQuotes` or price bands tied to a named participant.

### Interview PASS / FAIL (per session)

| Outcome | Criteria |
| --- | --- |
| **PASS** | Participant names **≥1** concrete thing they would voluntarily reuse in 30 days (Q4 = yes) **and** identifies at least one task worth paying to avoid (Q5 non-empty), with ArchLucid (Arm B) as the source |
| **WARN** | Reuse intent is "maybe", or pay-to-avoid value lands on packaging/audit only |
| **DISMISSAL** | Q4 = neither/no **and** Q5 = nothing; record the single **D1–D8** trigger and whether the evidence-trail walkthrough shifted it |

Cohort dismissal rate = `(sessions with DISMISSAL) / (completed sessions)` — report even when the denominator < 6.

### After the interview

- [ ] Complete the interview capture JSON (local; do not commit raw quotes).
- [ ] File the per-session dismissal log (this document) with `protocol: "blind-bakeoff"`.
- [ ] Feed the weekly **top-2 triage** runbook above — do **not** open product/UI work off a single session.
- [ ] When decision delta is material, attach a buyer-safe [`PAID_PILOT_EVIDENCE_LEDGER.md#decision-change-addendum`](PAID_PILOT_EVIDENCE_LEDGER.md#decision-change-addendum) to the proof packet.

Storage: `artifacts/principal-architect/<runId>/dismissal-interview.json` (local).

### Interview anti-patterns

- Reveal which arm is ArchLucid before Step 5.
- Use a frontier-AI-illiterate participant.
- Use different packets per arm.
- Promote a dismissal trigger from a single session — wait for **≥2** sessions with the same code.
- Present simulator output as measured live proof.
- Claim "ArchLucid is smarter than GPT-5" — see [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../GENERIC_AI_BAKEOFF_PROTOCOL.md) § Anti-patterns.

---

## Related assets (do not duplicate)

| Asset | Role |
| --- | --- |
| [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) | 3-session cohort protocol + D1–D8 taxonomy + product decision gate |
| [`fixtures/first-session/dismissal-trigger.template.json`](../../../fixtures/first-session/dismissal-trigger.template.json) | Lighter first-session JSON (hesitation codes, no confidence/contradiction fields) |
| [`templates/pilot-dismissal-trigger.template.json`](../templates/pilot-dismissal-trigger.template.json) | Paid-pilot adjunct |
| [`../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](../Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) | Per-finding insight scoring + frontier-AI baseline prompt |
| [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../GENERIC_AI_BAKEOFF_PROTOCOL.md) | Honest "where each wins" comparison rubric |
| [`PAID_PILOT_EVIDENCE_LEDGER.md#decision-delta-interview-paid-pilots`](PAID_PILOT_EVIDENCE_LEDGER.md#decision-delta-interview-paid-pilots) | Post-pilot decision-delta + budget questions |
| [`GTM_BACKLOG.md`](../GTM_BACKLOG.md) **M-44** | Live cohort execution (V1.1) |

Former standalone script: `docs/go-to-market/PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md` → [dismissal interview script](#dismissal-interview-script-head-to-head).
