> **Scope:** Founder-led structured dismissal interview for the principal-architect persona who already uses frontier AI well. Market-validation instrument (V1 design half). Running it with real participants is GTM backlog **M-44 (V1.1)** — a coding agent cannot perform the live sessions.

# Principal architect dismissal interview script

**Audience:** Founder / facilitator running a 45-minute dismissal interview with a senior architect who is a daily frontier-AI user.
**Goal:** Answer one question per session — **would this architect voluntarily come back, or dismiss ArchLucid as "I'd just do this in Claude/GPT myself"?** — and capture *why*, with evidence, not vibes.
**Companion JSON:** [`templates/principal-architect-dismissal-interview.template.json`](templates/principal-architect-dismissal-interview.template.json)
**Execution tracked as:** GTM backlog **M-44 (V1.1)**. This document is the reusable **design half** (the script); filing real interviews requires live sessions.

This script tests assessment Improvement **#3**. It is deliberately a **head-to-head dismissal test**, not an unguided first-session observation ([`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md)) and not a broad insight scoring pass ([`Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md)). Use those for their purposes; use this when the explicit question is **dismissal risk against frontier AI**.

---

## What is unique to this script (and what it reuses)

Reuse aggressively. Do **not** redefine anything below — link to it.

| Concern | Reused from | This script adds |
| --- | --- | --- |
| Dismissal-trigger taxonomy (**D1–D8**) | [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) § Dismissal-trigger taxonomy | Applies it to a head-to-head, not a solo session |
| Per-session dismissal capture + weekly top-2 triage | [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md) | This interview is one `protocol: blind-bakeoff` source for that log |
| Frontier-AI baseline prompt | [`Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) § Frontier-AI baseline prompt | The chat-style arm of the bakeoff |
| Honest "where each wins" framing | [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md) | Randomized arm order to remove order/polish bias |
| Decision-delta + budget questions | [`DECISION_DELTA_INTERVIEW.md`](DECISION_DELTA_INTERVIEW.md) | Two decisive new questions (below) |
| Recruitment / disqualification profile | [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) § Recruitment criteria | Same profile — do not relax it |

**The two decisive questions this script exists to ask:**

1. **30-day voluntary reuse:** *"Which part of what you saw, if any, would you voluntarily reuse in the next 30 days without anyone asking you to?"*
2. **Pay-to-avoid:** *"What here would you pay to avoid doing manually — and roughly what price band?"*

Everything else in the session exists to make the answers to these two questions credible.

---

## When to run

| Trigger | Action |
| --- | --- |
| Validating 30-day voluntary usage + frontier-AI survival | Run this script |
| Need unguided first-use friction signal | Use [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) instead |
| Need per-finding insight scoring | Use [`Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) |

