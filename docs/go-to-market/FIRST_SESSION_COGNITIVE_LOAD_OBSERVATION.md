> **Reviewed:** 2026-07-28

> **Scope:** 45-minute first-session usability observation for Core Pilot, plus founder 3-session dismissal cohort operations (formerly `FIRST_SESSION_DISMISSAL_PLAYBOOK.md`), the sponsor-export discovery micro-test (formerly `SPONSOR_EXPORT_DISCOVERY_TEST.md`), per-session dismissal log / weekly triage plus head-to-head dismissal interview (formerly the body of `validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`; that filename remains a path-stable alias for CLI / M-44 callers), principal-architect insight validation / blind cohort / session scorecard (formerly the body of `Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`; that filename remains a path-stable alias for CLI / blind-validation callers (`#blind-insight-validation`, `#blind-cohort-operating-checklist`, `#session-scorecard`)), the pre-registered blind decision-delta cohort tracker (formerly the body of `validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md`; that filename remains a path-stable alias for GTM **M-50**), and the principal-architect evaluation packet-set index (formerly the body of `Architect_Evaluation/Packets/README.md`; that filename remains a path-stable alias beside packet binaries). No UI implementation until bottlenecks are observed and clear the product decision gate.

# First-session cognitive load observation

**Audience:** Founder / facilitator, principal-architect participant, product observer.  
**Last reviewed:** 2026-07-28

**Purpose:** Determine whether a competent principal architect reaches a **sponsor-ready architecture package** on first use **without feature-tour narration**. Measure first-session completion, export discovery, and dismissal triggers so ArchLucid can quantify **30-day voluntary usage risk** before investing in UI changes.

