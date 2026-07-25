> **Scope:** 45-minute first-session usability observation for Core Pilot — market validation design; no UI implementation until bottlenecks are observed.

# First-session cognitive load observation

**Audience:** Founder / facilitator, principal-architect participant, product observer.  
**Last reviewed:** 2026-06-16

**Purpose:** Determine whether a competent principal architect reaches a **sponsor-ready architecture package** on first use **without feature-tour narration**. This reduces market uncertainty about Time-to-Value and voluntary usage — not design uncertainty about individual widgets.

**Path under test:** [`CORE_PILOT.md`](../CORE_PILOT.md) · [`FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md`](../library/FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md) (expert 15-min lane) · [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) · [`OPERATOR_DECISION_GUIDE.md`](../library/OPERATOR_DECISION_GUIDE.md) · [`PRODUCT_PACKAGING.md`](../library/PRODUCT_PACKAGING.md)

**Founder operations:** [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) (3-session cohort, moderator one-pager, dismissal taxonomy, synthesis rubric) · fixtures: [`fixtures/first-session/README.md`](../../fixtures/first-session/README.md)

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
A repeated leak (same trigger in **≥2** sessions) is a confirmed bottleneck — route it through
[`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) § Product decision gate
before scoping any onboarding/copy change. Do **not** "fix" a one-off explanation with UI work.

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

## Related

- [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md)
- [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md#first-value-in-20-minutes-time-boxed)
- [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#blind-cohort-operating-checklist)
