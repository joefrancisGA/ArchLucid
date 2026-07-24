> **Scope:** Founder-led 3-session first-session dismissal-rate measurement — market validation operations; no UI changes until cohort synthesis identifies repeated bottlenecks (≥2 sessions).

# First-session dismissal playbook (3-session cohort)

**Audience:** Founder / facilitator running principal-architect first-use observations.  
**Last reviewed:** 2026-06-17

**Purpose:** Measure first-session completion, export discovery, and dismissal triggers so ArchLucid can quantify **30-day voluntary usage risk** before investing in UI changes.

**Canonical protocol:** [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md)  
**Artifact root:** `artifacts/first-session/<cohort-label>/` (local; do not commit customer-identifying content)

---

## When to run

| Trigger | Action |
| --- | --- |
| Before any first-session UI batch | Run this 3-session cohort first |
| After Core Pilot path changes | Re-run one observation session; compare to prior cohort |
| When dismissal rate is unknown | Default: run full cohort before GTM claim expansion |

**Cohort minimum:** **3** sessions. **UI implementation gate:** only bottlenecks seen in **≥2** sessions.

---

## Recruitment criteria

Recruit participants who match the dismissal test profile — not friendly internal champions only.

### Must have (all)

| Criterion | Why |
| --- | --- |
| Principal / staff architect or equivalent cloud depth | Target voluntary-usage persona |
| Daily frontier-AI user (Claude, GPT, Gemini, or Cursor with strong model) | Real competitive substitute |
| Low patience for process overhead | Surfaces dismissal triggers early |
| Willing to complete 45 minutes unguided after one-sentence context | Protocol integrity |

### Should have (≥2 of 3)

| Criterion | Why |
| --- | --- |
| Runs or participates in formal architecture reviews | Relevant job context |
| Azure-centric or regulated-enterprise exposure | Aligns with V1 ICP |
| Has not seen an ArchLucid feature tour in the last 30 days | Avoids coached navigation |

### Disqualify

| Signal | Reason |
| --- | --- |
| Requires full product walkthrough to start | Invalidates cognitive-load signal |
| Only available for <30 minutes | Cannot complete task list |
| NDA blocks any screen recording | Weakens facilitator replay |
| ArchLucid employee or active implementation partner | Biased navigation memory |

### Recruitment sources (priority order)

1. Paid pilot architecture lead (sanitized label only in artifacts)
2. Design-partner principal architect (pre-pilot observation)
3. Founder network principal architect (cold/warm outreach)

**Target:** 3 qualified sessions within **14 calendar days** once cohort opens.

---

## Cohort setup (founder checklist)

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

---

## Moderator one-pager

Print or keep on second monitor. **Do not** deviate into feature tours.

### Before session (5 min)

- [ ] Environment: staging or pilot stack, Core Pilot preset
- [ ] Brief loaded (participant has not seen ArchLucid UI yet this session)
- [ ] Timer visible (45 min total)
- [ ] `session-NN-notes.md` open for timestamped logging
- [ ] Recording started (if consented)

### Opening script (3 min — verbatim)

> "You are evaluating whether ArchLucid helps you produce a defensible architecture package. You have 45 minutes. I'll give you a brief and one sentence of context — then I want you to work as you normally would. Ask aloud when you're stuck; I won't guide you to buttons unless you're completely blocked. The goal is sponsor-ready output, not a perfect score."

**One sentence of context (only):**

> "ArchLucid turns an architecture brief into a committed review with findings and an exportable sponsor packet."

**Never say:** nav tour, policy packs, Operate layer, governance dashboard, connector names, ROI math.

### During session

| Do | Do not |
| --- | --- |
| Log hesitation markers (H1–H8) with timestamps | Point at sidebar or buttons |
| Note verbatim dismissal phrases | Explain product nouns unprompted |
| Intervene only on safety/blockers | Rescue before 2+ minutes of struggle unless blocked |

### Closing questions (5 min)

1. "Would you send this to a sponsor as-is?" → Y / N + one reason
2. "What would make you run review #2 here vs ChatGPT/Claude?" → one sentence
3. "Single biggest friction?" → one sentence

### After session (10 min)

- [ ] Complete `session-NN-notes.md`
- [ ] File `dismissal-trigger.json` if dismissal or near-dismissal observed (template: `fixtures/first-session/dismissal-trigger.template.json`)
- [ ] File full dismissal assessment via [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md) + JSON template (confidence, contradicting signals, evidence-trail walkthrough timing)
- [ ] Mark session PASS / FAIL per protocol criteria

---

## Dismissal-trigger taxonomy

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

---

## Timestamped session notes

Use [`fixtures/first-session/session-notes.template.md`](../../fixtures/first-session/session-notes.template.md) per session. Minimum fields:

- `timeToCommitMin`, `exportFoundUnaided`, `wouldSendAsIs`
- Hesitation table: `HH:MM:SS` + code + note
- `primaryDismissalCode` (D1–D8)
- Session disposition: PASS / FAIL

---

## Cohort synthesis rubric

After **3** sessions, complete [`fixtures/first-session/cohort-synthesis.template.md`](../../fixtures/first-session/cohort-synthesis.template.md).

### Bottleneck promotion rules

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

## Related

- [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md) — protocol detail
- [`SPONSOR_EXPORT_DISCOVERY_TEST.md`](SPONSOR_EXPORT_DISCOVERY_TEST.md) — focused ~10-min export-discovery micro-test (scoped regression for the H5/D4 export moment)
- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — GTM tracking
- [`templates/pilot-dismissal-trigger.template.json`](templates/pilot-dismissal-trigger.template.json) — JSON capture (optional adjunct)
- [`validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md`](validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md) — per-session dismissal assessment + weekly top-2 triage runbook (assessment Improvement #2)
- [`PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md`](PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md) — head-to-head dismissal interview (randomized chat-style vs governed package; assessment Improvement #3)
- [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md#first-value-in-20-minutes-time-boxed)