**Path under test:** [`CORE_PILOT.md`](../CORE_PILOT.md) · [`CANONICAL_FIRST_RUN_PATH.md#expert-principal-architect-15-minute-lane`](../library/CANONICAL_FIRST_RUN_PATH.md#expert-principal-architect-15-minute-lane) (expert 15-min lane; `FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md` alias) · [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) · [`OPERATOR_DECISION_GUIDE.md`](../library/OPERATOR_DECISION_GUIDE.md) · [`PRODUCT_PACKAGING.md`](../library/PRODUCT_PACKAGING.md)

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

## 3-session dismissal cohort (founder operations) {#3-session-dismissal-cohort-founder-operations}

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

The **evidence-trail walkthrough** is the 3–5 minute debrief step where the facilitator opens the audit / evidence trail for **one** committed finding and asks where it is stronger than raw frontier-AI output (see [principal-architect insight validation protocol](#principal-architect-insight-validation) and [`DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol`](DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol)).

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
3. File a **sanitized** weekly aggregate under [`validation-runs/`](validation-runs/) only when committing summary stats (counts and codes — no quotes). See [`#validation-runs-folder`](#validation-runs-folder).

#### Anti-patterns (do not)

- Promote a trigger from a single angry quote without a second session.
- Treat facilitator impatience as participant dismissal.
- Change messaging or UI based on weekly review before **≥2** sessions confirm the same code.
- Commit raw `evidenceQuotes` to the repository.

## Dismissal interview script (head-to-head)

**Audience:** Founder / facilitator running a 45-minute dismissal interview with a senior architect who is a daily frontier-AI user.  
**Goal:** Answer — **would this architect voluntarily come back, or dismiss ArchLucid as "I'd just do this in Claude/GPT myself"?** — and capture *why*, with evidence.  
**Companion JSON:** [`templates/principal-architect-dismissal-interview.template.json`](templates/principal-architect-dismissal-interview.template.json)

This interview is a **head-to-head dismissal test**, not an unguided first-session observation (sections above) and not a broad insight scoring pass ([principal-architect insight validation protocol](#principal-architect-insight-validation)). File one log row above with `protocol: "blind-bakeoff"` after each interview.

### What is unique (and what it reuses)

| Concern | Reused from | This interview adds |
| --- | --- | --- |
| Dismissal-trigger taxonomy (**D1–D8**) | [Dismissal-trigger taxonomy](#dismissal-trigger-taxonomy) | Applies it to a head-to-head, not a solo session |
| Per-session dismissal capture + weekly top-2 triage | [Principal architect dismissal log](#principal-architect-dismissal-log) | Interview is one `protocol: blind-bakeoff` source for the log |
| Frontier-AI baseline prompt | [Insight validation protocol](#principal-architect-insight-validation) § Frontier-AI baseline prompt | The chat-style arm of the bakeoff |
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
| Need per-finding insight scoring | Use the [principal-architect insight validation protocol](#principal-architect-insight-validation) |

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
| [Principal-architect insight validation protocol](#principal-architect-insight-validation) (alias: [`Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md)) | Per-finding insight scoring + frontier-AI baseline prompt |
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

## Principal-architect insight validation protocol {#principal-architect-insight-validation}

Former standalone body: `docs/go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`. That filename remains a path-stable alias for CLI / blind-validation callers (`Run-BlindInsightValidation.ps1`, `assemble_blind_validation_packet.py`) — see [`Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md).

**Audience:** Founder / release owner running live demos, advisory sessions, or paid pilots.  
**Duration:** 30–45 minutes per session.  
**Recommended sample:** 3–5 sessions before changing roadmap messaging; 5+ sessions before treating results as directional market evidence.

**Blind comparison + cohort ops:** [`#blind-insight-validation`](#blind-insight-validation) · [`#blind-cohort-operating-checklist`](#blind-cohort-operating-checklist) · Fillable worksheet: [`#session-scorecard`](#session-scorecard)

### Purpose

Answer the highest-value market question:

> **Do principal architects find ArchLucid outputs non-obvious, correct, evidence-backed, decision-changing, and worth repeating after the demo novelty wears off?**

This protocol is designed to test whether ArchLucid produces architecture-review value beyond a polished UI or generic frontier-AI output. It should help distinguish between:

- findings that are merely obvious but well formatted;
- findings that are useful but expected;
- findings that are non-obvious, correct, and decision-changing;
- findings that are plausible but unsupported;
- findings that are wrong or unsafe to sponsor.

This is not a substitute for shipping pilot proof mechanics. It is a market-validation instrument.

### Core hypothesis

ArchLucid is valuable if experienced architects conclude that it produces a repeatable architecture package with enough evidence, traceability, governance context, and decision impact to justify reuse in a real architecture-review process.

ArchLucid does not need to be more conversational than raw frontier AI. It needs to be more **governed, repeatable, auditable, evidence-backed, and sponsor-ready**.

### Participant profile

#### Include

- Principal architect, lead architect, staff architect, cloud architect, platform architect, security architect, enterprise architect, or CTO.
- At least 8 years of hands-on architecture review or technical governance experience.
- Experience reviewing cloud, security, reliability, cost, compliance, or operability tradeoffs.
- Willingness to criticize AI output honestly.

#### Exclude

- ArchLucid builders.
- Paid advocates who are not expected to critique honestly.
- Participants who only provide high-level sponsor reactions and cannot evaluate findings.
- Participants who have not reviewed architecture decisions in practice.

#### Ideal cohort

Run 3–5 sessions before changing roadmap messaging. Treat individual reactions as anecdotes until patterns repeat across participants.

### Session variants

Use the full protocol for paid or serious validation sessions. Use the light protocol for informal architect feedback.

#### Full protocol

Use when you have 30–45 minutes, a prepared packet, ArchLucid output, and a frontier-AI baseline.

#### Light protocol

Use when the participant is time-constrained. Still capture:

1. Their top 3 concerns after reading the packet cold.
2. Which ArchLucid findings were non-obvious.
3. Which findings were wrong or unsupported.
4. Whether ArchLucid beat raw frontier AI on insight, evidence, traceability, or sponsor readiness.
5. Whether they would use it again and why.

### Materials to prepare before the session

| Item | Source / note |
| --- | --- |
| Sanitized architecture packet | Customer-redacted packet or realistic Contoso-style sample, ideally 8–15 pages. |
| ArchLucid finalized review output | Real-mode preferred. Simulator output is acceptable only if clearly labeled as representative. |
| Frontier-AI manual baseline | Same packet reviewed in Claude Opus / GPT-5 / Gemini Pro using a principal-architect prompt. |
| Scoring sheet | [`#session-scorecard`](#session-scorecard) or equivalent shared form. |
| Blind comparison packet | Recommended for at least 2 of 5 sessions. Use [`#blind-insight-validation`](#blind-insight-validation). |
| Session log template | `templates/principal-architect-session.template.json` or equivalent notes document. |

#### Frontier-AI baseline prompt

Use the same architecture packet and do not include ArchLucid-specific outputs.

```text
You are a principal cloud architect reviewing this architecture for security, cost, reliability, compliance, and operability.
List findings by severity.
Cite assumptions.
Do not invent infrastructure, controls, dependencies, or requirements that are not in the packet.
For each finding, explain the evidence from the packet and the decision or remediation it would affect.
```

### Session flow: full protocol

| Minute | Activity | Notes |
| --- | --- | --- |
| 0–5 | Context only | Do not pitch. Explain that the goal is critique, not approval. Label simulator vs real-mode output if applicable. |
| 5–10 | Cold packet read | Participant reads the packet and notes top 3 concerns without tools. |
| 10–25 | ArchLucid review walkthrough | Walk through findings, evidence trail, architecture package, and sponsor packet. Observer stays mostly silent. |
| 25–35 | Frontier-AI baseline comparison | Show the manual frontier-AI output or let participant compare against their own pre-session baseline. |
| 35–45 | Scoring interview | Use the scoring questions and classification scheme below. |

### Session flow: light protocol

| Minute | Activity |
| --- | --- |
| 0–5 | Explain objective and ask participant to read packet summary. |
| 5–10 | Ask for their top 3 concerns before seeing ArchLucid output. |
| 10–20 | Show ArchLucid findings and evidence trail. |
| 20–25 | Show raw frontier-AI baseline if available. |
| 25–30 | Ask reuse, decision-impact, wrong/unsupported, and buying-path questions. |

### Observer instructions

The observer should avoid defending ArchLucid during the scoring portion. The goal is not to persuade the participant; the goal is to discover whether the output survives expert scrutiny.

When the participant criticizes a finding, ask for specificity:

- Is it wrong, unsupported, obvious, or merely not important?
- What evidence would have made it sponsor-safe?
- Would a competent architect have written this in the first pass?
- Would it change approval, priority, or remediation?

### Observation questions

Ask these in every session.

1. Which ArchLucid finding would you **not** have written yourself in the first pass?
2. Which finding was **wrong, overstated, or unsupported** by the packet?
3. Where is the **evidence trail** stronger than manual AI output?
4. Where did raw frontier AI perform better than ArchLucid?
5. Would you **reuse** ArchLucid for the next review cycle? Why or why not?
6. What would make you **stop** using it after two reviews?
7. Which finding would change your approval decision, approval conditions, remediation priority, or escalation path?
8. Which finding would you remove before sending the packet to an sponsor sponsor?
9. Would you use this as part of a formal architecture review board process?
10. Who in your organization would need to approve adoption or fund a pilot?
11. What would make this unsafe, embarrassing, or politically risky to use?

### Finding classification

Classify each material finding. Material findings are findings that the participant considers significant enough to discuss, score, approve, reject, or compare.

| Code | Label | Definition |
| --- | --- | --- |
| **O** | Obvious | Competent architect would likely state this without AI. |
| **U** | Useful but expected | Correct and helpful, but not surprising. |
| **N** | Non-obvious and correct | Participant did not expect it in first pass; validates against packet. |
| **D** | Decision-changing | Correct and would change approval, priority, escalation, remediation, or evidence requested. |
| **X** | Incorrect | Factually wrong, hallucinated, misapplied, or contradicted by packet. |
| **S** | Unsupported | Plausible but lacks enough evidence/citation for sponsor use. |
| **E** | Evidence-strong | Particularly well supported by the evidence trail, manifest, packet, or policy mapping. |

A finding can receive more than one code. For example, a finding can be both **N** and **D**, or **U** and **E**.

### Numeric scoring rubric

Score ArchLucid and manual frontier-AI findings separately.

| Scale 1–5 | Field | Definition |
| --- | --- | --- |
| Novelty | `novelty` | 1 = obvious; 5 = non-obvious and valuable. |
| Correctness | `correctnessConfidence` | 1 = likely wrong; 5 = high confidence vs packet. |
| Actionability | `actionability` | 1 = vague; 5 = clear next step. |
| Surprise | `surpriseFactor` | 1 = expected; 5 = would not write in first pass. |
| Decision impact | `decisionImpact` | 1 = informational; 5 = changes approval, priority, escalation, or remediation. |
| Evidence strength | `evidenceStrength` | 1 = unsupported; 5 = evidence trail is sponsor-safe. |
| Sponsor readiness | `sponsorReadiness` | 1 = would not share; 5 = would send to sponsor with minimal edits. |

### Comparison dimensions: ArchLucid vs raw frontier AI

Separate insight quality from process quality. Raw frontier AI may be more flexible or conversational; that does not automatically mean it is better for governed architecture review.

| Dimension | What to observe |
| --- | --- |
| Insight quality | Which output found better architecture issues? |
| Non-obvious findings | Which output produced more **N** or **D** findings? |
| Correctness | Which output had fewer wrong or overstated claims? |
| Evidence traceability | Which output better tied findings to packet evidence, manifest, artifacts, or policy context? |
| Repeatability | Same packet should produce comparable output and review history. |
| Governance readiness | Export labels, execution mode, evidence trail, manifest, audit rows, and exception workflow. |
| Sponsor packet quality | Would participant send the output to a CTO, CISO, architecture board, or sponsor sponsor? |
| Workflow fit | Which output fits a real architecture review board process better? |
| Time to first reviewable packet | Measure wall clock where possible; label estimates as illustrative unless measured. |
| Flexibility | Where did raw AI feel more adaptive, conversational, or exploratory? |

### Pass / fail thresholds

Use conservative thresholds. Do not broaden messaging based on one good session.

| Metric | Pass | Fail |
| --- | --- | --- |
| Non-obvious and correct share | ≥25% of material ArchLucid findings classified **N** | <15% classified **N** |
| Critical incorrect findings | 0 critical **X** | Any critical **X** |
| Minor incorrect findings | ≤1 minor **X** per session | Repeated minor **X** findings across sessions |
| Unsupported sponsor claims | Low and clearly labelable | Multiple sponsor-facing **S** findings |
| Participant reuse intent | ≥3/5 participants would reuse | ≤2/5 would reuse |
| Decision-changing moments | At least 1 **D** finding per session, or ≥3 across 5 sessions | No decision-changing findings across cohort |
| Evidence trail advantage | Majority say ArchLucid is stronger than raw AI on evidence/governance | Majority say raw AI is sufficient without ArchLucid process |
| Sponsor readiness | Majority would send an edited ArchLucid packet to a sponsor or review board | Majority would not use output outside demo context |

### What changes roadmap or messaging

| Outcome | Action |
| --- | --- |
| Pass on N-rate, D-rate, correctness, and reuse | Advance insight-density narrative; continue proof-gated GTM. |
| Fail on N-rate but pass on evidence/governance | Position ArchLucid around durability, audit, repeatability, and governance rather than superior insight. |
| Fail on X findings | Make faithfulness, retrieval, evidence binding, and claim calibration the engineering priority. Do not add new surfaces. |
| Fail on S findings | Improve evidence citation, manifest linkage, and sponsor-safe wording before expanding pilot messaging. |
| Manual AI wins on flexibility | Emphasize governed package, evidence trail, repeatability, and audit readiness. Consider conversational exploration as V1.1. |
| Participants like it but would not reuse | Investigate workflow friction, buying path, and whether findings changed real decisions. |
| Participants would reuse but cannot identify buyer | Validate adoption path with CTO/CISO/architecture board sponsor. |

### Buying-path questions

Ask after the technical scoring, not before.

1. Would you personally sponsor a pilot after seeing this output?
2. Who would own this tool: architecture, cloud platform, security, governance, compliance, or engineering productivity?
3. Who would have budget authority?
4. What existing tool or process would ArchLucid replace or augment?
5. What proof would you need before recommending adoption?
6. Would this be more valuable as a standalone tool, a workflow around existing AI, or an integration into existing governance systems?

### Blind comparison guidance

Run blind comparisons for at least 2 of 5 sessions where practical.

Present outputs as **Arm A** and **Arm B**. Do not reveal which is ArchLucid until after scoring.

Ask:

1. Which output would you trust more?
2. Which output has better evidence?
3. Which output would you send to an architecture board?
4. Which output found more non-obvious issues?
5. Which output would you rather use for the next review cycle?
6. Which output is more likely to embarrass you if sent to a sponsor?

Blind sessions reduce bias from UI polish, founder enthusiasm, or expectations about AI tools.

### Simulator-output rule

Real-mode output is preferred for validation. Simulator output is acceptable only when clearly labeled.

If simulator output is used, say:

> This is representative simulator output, not measured live execution behavior. Please judge the usefulness, evidence structure, and sponsor readiness, not runtime performance.

Do not use simulator output to claim measured execution speed, repeatability, or production reliability.

### Session notes template

```json
{
  "sessionId": "principal-architect-session-001",
  "date": "2026-06-17",
  "participantRole": "Principal Cloud Architect",
  "participantExperienceYears": 12,
  "packetName": "Claims Intake Modernization",
  "archLucidMode": "real|simulator",
  "blindComparison": false,
  "participantTop3ColdConcerns": [],
  "archLucidFindings": [
    {
      "findingId": "",
      "title": "",
      "classification": ["N", "D", "E"],
      "novelty": 0,
      "correctnessConfidence": 0,
      "actionability": 0,
      "surpriseFactor": 0,
      "decisionImpact": 0,
      "evidenceStrength": 0,
      "sponsorReadiness": 0,
      "participantComment": ""
    }
  ],
  "frontierAiFindingsSummary": "",
  "archLucidVsFrontierAi": {
    "betterInsight": "ArchLucid|FrontierAI|Tie|Mixed",
    "betterEvidence": "ArchLucid|FrontierAI|Tie|Mixed",
    "betterSponsorPacket": "ArchLucid|FrontierAI|Tie|Mixed",
    "betterWorkflowFit": "ArchLucid|FrontierAI|Tie|Mixed"
  },
  "reuseIntent1to5": 0,
  "wouldSponsorPilot": "yes|no|maybe",
  "likelyBuyerOrSponsor": "",
  "whatWouldStopUseAfterTwoReviews": "",
  "unsafeOrEmbarrassingRisk": "",
  "observerNotes": ""
}
```

### Cohort aggregation

Aggregate after at least 3 sessions. Interpret cautiously until 5+ sessions.

Track:

- **N-rate:** share of material findings classified non-obvious and correct.
- **D-rate:** share of material findings that changed approval, priority, escalation, or remediation.
- **X-rate:** incorrect findings, especially critical ones.
- **S-rate:** unsupported but plausible findings.
- **Reuse intent:** participant score and yes/no/maybe.
- **Sponsor readiness:** whether participant would send the packet onward.
- **ArchLucid vs frontier AI:** insight, evidence, sponsor packet, workflow fit.
- **Adoption path:** likely buyer, owner, and blocker.

## Blind insight validation {#blind-insight-validation}

Convert market uncertainty about **insight quality** into measurable evidence by comparing ArchLucid committed-review outputs against a **manual frontier-AI baseline** on the **same sanitized architecture packet** — without revealing which arm is which during scoring.

### What gets measured

| Dimension | Field | Scale | Definition |
| --- | --- | --- | --- |
| Novelty | `novelty` | 1–5 | 1 = obvious to any competent architect; 5 = non-obvious and valuable |
| Correctness confidence | `correctnessConfidence` | 1–5 | 1 = likely wrong vs packet; 5 = high confidence correct |
| Actionability | `actionability` | 1–5 | 1 = vague; 5 = clear sponsor/team next step |
| Surprise factor | `surpriseFactor` | 1–5 | 1 = expected in first pass; 5 = would not have written unprompted |
| Decision impact | `decisionImpact` | 1–5 | 1 = informational only; 5 = would change approval or priority |

Optional single-letter **classification** per finding: **O** / **U** / **N** / **X** / **S**.

### Blind comparison design

| Arm | Contents | Reviewer sees |
| --- | --- | --- |
| **Arm A** | Shuffled — either ArchLucid export or manual baseline | `A-F01`, `A-F02`, … anonymized text only |
| **Arm B** | The other source | `B-F01`, `B-F02`, … |

Facilitator holds `source-key.json` until scoring completes. Reviewer packet must not include run ids, tenant ids, or product branding on individual findings.

**Manual baseline:** same sanitized packet; principal-architect prompt ([`fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt`](../../fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt)); save findings list — not a chat dump — before unblinding.

### Assemble blind packet

```powershell
python scripts/assemble_blind_validation_packet.py assemble `
  --fixture fixtures/blind-validation/regulated-scenario `
  --output artifacts/blind-validation/<session-label> `
  --session-id <optional-session-id>
```

| File | Audience |
| --- | --- |
| `reviewer-packet.md` | External reviewer |
| `scoring-sheet.json` | Reviewer + facilitator |
| `blind-packet.json` | Machine-readable packet |
| `source-key.json` | **Facilitator only** — do not share during scoring |
| `facilitator-source-key.md` | Facilitator |
| `exec-summary.template.md` | Product / exec rollup template |

Optional deterministic arm order: `--seed <int>`.

### Run blind session (30–45 min)

Follow the live session flow above through scoring — but use **Arm A / Arm B** instead of named sources.

1. Reviewer reads sanitized architecture packet cold (5–10 min).
2. Reviewer scores each material finding in `scoring-sheet.json` (15–20 min).
3. Facilitator records reuse intent and blockers in `sessionMetadata`.
4. **After scoring:** reveal source mapping from `source-key.json`.

```powershell
python scripts/assemble_blind_validation_packet.py summarize `
  --scoring-sheet artifacts/blind-validation/<session-label>/scoring-sheet.json `
  --packet artifacts/blind-validation/<session-label>/blind-packet.json
```

**Interactive scoring:**

```powershell
python scripts/assemble_blind_validation_packet.py score `
  --packet-dir artifacts/blind-validation/<session-label> `
  --auto-summarize
```

**Windows wrapper:**

```powershell
.\scripts\Run-BlindInsightValidation.ps1 -SessionLabel <session-label> -InteractiveScore -AutoSummarize
```

### Blind pass thresholds (cohort level — after ≥3 sessions)

| Metric | Pass | Fail |
| --- | --- | --- |
| ArchLucid non-obvious share (N / material) | ≥25% | <15% |
| ArchLucid critical X findings | 0 | ≥1 |
| ArchLucid mean surprise vs manual arm | ≥ manual arm | materially below manual arm |
| Reuse intent | ≥3/5 yes or maybe | ≤2/5 would reuse |

### Fixture catalog

| Fixture | Path | Notes |
| --- | --- | --- |
| Regulated scenario (demo-safe) | [`fixtures/blind-validation/regulated-scenario/`](../../fixtures/blind-validation/regulated-scenario/) | Demo-derived only |
| Sample assembled packet | [`fixtures/blind-validation-regulated-scenario-sample/`](fixtures/blind-validation-regulated-scenario-sample/) | Checked-in assembler output (`--seed 42`) |

---

## Blind cohort operating checklist {#blind-cohort-operating-checklist}

**Purpose:** Run **≥3** independent blind sessions. This is the **cohort operating checklist**; it does not claim results until sessions complete.

### Facilitator checklist (before session)

| # | Check | Pass criteria |
| --- | --- | --- |
| 1 | Packet chosen | Committed run **or** demo-safe fixture — label source |
| 2 | Manual baseline ready | Same sanitized packet; findings **list** saved |
| 3 | Execution mode labeled | Simulator / Real / Fallback / Mixed |
| 4 | Evidence basis labeled | Demo-derived vs buyer-provided |
| 5 | Blind packet assembled | No product branding on individual findings |
| 6 | Source key secured | Not shared with reviewer during scoring |
| 7 | Scoring sheet ready | `scoring-sheet.json` or template |
| 8 | Participant consent | PII outside repo per scorecard |
| 9 | Time box set | 30–45 min scoring |
| 10 | Anti-claim reminder | Demo fixture ≠ live customer validation |

### Cohort aggregation commands

```powershell
python scripts/ci/run_principal_architect_cohort_batch.py `
  --json-out artifacts/principal-architect-cohort/cohort-report.json `
  --markdown-out artifacts/principal-architect-cohort/cohort-report.md
```

```powershell
python scripts/ci/aggregate_blind_insight_sessions.py `
  --sessions-dir artifacts/blind-validation `
  --json-out artifacts/blind-validation/cohort-summary.json `
  --markdown-out artifacts/blind-validation/cohort-summary.md
```

Tracker: [`#blind-decision-delta-cohort-tracker`](#blind-decision-delta-cohort-tracker) · GTM **M-50** (alias: [`validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md`](validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md)).

Folder landing / sanitize rules: [`#validation-runs-folder`](#validation-runs-folder) (alias: [`validation-runs/README.md`](validation-runs/README.md)).

---

## Validation runs folder {#validation-runs-folder}

Former standalone body: `docs/go-to-market/validation-runs/README.md` → this section (filename kept as a path-stable folder landing alias). Commit-safe home for **sanitized** summaries of validation activity that reduces *market* uncertainty (not design uncertainty) — not product claims, not customer proof.

**Path-stable alias:** [`validation-runs/README.md`](validation-runs/README.md).

What belongs under [`validation-runs/`](validation-runs/):

- Blind principal-architect cohort rollups.
- Decision-delta interview summaries from paid pilots.
- Paid-pilot conversion evidence ledger rollups (monthly aggregates).
- First-non-obvious-moment and dismissal-trigger aggregates.

It exists because [`QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots`](QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots) and the cohort playbook point here for stored summaries.

### What belongs here

| Allowed (commit) | Not allowed (store outside repo) |
| --- | --- |
| Aggregate N/X/reuse counts, means, pass/fail verdicts | Customer names, subscription IDs, raw infrastructure identifiers |
| Execution-mode and evidence-basis labels | Participant identities and verbatim quotes (unless permissioned) |
| Pre-registered thresholds and session slot status | Any demo-derived number presented as customer proof |

### How to run a cohort

Do **not** re-create protocol assets — they already exist:

- Operating checklist: [`#blind-cohort-operating-checklist`](#blind-cohort-operating-checklist)
- Scorecard: [`#session-scorecard`](#session-scorecard)
- Blind protocol: [`#blind-insight-validation`](#blind-insight-validation)
- Pre-registered tracker: [`#blind-decision-delta-cohort-tracker`](#blind-decision-delta-cohort-tracker)
- Per-session dismissal capture + weekly triage: [`#principal-architect-dismissal-log`](#principal-architect-dismissal-log)
- Paid-pilot conversion ledger: [`QUOTE_TO_PROOF_PACKET.md#paid-pilot-evidence-ledger`](QUOTE_TO_PROOF_PACKET.md#paid-pilot-evidence-ledger)
- Decision-change addendum: [`QUOTE_TO_PROOF_PACKET.md#decision-change-addendum`](QUOTE_TO_PROOF_PACKET.md#decision-change-addendum)
- Frontier-AI counterfactual cadence: [`FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md#maintenance-cadence`](FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md#maintenance-cadence)

### Guardrail

A summary may be committed under [`validation-runs/`](validation-runs/) **only after** it has been sanitized per the table above. When in doubt, keep it in private founder storage and commit only the aggregate verdict.

---

## Blind decision-delta cohort tracker {#blind-decision-delta-cohort-tracker}

Former standalone body: `docs/go-to-market/validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md` → this section (filename kept as a path-stable alias for GTM **M-50**). Pre-register the plan and thresholds **before** collecting data so results cannot be threshold-gamed after the fact. Market-validation only.

**Path-stable alias:** [`validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md`](validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md).

**Cohort label:** _(e.g. regulated-workload-2026Q3)_  
**Pre-registered (UTC):** _(date the thresholds below were frozen — set once, do not edit after first session)_  
**Facilitator:** _(name kept in private notes; leave initials only here)_  
**Status:** `pre-registered` → `in-progress` → `complete`  
**Execution tracked as:** GTM backlog **M-50** (V1.1) — running the live sessions is founder/market work, not coding-agent work.

This tracker does **not** replace the protocol assets — it is the single launch + capture surface that points at them:

- Operating checklist: [`#blind-cohort-operating-checklist`](#blind-cohort-operating-checklist)
- Scorecard: [`#session-scorecard`](#session-scorecard)
- Per-session JSON: [`templates/principal-architect-session.template.json`](templates/principal-architect-session.template.json)
- Scoring sheet JSON: [`templates/blind-validation-scoring-sheet.template.json`](templates/blind-validation-scoring-sheet.template.json)
- Cohort rollup template: [`templates/blind-validation-exec-summary.template.md`](templates/blind-validation-exec-summary.template.md)

### Pre-registered hypothesis (lock before session 1)

> ArchLucid produces a materially higher rate of **non-obvious, correct, decision-changing** findings than a competent principal architect using frontier AI manually on the **same** sanitized packet, with **zero critical wrong** findings.

### Pre-registered thresholds (do not edit after session 1)

These mirror the conservative thresholds already in the cohort checklist and scorecard. They are frozen here so the verdict is decided by the plan, not by the data.

| Metric | Pass | Fail |
| --- | --- | --- |
| Non-obvious (**N**) share of material ArchLucid findings | ≥ 25% | < 15% |
| Critical wrong / unsupported (**X**) | 0 | any critical **X** |
| Decision-changing (**D** / decision impact ≥ 4) | ≥ 1 per session, or ≥ 3 across cohort | 0 across cohort |
| Reuse intent | ≥ 2 of 3 (or ≥ 3 of 5) would run review #2 | majority would not return |
| Evidence-trail advantage vs manual AI | majority say ArchLucid stronger | majority say manual AI sufficient |

**Minimum cohort size before any messaging change:** 3 independent sessions. Target 5.

### Session slots

Fill one row per session. Keep names/quotes out of this file; store them privately per [`#validation-runs-folder`](#validation-runs-folder).

| # | Date (UTC) | Packet (label only) | ArchLucid mode (sim/real/mixed) | Evidence basis | N-rate | Critical X | Max decision impact | Reuse intent | Summary link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | | | | |
| 2 | | | | | | | | | |
| 3 | | | | | | | | | |
| 4 | | | | | | | | | |
| 5 | | | | | | | | | |

### Cohort verdict (fill after ≥ 3 sessions)

| Threshold | Result | Pass / Fail |
| --- | --- | --- |
| N-rate ≥ 25% | | |
| 0 critical X | | |
| ≥ 3 decision-changing across cohort | | |
| Reuse intent majority | | |
| Evidence-trail advantage | | |

**Overall verdict:** `pass` / `mixed` / `fail`  
**Action taken (cite the rule, not improvisation):** _(map to the roadmap-guidance table in the scorecard / cohort checklist — e.g. "fail on N-rate, pass on evidence → reposition around durability/audit, do not add features")_

### Honesty checklist (block commit until all true)

- [ ] Thresholds above were frozen before session 1 and not edited afterward.
- [ ] Source mapping revealed to reviewers only after blind scoring.
- [ ] No demo-derived session is cited as customer proof.
- [ ] Participant identities/quotes are stored outside the repository.
- [ ] Verdict follows the pre-registered thresholds, not a post-hoc rationale.

---

## Session scorecard {#session-scorecard}

**Audience:** Facilitator running expert validation sessions. Captures market uncertainty — not product claims.  
**Bakeoff framing:** [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md).

### Session metadata

| Field | Value |
| --- | --- |
| Session date (UTC) | |
| Facilitator | |
| Participant role (no names in committed artifacts) | Principal / staff architect / CTO |
| Packet label (sanitized) | e.g. Contoso retail API — no customer identifiers |
| ArchLucid execution mode | simulator / real-mode (attach gate class) |
| Frontier-AI baseline model | e.g. Claude Opus / GPT-5 — manual review |
| Transcript / notes location | Private storage path only — do not commit |
| Buyer quote redaction status | not collected / redacted / withheld |

### Artifact checklist (prepare before session)

- [ ] Sanitized architecture packet (8–15 pages)
- [ ] ArchLucid finalized review output (sponsor-safe export)
- [ ] Manual frontier-AI baseline on the same packet
- [ ] Printed or shared scoring sheet (this section)
- [ ] Real-mode / simulator label visible on ArchLucid materials

### Numeric scales (blind sessions — per finding)

When using [`#blind-insight-validation`](#blind-insight-validation), score **Arm A** and **Arm B** in `scoring-sheet.json`:

| Field | 1 | 5 |
| --- | --- | --- |
| `novelty` | Obvious to any architect | Non-obvious and valuable |
| `correctnessConfidence` | Likely wrong vs packet | High confidence correct |
| `actionability` | Vague | Clear sponsor/team next step |
| `surpriseFactor` | Expected in first pass | Would not write unprompted |
| `decisionImpact` | Informational only | Changes approval or priority |

### Finding labels (per material finding)

Rate **each material finding** separately for ArchLucid and for the manual frontier-AI baseline (or blind arms before unblinding). For the richer live-session scheme (including **D** / **E**), see [Finding classification](#finding-classification).

| Code | Label | Definition |
| --- | --- | --- |
| **O** | Obvious | Experienced architect would write this in a first pass |
| **U** | Useful | Correct and actionable but not surprising |
| **N** | Non-obvious | Correct and not expected in a first pass — primary value signal |
| **X** | Wrong / unsupported | Incorrect, missing evidence, or not grounded in the packet |
| **S** | Skipped | Not produced when it should have been |

### Session scores (counts)

| Source | O | U | N | X | S |
| --- | --- | --- | --- | --- | --- |
| ArchLucid | | | | | |
| Manual frontier AI | | | | | |

### Reuse and decision intent

| Question | Response |
| --- | --- |
| Would participant reuse ArchLucid for the next review cycle? | yes / maybe / no |
| Primary blocker to reuse (if not yes) | |
| Strongest evidence-trail advantage vs manual AI | |
| Weakest ArchLucid finding (if any X) | |

### Roadmap guidance (observation-driven)

- **High N-rate + reuse intent yes/maybe:** sharpen proof-package positioning; do not add features by default.
- **High X-rate:** treat as correctness / faithfulness work — not marketing.
- **High O-rate, low N-rate:** ArchLucid is competent but not differentiated — run more sessions before changing messaging.
- **Low reuse intent:** validate whether the gap is insight quality, workflow friction, or procurement — do not infer from a single session.

### Post-session storage

Store completed scorecards and transcripts outside the repository. Summarize aggregate N/X rates and reuse intent in private founder notes only until **≥ 3 sessions** justify a messaging update.

**Electronic capture:** Copy [`templates/first-non-obvious-moment.template.json`](templates/first-non-obvious-moment.template.json) to `artifacts/first-non-obvious-moment/<runId>/moment.json` after debrief; proof collection surfaces **`first-non-obvious-moment-report.md`**. For dismissal signals, copy [`templates/pilot-dismissal-trigger.template.json`](templates/pilot-dismissal-trigger.template.json) to `artifacts/pilot-dismissal-triggers/<runId>/dismissal.json`.

Former standalone: `docs/go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md` → this section.

## Principal-architect evaluation packet set {#principal-architect-evaluation-packet-set}

Former standalone body: `docs/go-to-market/Architect_Evaluation/Packets/README.md` → this section (filename kept as a path-stable alias beside the packet binaries).

**Path-stable alias:** [`Architect_Evaluation/Packets/README.md`](Architect_Evaluation/Packets/README.md).

Synthetic sanitized raw architecture packets for principal-architect validation sessions.

### Packet files

Each scenario has:

- `*_PARTICIPANT.md` — give this to architects (under [`Architect_Evaluation/Packets/`](Architect_Evaluation/Packets/)).
- `*_EVALUATOR.md` — includes hidden answer key and scoring guidance (under [`Architect_Evaluation/Packets/Answers/`](Architect_Evaluation/Packets/Answers/)).

### Scenarios

1. Healthcare Claims Intake Modernization
2. Retail Checkout and Loyalty API
3. Enterprise Analytics Modernization
4. Manufacturing IoT Edge Telemetry Platform
5. B2B SaaS Tenant Migration Platform

### How to use each packet

Run each packet through:

1. Principal architect cold read.
2. ArchLucid architecture package.
3. Frontier-AI baseline.
4. Scoring interview.

These packets are deliberately imperfect and include injected traps. Pair with [`#principal-architect-insight-validation`](#principal-architect-insight-validation) / [`#blind-insight-validation`](#blind-insight-validation).

## Related files (insight protocol)

- [`#session-scorecard`](#session-scorecard) (fillable worksheet)
- [`templates/blind-validation-scoring-sheet.template.json`](templates/blind-validation-scoring-sheet.template.json)
- [`templates/blind-validation-exec-summary.template.md`](templates/blind-validation-exec-summary.template.md)
- [`PILOT_ROI_MODEL.md`](PILOT_ROI_MODEL.md)
- [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md)
- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) § Proof-gated rollout

Where available:

```bash
python scripts/ci/aggregate_principal_architect_sessions.py \
  --sessions-dir artifacts/principal-architect-sessions \
  --json-out artifacts/principal-architect-sessions/cohort-summary.json \
  --markdown-out artifacts/principal-architect-sessions/cohort-summary.md
```

```bash
python scripts/ci/run_principal_architect_cohort_batch.py
```

```bash
python scripts/ci/guard_principal_architect_cohort.py
```

## Final interpretation rule

Do not declare victory because architects like the demo. Declare progress only when experienced architects say:

> “This found correct, non-obvious issues; the evidence trail made it more trustworthy than raw AI; and I would use it again in a real review cycle.”

---

## Related

- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — GTM tracking (**M-38**, **M-44**, **M-46**, **M-47**, **M-48**, **M-50**)
- [`templates/pilot-dismissal-trigger.template.json`](templates/pilot-dismissal-trigger.template.json) — JSON capture (optional adjunct)
- [Principal architect dismissal log](#principal-architect-dismissal-log) — per-session dismissal assessment + weekly top-2 triage (alias: [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md))
- [Dismissal interview script (head-to-head)](#dismissal-interview-script-head-to-head)
- [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md#first-value-in-20-minutes-time-boxed)
- [Principal-architect insight validation protocol](#principal-architect-insight-validation) — live sessions, blind comparison, cohort checklist, session scorecard (alias: [`Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md); pins: [`#blind-insight-validation`](#blind-insight-validation), [`#blind-cohort-operating-checklist`](#blind-cohort-operating-checklist), [`#session-scorecard`](#session-scorecard))
- [Blind decision-delta cohort tracker](#blind-decision-delta-cohort-tracker) — pre-registered thresholds + session slots (alias: [`validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md`](validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md); GTM **M-50**)
- [Validation runs folder](#validation-runs-folder) — sanitize rules + cohort links (alias: [`validation-runs/README.md`](validation-runs/README.md))
- [Principal-architect evaluation packet set](#principal-architect-evaluation-packet-set) — scenario list + use steps (alias: [`Architect_Evaluation/Packets/README.md`](Architect_Evaluation/Packets/README.md))