**Recommended sample:** 6–8 sessions before treating dismissal-rate results as directional (matches assessment #3 plan). Treat single sessions as anecdotes.

---

## Recruitment (do not relax)

Use the **exact** profile in [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) § Recruitment criteria. The non-negotiable for this script:

- Principal / staff / lead architect (or equivalent cloud depth).
- **Daily** frontier-AI user (Claude / GPT / Gemini / Cursor with a strong model) — they are the real substitute under test.
- Low tolerance for process overhead.
- Honest critic, not a friendly champion or ArchLucid builder.

If a participant is not a fluent frontier-AI user, the dismissal test is invalid — they cannot judge the substitute. Reschedule.

---

## Materials to prepare (before the session)

| Item | Source / note |
| --- | --- |
| Sanitized architecture packet | One packet, used for **both** arms. Customer-redacted or Contoso-style, 8–15 pages. |
| **Arm A — chat-style frontier-AI critique** | Same packet run through Claude/GPT/Gemini using the baseline prompt in [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) § Frontier-AI baseline prompt. Save transcript + findings list. |
| **Arm B — governed ArchLucid package** | Finalized review on the same packet: findings + **policy/compliance mapping**, evidence trail, architecture package (API: golden manifest), audit rows, sponsor packet. Real-mode preferred; label simulator output explicitly. |
| Randomized arm order | See § Randomization. Decide and record **before** the session. |
| Capture template | [`templates/principal-architect-dismissal-interview.template.json`](templates/principal-architect-dismissal-interview.template.json) |
| Dismissal log | [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md) + its JSON template (filed after the session) |

**Both arms must use the same packet.** Different packets confound the comparison.

---

## Randomization (remove order and polish bias)

Frontier-AI fluency means these architects anchor hard on whichever arm they see first. Counterbalance.

| Session number (within cohort) | First arm shown | Second arm shown |
| --- | --- | --- |
| Odd (1, 3, 5, 7) | **Arm A** (chat-style frontier AI) | **Arm B** (governed ArchLucid) |
| Even (2, 4, 6, 8) | **Arm B** (governed ArchLucid) | **Arm A** (chat-style frontier AI) |

Rules:

- Record `armOrder` (`A-then-B` or `B-then-A`) in the capture JSON **before** the session.
- Present the two arms as neutral **"Approach 1"** and **"Approach 2"** — do **not** say which is ArchLucid until after the comparison questions (§ Step 4 reveal).
- Do **not** narrate product nouns (policy packs, architecture package / golden manifest, Operate layer) while presenting either arm; let the artifacts speak. Reveal vocabulary only at § Step 5.

---

## Session flow (45 minutes)

| Minute | Step | Facilitator does |
| --- | --- | --- |
| 0–4 | 1. Context (verbatim) | Read opening script; do not pitch |
| 4–9 | 2. Cold packet read | Participant lists top 3 concerns before seeing either arm |
| 9–19 | 3. First arm (per `armOrder`) | Present neutrally as "Approach 1"; participant thinks aloud |
| 19–29 | 3. Second arm (per `armOrder`) | Present neutrally as "Approach 2"; participant thinks aloud |
| 29–37 | 4. Blind comparison + the two decisive questions | Ask comparison + reuse + pay-to-avoid **before** reveal |
| 37–41 | 5. Reveal + dismissal probe | Reveal which arm was ArchLucid; capture single dismissal trigger |
| 41–45 | 6. Budget / buyer | Ask buying-path questions |

### Step 1 — Context (verbatim, 4 min)

> "I'm going to show you two approaches to reviewing the same architecture packet. I am not going to tell you who built either one until the end. I want your honest reaction as the person who would actually have to use this. There are no wrong answers, and it's completely fine to tell me one or both are not worth your time. The goal is to find out what, if anything, you'd actually keep using."

**Never say** during Steps 1–4: "ArchLucid", product nouns, ROI math, or which approach is the product.

### Step 2 — Cold packet read (5 min)

> "Before you see either approach — read the packet and tell me your top three concerns."

Capture `participantTop3ColdConcerns[]`. This anchors whether either arm surfaces something the architect missed.

### Step 3 — Present both arms (20 min, order per `armOrder`)

For each arm, in the randomized order:

> "Here's Approach [1/2]. Walk through it the way you would if this landed on your desk. Think aloud — tell me what you trust, what you'd throw out, and what you'd have to redo yourself."

While presenting **Arm B (governed ArchLucid)** silently make these visible (do not name them): policy/compliance mapping on findings, the evidence trail for at least one finding, execution-mode label, and the sponsor packet/export. While presenting **Arm A (chat-style)** show the raw transcript and findings list as a working architect would actually receive them.

Log think-aloud dismissal phrases verbatim (redacted) as you go.

### Step 4 — Blind comparison + the two decisive questions (8 min)

Ask in this order, **before** revealing which arm is ArchLucid:

**Comparison (reuse the bakeoff dimensions):**

1. Which approach found the more useful issues for *this* packet?
2. Which approach would you trust more if a sponsor asked you to *prove* a finding?
3. Where did each approach clearly beat the other? (Force one honest win for each — see [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md).)

**The two decisive questions (the reason this script exists):**

4. **30-day voluntary reuse:** "Which part of either approach, if any, would you voluntarily reuse in the next 30 days without anyone asking you to?"
   - Capture: `thirtyDayReuse.wouldReuse` (`yes|no|maybe`), `thirtyDayReuse.whatExactly`, `thirtyDayReuse.whichArm` (`A|B|both|neither`).
5. **Pay-to-avoid:** "What here would you pay to avoid doing manually — and roughly what price band?"
   - Capture: `payToAvoid.task`, `payToAvoid.whichArm`, `payToAvoid.priceBand` (free-text band, e.g. "low-4-figures/seat/yr"), `payToAvoid.wouldNotPay` (bool).

If the answer to #4 is "neither" and #5 is "nothing", that is a **dismissal** — proceed to Step 5 to capture the trigger precisely.

### Step 5 — Reveal + dismissal probe (4 min)

> "Approach [A/B] was ArchLucid. Knowing that now — what is the single most likely reason you would *not* come back to it?"

Capture exactly **one** primary dismissal trigger using the **D1–D8** taxonomy in [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md). Then run the 3–5 minute **evidence-trail walkthrough** on one finding and note whether the trigger shifts (see [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md) § Before or after evidence-trail walkthrough). A trigger that shifts from **D1** ("equivalent to frontier AI") to **D8** after the walkthrough is the highest-value differentiation signal.

### Step 6 — Budget / buyer (4 min)

Reuse [`DECISION_DELTA_INTERVIEW.md`](DECISION_DELTA_INTERVIEW.md) budget questions and [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) § Buying-path questions. Minimum capture: `likelyBuyerOrSponsor`, `wouldSponsorPilot` (`yes|no|maybe`).

---

## Redaction rules

Identical to [`DECISION_DELTA_INTERVIEW.md`](DECISION_DELTA_INTERVIEW.md) § Redaction rules:

- Remove customer name, subscription IDs, and raw infrastructure identifiers unless permissioned.
- Keep finding category + severity + decision outcome; drop employee names unless quoted with approval.
- Label execution mode (**Real / Simulator / Mixed**) on any exported excerpt.
- Never commit raw `evidenceQuotes` or price bands tied to a named participant.

---

## PASS / FAIL (per session)

| Outcome | Criteria |
| --- | --- |
| **PASS** | Participant names **≥1** concrete thing they would voluntarily reuse in 30 days (Q4 = yes) **and** identifies at least one task worth paying to avoid (Q5 non-empty), with ArchLucid (Arm B) as the source |
| **WARN** | Reuse intent is "maybe", or pay-to-avoid value lands on packaging/audit only (still valuable — record as governance-led, not insight-led) |
| **DISMISSAL** | Q4 = neither/no **and** Q5 = nothing; record the single **D1–D8** trigger and whether the evidence-trail walkthrough shifted it |

Cohort dismissal rate = `(sessions with DISMISSAL) / (completed sessions)` — report even when the denominator < 6.

---

## After the session

- [ ] Complete [`templates/principal-architect-dismissal-interview.template.json`](templates/principal-architect-dismissal-interview.template.json) (local storage; do not commit raw quotes).
- [ ] File the per-session dismissal log via [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md) with `protocol: "blind-bakeoff"`.
- [ ] Feed the weekly **top-2 triage** runbook in that same log — do **not** open product/UI work off a single session.
- [ ] When decision delta is material, attach a buyer-safe [`validation/DECISION_CHANGE_ADDENDUM.md`](validation/DECISION_CHANGE_ADDENDUM.md) to the proof packet.

Storage paths follow the dismissal log: `artifacts/principal-architect/<runId>/dismissal-interview.json` (local; do not commit customer-identifying content).

---

## Anti-patterns (do not)

- Reveal which arm is ArchLucid before Step 5 (destroys the dismissal signal).
- Use a frontier-AI-illiterate participant (invalidates the substitute test).
- Use different packets per arm.
- Promote a dismissal trigger or a pay-to-avoid claim from a single session — wait for **≥2** sessions with the same code (see the dismissal log weekly triage).
- Present simulator output as measured live proof.
- Claim "ArchLucid is smarter than GPT-5" — see [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md) § Anti-patterns.

---

## Related (do not duplicate)

| Asset | Role |
| --- | --- |
| [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) | D1–D8 taxonomy + unguided first-session cohort + product decision gate |
| [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md) | Per-session dismissal capture + weekly top-2 triage |
| [`Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) | Per-finding insight scoring + frontier-AI baseline prompt |
| [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md) | Honest "where each wins" comparison rubric |
| [`DECISION_DELTA_INTERVIEW.md`](DECISION_DELTA_INTERVIEW.md) | Post-pilot decision-delta + budget questions |
| [`GTM_BACKLOG.md`](GTM_BACKLOG.md) **M-44** | Live cohort execution (V1.1) |
