> **Reviewed:** 2026-07-26

> **Scope:** 45-minute first-session usability observation for Core Pilot, plus founder 3-session dismissal cohort operations (formerly `FIRST_SESSION_DISMISSAL_PLAYBOOK.md`), the sponsor-export discovery micro-test (formerly `SPONSOR_EXPORT_DISCOVERY_TEST.md`), and per-session dismissal log / weekly triage plus head-to-head dismissal interview (formerly the body of `validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`; that filename remains a path-stable alias for CLI / M-44 callers). No UI implementation until bottlenecks are observed and clear the product decision gate.

# First-session cognitive load observation

**Audience:** Founder / facilitator, principal-architect participant, product observer.  
**Last reviewed:** 2026-07-26

**Purpose:** Determine whether a competent principal architect reaches a **sponsor-ready architecture package** on first use **without feature-tour narration**. Measure first-session completion, export discovery, and dismissal triggers so ArchLucid can quantify **30-day voluntary usage risk** before investing in UI changes.

**Path under test:** [`CORE_PILOT.md`](../CORE_PILOT.md) · [`FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md`](../library/FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md) (expert 15-min lane) · [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) · [`OPERATOR_DECISION_GUIDE.md`](../library/OPERATOR_DECISION_GUIDE.md) · [`PRODUCT_PACKAGING.md`](../library/PRODUCT_PACKAGING.md)

**Artifact root:** `artifacts/first-session/<cohort-label>/` (local; do not commit customer-identifying content) · fixtures: [`fixtures/first-session/README.md`](../../fixtures/first-session/README.md)

---

## Session parameters

| Parameter | Value |
| --- | --- |
| Duration | 45 minutes |
| Participant | Principal architect profile (daily frontier-AI user; low patience for process) |
| Facilitator role | Observe; intervene only on safety/blockers — **no feature tour** |
| Environment | Staging or pilot stack with Core Pilot preset |
| Success definition | Committed manifest + exportable sponsor packet with labeled execution mode |
| Recording | Screen + audio with consent; redact PII from notes |

---

## Moderator script (opening — 3 min)

> "You are evaluating whether ArchLucid helps you produce a defensible architecture package. You have 45 minutes. I'll give you a brief and one sentence of context — then I want you to work as you normally would. Ask aloud when you're stuck; I won't guide you to buttons unless you're completely blocked. The goal is sponsor-ready output, not a perfect score."

**One sentence of context (only):**

> "ArchLucid turns an architecture brief into a finalized review with findings and an exportable sponsor packet."

**Do not say:** nav tour, policy packs, Operate layer, governance dashboard, connector names, ROI math.

---

## Task list (participant-facing)

| # | Task | Time box | Done when |
| --- | --- | --- | --- |
| 1 | Read the provided architecture brief | 5 min | Participant summarizes goal in one sentence |
| 2 | Start a new review from the brief | 10 min | Review created; execute started or admitted via intake |
| 3 | Complete execute and commit | 15 min | Status = Committed |
| 4 | Open sponsor / first-value export | 10 min | Markdown or PDF preview opened |
| 5 | Answer: "Would you send this to a sponsor as-is?" | 5 min | Y / N + one reason |

**Optional stretch (if time):** Capture ROI baselines on scorecard — observe whether participant finds it without prompting.

---

## Hesitation markers (facilitator log)

Record timestamp + marker when observed:

| Code | Marker | Interpretation |
| --- | --- | --- |
| **H1** | Pauses >30s on empty screen | Discovery / wayfinding failure |
| **H2** | Opens help or docs | Self-serve gap |
| **H3** | Asks "what is X?" (product noun) | Packaging / vocabulary load |
| **H4** | Abandons intake / execute | Core path friction |
| **H5** | Cannot find export | Sponsor handoff hidden |
| **H6** | Misreads simulator as real proof | Label / trust failure |
| **H7** | Says "I could do this faster in ChatGPT" | Competitive dismissal signal |
| **H8** | Completes without scorecard baselines | ROI discipline gap (informational) |

---

## Founder-narration dependency ledger

If ArchLucid only reaches value when a founder explains it, voluntary usage and scalable sales fail.
This ledger separates **product-led** progress (the participant advanced from the one-sentence context)
from **founder-led** progress (the participant advanced only because the facilitator explained the
product). It extends — does not replace — the `Button-level rescue required` field in session notes.

**Rule:** the facilitator may intervene only on safety/blockers. Every intervention beyond that is a
**leak** and must be logged. Log **every** facilitator utterance that is not the scripted opening.

| Ledger field | Capture |
| --- | --- |
| Time (UTC) | Timestamp of the intervention |
| Trigger | What the participant was doing / stuck on |
| Intervention verbatim | Exactly what the facilitator said |
| **Type** | **safety-blocker** \| **navigation-hint** \| **product-explanation** |
| Could participant have continued without it? | **Y / N** (facilitator judgment) |

**Intervention type definitions**

| Type | Definition | Counts as founder-narration leak? |
| --- | --- | --- |
| **safety-blocker** | Environment/data/safety fix the participant could not resolve (e.g. broken stack, auth loop) | No |
| **navigation-hint** | Pointed at a button/route the participant could not find | **Yes** (wayfinding leak) |
| **product-explanation** | Explained a product noun, concept, or value the participant did not grasp | **Yes** (narration leak) |

### Session founder-dependency verdict

| Verdict | Criteria |
| --- | --- |
| **Product-led** | Reached finalized architecture package + located export with **zero** navigation-hint / product-explanation interventions (safety-blocker fixes allowed) |
| **Mixed** | Reached value but needed **1** navigation-hint or product-explanation the participant could not have worked around |
| **Founder-led** | Needed **≥2** narration leaks, **or** could not have continued without a product-explanation at a core step |

### Cohort rule

Report the **founder-narration leak rate** = sessions with ≥1 narration leak / sessions completed.
A repeated leak (same trigger in **≥2** sessions) is a confirmed bottleneck — route it through the
[product decision gate](#product-decision-gate) before scoping any onboarding/copy change. Do **not**
"fix" a one-off explanation with UI work.

---

## Success / fail criteria

### Session PASS (directional)

- Committed review within 45 minutes **without** facilitator navigation hints.
- Participant locates sponsor export unaided.
- Participant articulates execution mode or evidence limitation **or** asks a precise question about it (awareness).
- Would-send answer is **Y** with minor caveats **or** **N** with specific, actionable gap (still valuable data).

### Session FAIL (UX priority signal)

- Cannot commit within 45 minutes without facilitator button-level help.
- Cannot find export within 10 minutes of commit.
- Participant stops early citing "too much process" (**H7** + abort).
- Participant believes simulator output is live customer proof (**H6** without self-correction).

### Cohort rule

Run **≥3** sessions before UI implementation batching. Implement only bottlenecks repeated in **≥2** sessions.

---

## Synthesis template (post-session)

```markdown
# First-session observation — <participant-id>

**Date:**  
**Environment:**  
**Brief used:**  
**Committed:** Y/N  
**Time to commit (min):**  
**Export found unaided:** Y/N  
**Would send as-is:** Y/N  

## Hesitation markers

| Time | Code | Notes |
| --- | --- | --- |
| | | |

## Verbatim quotes (redacted)

- 

## Dismissal trigger (if any)

- 

## Non-obvious positive moment (if any)

- 

## Recommended product follow-up (observation-only)

- [ ] None yet — wait for cohort  
- [ ] Wayfinding:  
- [ ] Intake:  
- [ ] Export:  
- [ ] Labels:  
```

---

## 3-session dismissal cohort (founder operations)

Measure dismissal rate across a cohort before any first-session UI batch. **Cohort minimum:** **3** sessions. **UI implementation gate:** only bottlenecks seen in **≥2** sessions that clear the [product decision gate](#product-decision-gate).

### When to run

| Trigger | Action |
| --- | --- |
| Before any first-session UI batch | Run this 3-session cohort first |
| After Core Pilot path changes | Re-run one observation session; compare to prior cohort |
| When dismissal rate is unknown | Default: run full cohort before GTM claim expansion |

### Recruitment criteria

Recruit participants who match the dismissal test profile — not friendly internal champions only.

#### Must have (all)

| Criterion | Why |
| --- | --- |
| Principal / staff architect or equivalent cloud depth | Target voluntary-usage persona |
| Daily frontier-AI user (Claude, GPT, Gemini, or Cursor with strong model) | Real competitive substitute |
| Low patience for process overhead | Surfaces dismissal triggers early |
| Willing to complete 45 minutes unguided after one-sentence context | Protocol integrity |

#### Should have (≥2 of 3)

| Criterion | Why |
| --- | --- |
| Runs or participates in formal architecture reviews | Relevant job context |
| Azure-centric or regulated-enterprise exposure | Aligns with V1 ICP |
| Has not seen an ArchLucid feature tour in the last 30 days | Avoids coached navigation |

#### Disqualify

| Signal | Reason |
| --- | --- |
| Requires full product walkthrough to start | Invalidates cognitive-load signal |
| Only available for <30 minutes | Cannot complete task list |
| NDA blocks any screen recording | Weakens facilitator replay |
| ArchLucid employee or active implementation partner | Biased navigation memory |

#### Recruitment sources (priority order)

1. Paid pilot architecture lead (sanitized label only in artifacts)
2. Design-partner principal architect (pre-pilot observation)
3. Founder network principal architect (cold/warm outreach)

**Target:** 3 qualified sessions within **14 calendar days** once cohort opens.

### Cohort setup (founder checklist)

```powershell
$cohort = "cohort-2026-06"
New-Item -ItemType Directory -Force -Path "artifacts/first-session/$cohort/sessions" | Out-Null
Copy-Item fixtures/first-session/session-notes.template.md "artifacts/first-session/$cohort/sessions/session-01-notes.md"
Copy-Item fixtures/first-session/session-notes.template.md "artifacts/first-session/$cohort/sessions/session-02-notes.md"
Copy-Item fixtures/first-session/session-notes.template.md "artifacts/first-session/$cohort/sessions/session-03-notes.md"
Copy-Item fixtures/first-session/cohort-synthesis.template.md "artifacts/first-session/$cohort/cohort-synthesis.md"
```

| Step | Owner | Done when |
| --- | --- | --- |
| Open cohort folder | Founder | `artifacts/first-session/<cohort>/` exists |
| Confirm staging/pilot stack Core Pilot preset | Founder | `/health/ready` green |
| Select sanitized architecture brief (same brief all 3 sessions OR rotate — document choice) | Founder | Brief path recorded in cohort synthesis |
| Schedule 3 sessions (45 min each) | Founder | Calendar holds |
| Capture consent for screen + audio | Founder | Consent noted per session |

### Moderator one-pager

Print or keep on second monitor. **Do not** deviate into feature tours.

#### Before session (5 min)

- [ ] Environment: staging or pilot stack, Core Pilot preset
- [ ] Brief loaded (participant has not seen ArchLucid UI yet this session)
- [ ] Timer visible (45 min total)
- [ ] `session-NN-notes.md` open for timestamped logging
- [ ] Recording started (if consented)

#### During session

| Do | Do not |
| --- | --- |
| Log hesitation markers (H1–H8) with timestamps | Point at sidebar or buttons |
| Note verbatim dismissal phrases | Explain product nouns unprompted |
| Intervene only on safety/blockers | Rescue before 2+ minutes of struggle unless blocked |

#### Closing questions (5 min)

1. "Would you send this to a sponsor as-is?" → Y / N + one reason
2. "What would make you run review #2 here vs ChatGPT/Claude?" → one sentence
3. "Single biggest friction?" → one sentence

#### After session (10 min)

- [ ] Complete `session-NN-notes.md`
- [ ] File `dismissal-trigger.json` if dismissal or near-dismissal observed (template: `fixtures/first-session/dismissal-trigger.template.json`)
- [ ] File full dismissal assessment via [principal architect dismissal log](#principal-architect-dismissal-log) + JSON template (confidence, contradicting signals, evidence-trail walkthrough timing)
- [ ] Mark session PASS / FAIL per protocol criteria

### Dismissal-trigger taxonomy

Use **one primary category** per session. Secondary tags optional.

| Code | Label | Observable signal | Example quote (redacted) |
| --- | --- | --- | --- |
| **D1** | Equivalent to frontier AI | Output quality ≈ manual AI; no packaging pull | "I'd just paste this into Claude." |
| **D2** | Process overhead | Too many steps before value | "Too much process for day one." |
| **D3** | Wayfinding failure | Cannot find core path without help | "Where do I even start a review?" |
| **D4** | Export / handoff hidden | Commits but cannot find sponsor export | "I committed — now what do I send?" |
| **D5** | Trust / label failure | Misreads simulator as live proof | "So this is production evidence?" |
| **D6** | Vocabulary load | Product nouns block progress | "What is an architecture package?" |
| **D7** | Finding quality doubt | Does not trust findings enough to send | "Half of these aren't actionable." |
| **D8** | No dismissal | Completes; no near-dismissal signal | — |

**Near-dismissal:** participant completes but states they would **not** return without a named fix — record primary category + `finalOutcome: near-dismissal`.

**Dismissal rate (cohort):** `(sessions with primary D1–D7) / (completed sessions)` — report in cohort synthesis even if denominator < 3.

### Timestamped session notes

Use [`fixtures/first-session/session-notes.template.md`](../../fixtures/first-session/session-notes.template.md) per session. Minimum fields:

- `timeToCommitMin`, `exportFoundUnaided`, `wouldSendAsIs`
- Hesitation table: `HH:MM:SS` + code + note
- `primaryDismissalCode` (D1–D8)
- Session disposition: PASS / FAIL

### Cohort synthesis rubric

After **3** sessions, complete [`fixtures/first-session/cohort-synthesis.template.md`](../../fixtures/first-session/cohort-synthesis.template.md).

#### Bottleneck promotion rules

| Evidence | Action |
| --- | --- |
| Same hesitation code (H*) in **≥2** sessions | Promote to **confirmed bottleneck** |
| Same dismissal code (D*) in **≥2** sessions | Promote to **confirmed dismissal theme** |
| Issue in **1** session only | Log as **watch** — no UI batch |
| Zero sessions committed | Cohort **FAIL** — fix environment/brief before UI work |

### Product decision gate

Synthesis without a decision gate becomes anecdote collection. After promotion, run **every confirmed
bottleneck** (≥2 sessions) through this gate **before** any UI/product work is scoped. One row per
confirmed bottleneck in the cohort-synthesis "Product decision gate" table.

| Gate field | Question to answer | Why it matters |
| --- | --- | --- |
| **Uncertainty type** | Is this **design uncertainty** (we know it's broken; a UI/copy change fixes it) or **market uncertainty** (we don't yet know if the behavior persists or is buyer-acceptable)? | Design → may justify a change now; market → needs more observed evidence, not code |
| **Observed evidence** | Exact sessions + codes + verbatim signal (no paraphrase inflation) | Prevents promoting a vibe into a backlog item |
| **Change justified?** | **Y / N** — is a product change warranted *now*, or only after more sessions? | The gate's core go/no-go |
| **Smallest viable change** | If Y: the minimal copy/UX change (not a redesign) | Keeps the batch surgical |
| **Do NOT change yet** | What looks tempting but lacks ≥2-session evidence — explicitly parked | Stops scope creep and one-off-driven churn |

**Gate decision rules**

| Condition | Gate outcome |
| --- | --- |
| Confirmed bottleneck **and** design uncertainty **and** smallest viable change is copy/UX-local | **Justified now** — eligible for the UI batch |
| Confirmed bottleneck **but** market uncertainty (behavior may not persist / may be buyer-acceptable) | **Observe more** — schedule additional sessions; do not code |
| Promoted from **1** session only | **Watch** — never enters the gate; no change |
| Conflicting evidence across sessions | **Observe more** — resolve before scoping |

A confirmed bottleneck does **not** automatically justify a change. Only bottlenecks that clear this
gate as **Justified now** may proceed to the engineering batch gate below.

### Engineering batch gate

**Do not** open a UI implementation batch until:

1. Cohort synthesis is complete, and
2. At least one confirmed bottleneck exists **or** cohort documents zero bottlenecks with 3× PASS, and
3. At least one confirmed bottleneck has cleared the **product decision gate** above as **Justified now**
   (a confirmed bottleneck still in **Observe more** or **Watch** does not authorize a batch).

---

## Principal architect dismissal log

**Audience:** Founder / facilitator after each principal-architect session (first-session cohort, blind bakeoff, or paid-pilot debrief).  
**Companion JSON:** [`validation/templates/principal-architect-dismissal-log.template.json`](validation/templates/principal-architect-dismissal-log.template.json)  
**Interview capture JSON:** [`templates/principal-architect-dismissal-interview.template.json`](templates/principal-architect-dismissal-interview.template.json)  
**Execution tracked as:** GTM backlog **M-44 (V1.1)** — filing real logs requires live sessions; this instrument is the V1 design half.  
**Path-stable alias:** [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md) (CLI / backlog callers).

This log answers one question per session: **what is the single most likely reason this architect would not return voluntarily?** It includes the [head-to-head dismissal interview](#dismissal-interview-script-head-to-head) (`protocol: blind-bakeoff`). It complements — does not replace — the cohort playbook above, lighter JSON adjuncts, and synthesis rubric.

### When to file

| Session type | File one log when | Storage path (local; do not commit raw quotes) |
| --- | --- | --- |
| First-session cohort | Session ends (dismissal, near-dismissal, or explicit no-dismissal) | `artifacts/first-session/<cohort>/sessions/session-NN-dismissal-log.json` |
| Blind bakeoff / insight validation | Debrief completes | `artifacts/principal-architect/<runId>/dismissal-log.json` |
| Paid-pilot debrief | Within 48 h of handoff | `artifacts/pilot-dismissal-triggers/<runId>/dismissal-log.json` |

Copy the JSON template before each session. Set `noDismissalObserved: true` when no dismissal or near-dismissal signal occurred — still file the log so weekly review has a complete denominator.

### Required fields (per session)

#### 1. Single most likely dismissal trigger

Pick **one** primary code from the [Dismissal-trigger taxonomy](#dismissal-trigger-taxonomy) (**D1–D8**). Use **D8** only when no near-dismissal signal occurred.

| Field (JSON) | Rule |
| --- | --- |
| `primaryTriggerCode` | One of **D1–D8** |
| `primaryTriggerLabel` | Matching label (e.g. `export-handoff-hidden` for **D4**) |

Secondary hesitation codes (H1–H8) belong in session notes — not as a second primary trigger.

#### 2. Confidence level

| Level | When to use |
| --- | --- |
| **high** | Verbatim participant quote **and** observable behavior (aborted, refused review #2, explicit "I would not use this") |
| **medium** | Hesitation codes + closing-interview answer imply dismissal; no single smoking-gun quote |
| **low** | Facilitator hypothesis only — flag for re-validation in the next session |

Record `confidenceRationale` in one sentence. Weekly triage may **ignore** low-confidence singletons until a second session confirms the same code.

#### 3. Evidence from participant quotes

`evidenceQuotes[]` — minimum **one** redacted quote when dismissal or near-dismissal observed; empty array when `noDismissalObserved: true`.

| Subfield | Rule |
| --- | --- |
| `quote` | Redacted verbatim phrase — no names, tenant IDs, or infra identifiers |
| `context` | `during-session`, `closing-interview`, or `debrief` |

#### 4. Contradicting signals

`contradictingSignals[]` — evidence that **pulls against** the primary trigger. Required when any of these occurred:

- Participant said they **would** run review #2.
- Participant praised evidence trail, export, or packaging after friction earlier.
- Participant completed and rated output sponsor-ready despite complaining about process.

| Subfield | Rule |
| --- | --- |
| `signal` | Short redacted description |
| `weight` | `strong` (changes triage priority) or `weak` (note only) |

Empty array is valid only when no contradicting behavior was observed.

#### 5. Before or after evidence-trail walkthrough

The **evidence-trail walkthrough** is the 3–5 minute debrief step where the facilitator opens the audit / evidence trail for **one** committed finding and asks where it is stronger than raw frontier-AI output (see [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) and [`DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol`](DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol)).

| `timingRelativeToTrigger` | Meaning |
| --- | --- |
| `before-walkthrough` | Primary dismissal signal stated **before** the walkthrough began |
| `after-walkthrough` | Signal emerged **only after** seeing the evidence trail |
| `trigger-during-walkthrough` | Signal surfaced while walking the trail |
| `not-performed` | Session ended without a walkthrough (document why) |

Set `triggerShiftedAfterWalkthrough: true` when the participant's **primary** trigger category changed after the walkthrough (e.g. **D1** → **D8**). This is a high-value signal for differentiation messaging.

### Weekly review runbook (30 minutes)

Run every **Monday** (or within 2 business days after each new session). Owner: founder / GTM lead.

#### Step 1 — Collect (5 min)

1. Gather all `dismissal-log.json` files filed since the last review (all protocols).
2. Count: total sessions, sessions with `noDismissalObserved: false`, near-dismissal count.
3. Do **not** merge into product backlog yet.

#### Step 2 — Tally triggers (10 min)

| Tally | Rule |
| --- | --- |
| Primary code count | One vote per session for `primaryTriggerCode` (ignore secondary tags) |
| Confidence filter | Count **high** and **medium** only for promotion; log **low** as watch |
| Walkthrough shift | Note any session with `triggerShiftedAfterWalkthrough: true` |

#### Step 3 — Prioritize top 2 only (10 min)

Select **at most two** recurring triggers to act on this week:

| Promotion rule | Action |
| --- | --- |
| Same **D*** code in **≥2** sessions (high or medium confidence) | **Promote** — eligible for [product decision gate](#product-decision-gate) |
| Same code in **1** session only | **Watch** — no action this week |
| Conflicting contradicting signals across sessions | **Observe** — schedule one more session before prioritizing |

**Hard cap:** work only the **top 2** recurring triggers by count. Park everything else until next week.

#### Step 4 — Record and route (5 min)

1. Update the cohort synthesis or private weekly notes with: top-2 codes, session IDs, confidence mix, walkthrough-shift count.
2. If a promoted trigger cleared the product decision gate as **Justified now**, route to engineering via existing batch gate — do not open ad-hoc UI work.
3. File a **sanitized** weekly aggregate under [`validation-runs/`](validation-runs/) only when committing summary stats (counts and codes — no quotes). See [`validation-runs/README.md`](validation-runs/README.md).

#### Anti-patterns (do not)

- Promote a trigger from a single angry quote without a second session.
- Treat facilitator impatience as participant dismissal.
- Change messaging or UI based on weekly review before **≥2** sessions confirm the same code.
- Commit raw `evidenceQuotes` to the repository.

## Dismissal interview script (head-to-head)

**Audience:** Founder / facilitator running a 45-minute dismissal interview with a senior architect who is a daily frontier-AI user.  
**Goal:** Answer — **would this architect voluntarily come back, or dismiss ArchLucid as "I'd just do this in Claude/GPT myself"?** — and capture *why*, with evidence.  
**Companion JSON:** [`templates/principal-architect-dismissal-interview.template.json`](templates/principal-architect-dismissal-interview.template.json)

This interview is a **head-to-head dismissal test**, not an unguided first-session observation (sections above) and not a broad insight scoring pass ([`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md)). File one log row above with `protocol: "blind-bakeoff"` after each interview.

### What is unique (and what it reuses)

| Concern | Reused from | This interview adds |
| --- | --- | --- |
| Dismissal-trigger taxonomy (**D1–D8**) | [Dismissal-trigger taxonomy](#dismissal-trigger-taxonomy) | Applies it to a head-to-head, not a solo session |
| Per-session dismissal capture + weekly top-2 triage | [Principal architect dismissal log](#principal-architect-dismissal-log) | Interview is one `protocol: blind-bakeoff` source for the log |
| Frontier-AI baseline prompt | [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) § Frontier-AI baseline prompt | The chat-style arm of the bakeoff |
| Honest "where each wins" framing | [`DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol`](DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol) | Randomized arm order to remove order/polish bias |
| Decision-delta + budget questions | [`QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots`](QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots) | Two decisive new questions (below) |
| Recruitment / disqualification profile | [Recruitment criteria](#recruitment-criteria) | Same profile — do not relax it |

**The two decisive questions:**

1. **30-day voluntary reuse:** *"Which part of what you saw, if any, would you voluntarily reuse in the next 30 days without anyone asking you to?"*
2. **Pay-to-avoid:** *"What here would you pay to avoid doing manually — and roughly what price band?"*

### When to run (dismissal interview)

| Trigger | Action |
| --- | --- |
| Validating 30-day voluntary usage + frontier-AI survival | Run this interview |
| Need unguided first-use friction signal | Use the first-session observation protocol above instead |
| Need per-finding insight scoring | Use [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) |

**Recommended sample:** 6–8 sessions before treating dismissal-rate results as directional. Treat single sessions as anecdotes.

### Recruitment (do not relax)

Use the **exact** profile in [Recruitment criteria](#recruitment-criteria). Non-negotiable: principal / staff / lead architect; **daily** frontier-AI user; low tolerance for process overhead; honest critic. If not a fluent frontier-AI user, reschedule — the substitute test is invalid.

### Materials to prepare

| Item | Source / note |
| --- | --- |
| Sanitized architecture packet | One packet for **both** arms. Customer-redacted or Contoso-style, 8–15 pages. |
| **Arm A — chat-style frontier-AI critique** | Same packet via Claude/GPT/Gemini using the baseline prompt in the insight validation protocol. Save transcript + findings list. |
| **Arm B — governed ArchLucid package** | Finalized review on the same packet: findings + policy/compliance mapping, evidence trail, architecture package, audit rows, sponsor packet. Real-mode preferred; label simulator output. |
| Randomized arm order | Decide and record **before** the session. |
| Capture template | [`templates/principal-architect-dismissal-interview.template.json`](templates/principal-architect-dismissal-interview.template.json) |
| Dismissal log | [Principal architect dismissal log](#principal-architect-dismissal-log) + JSON template (filed after the session) |

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
3. Where did each approach clearly beat the other? (Force one honest win for each — see [`DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol`](DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol).)
4. **30-day voluntary reuse:** "Which part of either approach, if any, would you voluntarily reuse in the next 30 days without anyone asking you to?" — capture `thirtyDayReuse.*`.
5. **Pay-to-avoid:** "What here would you pay to avoid doing manually — and roughly what price band?" — capture `payToAvoid.*`.

If #4 is "neither" and #5 is "nothing", that is a **dismissal** — proceed to Step 5.

#### Step 5 — Reveal + dismissal probe (4 min)

> "Approach [A/B] was ArchLucid. Knowing that now — what is the single most likely reason you would *not* come back to it?"

Capture exactly **one** primary dismissal trigger (**D1–D8**). Then run the 3–5 minute **evidence-trail walkthrough** and note whether the trigger shifts (see [Before or after evidence-trail walkthrough](#5-before-or-after-evidence-trail-walkthrough) above). A shift from **D1** to **D8** after the walkthrough is the highest-value differentiation signal.

#### Step 6 — Budget / buyer (4 min)

Reuse [`QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots`](QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots) budget questions and the insight validation protocol § Buying-path questions. Minimum capture: `likelyBuyerOrSponsor`, `wouldSponsorPilot` (`yes|no|maybe`).

### Interview redaction rules

Same as [`QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots`](QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots) § Redaction rules — never commit raw `evidenceQuotes` or price bands tied to a named participant.

### Interview PASS / FAIL (per session)

| Outcome | Criteria |
| --- | --- |
| **PASS** | Participant names **≥1** concrete thing they would voluntarily reuse in 30 days (Q4 = yes) **and** identifies at least one task worth paying to avoid (Q5 non-empty), with ArchLucid (Arm B) as the source |
| **WARN** | Reuse intent is "maybe", or pay-to-avoid value lands on packaging/audit only |
| **DISMISSAL** | Q4 = neither/no **and** Q5 = nothing; record the single **D1–D8** trigger and whether the evidence-trail walkthrough shifted it |

Cohort dismissal rate = `(sessions with DISMISSAL) / (completed sessions)` — report even when the denominator < 6.

### After the interview

- [ ] Complete the interview capture JSON (local; do not commit raw quotes).
- [ ] File the per-session dismissal log ([principal architect dismissal log](#principal-architect-dismissal-log)) with `protocol: "blind-bakeoff"`.
- [ ] Feed the weekly **top-2 triage** runbook above — do **not** open product/UI work off a single session.
- [ ] When decision delta is material, attach a buyer-safe [`QUOTE_TO_PROOF_PACKET.md#decision-change-addendum`](QUOTE_TO_PROOF_PACKET.md#decision-change-addendum) to the proof packet.

Storage: `artifacts/principal-architect/<runId>/dismissal-interview.json` (local).

### Interview anti-patterns

- Reveal which arm is ArchLucid before Step 5.
- Use a frontier-AI-illiterate participant.
- Use different packets per arm.
- Promote a dismissal trigger from a single session — wait for **≥2** sessions with the same code.
- Present simulator output as measured live proof.
- Claim "ArchLucid is smarter than GPT-5" — see [`DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol`](DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol) § Anti-patterns.

### Related assets (do not duplicate)

| Asset | Role |
| --- | --- |
| [3-session dismissal cohort](#3-session-dismissal-cohort-founder-operations) | Cohort protocol + D1–D8 taxonomy + product decision gate |
| [`fixtures/first-session/dismissal-trigger.template.json`](../../fixtures/first-session/dismissal-trigger.template.json) | Lighter first-session JSON (hesitation codes, no confidence/contradiction fields) |
| [`templates/pilot-dismissal-trigger.template.json`](templates/pilot-dismissal-trigger.template.json) | Paid-pilot adjunct |
| [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) | Per-finding insight scoring + frontier-AI baseline prompt |
| [`DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol`](DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol) | Honest "where each wins" comparison rubric |
| [`QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots`](QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots) | Post-pilot decision-delta + budget questions |
| [`GTM_BACKLOG.md`](GTM_BACKLOG.md) **M-44** | Live cohort execution (V1.1) |

Former standalone body: `docs/go-to-market/validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md` → this section (filename kept as a path-stable alias for CLI / M-44).  
Former standalone script: `docs/go-to-market/PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md` → [dismissal interview script](#dismissal-interview-script-head-to-head).

---

## Sponsor export discovery test (focused micro-test)

Focused ~10-minute no-code usability test isolating one question — can a first-time principal architect find the sponsor-sendable export **after commit** without help? (Formerly `SPONSOR_EXPORT_DISCOVERY_TEST.md`.)

For a full first-use evaluation, run the 45-minute protocol above; this micro-test is the **scoped regression** for the export moment only (H5 / D4).

### Path under test (V1, shipped surfaces only)

Grounded in [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) **Phase D**:

| Step | Shipped affordance | Success signal |
| --- | --- | --- |
| Start state | A **committed** review exists (Phase C5 done; manifest id visible) | Review detail shows committed manifest + artifacts |
| D1b | **"Next after commit"** card — one **primary** action (sponsor packet) | Primary CTA scrolls to sponsor deliverables |
| D2 | **Export sponsor packet** (markdown/DOCX/PDF) **or** **"Email this review to your sponsor"** | Download/email succeeds; ROI basis label shows evidence source |
| Proof status | Run detail → **Proof status** strip (**READY / WARN / HOLD**) | Operator reads send/hold disposition correctly |

The participant starts on the **finalized review detail** screen. They are **not** told where the export lives. Use the operator status vocabulary (READY/WARN/HOLD) — do not invent parallel labels.

### When to run (export micro-test)

| Trigger | Action |
| --- | --- |
| After any Core Pilot path or review-detail change | Run this micro-test (1–3 participants) as a regression |
| Before scoping any export/handoff UI work | Run this first; only repeated failure justifies a change |
| Inside a full first-session cohort | Do not run separately — the 45-min protocol already covers H5/D4 |

**Repeated-failure rule:** Do **not** propose UI changes from a single failed participant. A change is only eligible when failure repeats in **≥2** participants and the bottleneck clears the [product decision gate](#product-decision-gate) as **Justified now**.

### Setup (facilitator)

| Step | Done when |
| --- | --- |
| Staging/pilot stack, Core Pilot preset, buyer-default shell (`NEXT_PUBLIC_OPERATOR_EXPERIENCE` unset) | `/health/ready` green |
| One review already **committed** for the participant (you commit it; they start at review detail) | Manifest id visible on review detail |
| Timer + capture sheet open | Capture table below ready |
| Recording (if consented) | Started |

**One sentence of context (only):** "You've just finished a review — send it to your sponsor."  
**Never say:** "sponsor packet", "export", "Email this review", "proof status", or point at the card.

### Task (participant-facing)

> "The review is committed. Get it to your sponsor the way you would in real life."

Time box: **10 minutes**. Facilitator intervenes only on safety/blockers, never on wayfinding.

### Capture (one row per participant)

| Field | Value |
| --- | --- |
| Participant label | `<pseudonymous>` |
| Time to export found (s) | (commit-screen → sponsor packet / email affordance opened) |
| Export found unaided | Y / N |
| Wrong turns (count + where) | e.g. opened Operate/compare, searched nav, opened audit |
| Terminology confusion (verbatim) | e.g. "What's a manifest? Is that what I send?" |
| H5 observed (cannot find export) | Y / N + timestamp |
| Would send as-is | Y / N + one reason |
| Read proof status (READY/WARN/HOLD) correctly | Y / N |
| Disposition | PASS / FAIL |

#### PASS / FAIL (directional)

- **PASS:** participant opens the sponsor packet export or "Email this review to your sponsor" affordance **unaided within 10 minutes**, and correctly reads the proof-status disposition before sending.
- **FAIL:** cannot find the export unaided in 10 minutes (**H5**), or sends despite a **HOLD/WARN** disposition without acknowledging it (**D4** + label/trust risk).

### Rollup → product decision gate

| Metric | Value |
| --- | --- |
| Export-found-unaided rate | /N |
| Median time-to-export-found (s) | |
| H5 (cannot find export) count | /N |
| Most common wrong turn | |
| Most common terminology confusion | |

**Gate handoff:** if H5 / D4 repeats in **≥2** participants, file it as a confirmed bottleneck and run it through the [product decision gate](#product-decision-gate). Only a bottleneck that clears as **Justified now** (design uncertainty, copy/UX-local) may open a UI batch — for example, a single explicit "Send to sponsor / Export" affordance on the commit confirmation, not an export-hub redesign.

---

## Related

- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — GTM tracking (**M-38**, **M-44**, **M-46**, **M-47**, **M-48**)
- [`templates/pilot-dismissal-trigger.template.json`](templates/pilot-dismissal-trigger.template.json) — JSON capture (optional adjunct)
- [Principal architect dismissal log](#principal-architect-dismissal-log) — per-session dismissal assessment + weekly top-2 triage (alias: [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md))
- [Dismissal interview script (head-to-head)](#dismissal-interview-script-head-to-head)
- [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md#first-value-in-20-minutes-time-boxed)
- [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#blind-cohort-operating-checklist)
