> **Scope:** Founder-led sponsor message test — three concise scripts answering "Why ArchLucid instead of more Claude/GPT/Gemini seats?" Market validation only; no product changes.

# Model seats counter-positioning message test

**Audience:** Founder / facilitator before executive sponsor or procurement conversations where frontier-AI seat expansion is the default alternative.

**Last reviewed:** 2026-06-17

**Purpose:** Test whether sponsors accept the **Architecture Proof Engine** framing versus buying more general-purpose model seats. Reduce fragile counter-positioning before purchase conversations scale.

**Grounding rule:** Every claim in the scripts below maps to shipped V1 capability or an honest limitation documented in `docs/go-to-market` and `docs/library`. Do **not** claim ArchLucid always beats frontier AI on speed, novelty, or cost per query. See [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) and [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md).

**Canonical evidence:**

| Topic | Source |
| --- | --- |
| Sponsor narrative | [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) |
| Manual vs proof package | [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) §5 |
| Ad-hoc AI comparison | [`COMPETITIVE_LANDSCAPE.md`](COMPETITIVE_LANDSCAPE.md) §4.4 |
| Differentiation matrix | [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) |
| Bakeoff honesty | [`FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md`](FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md) |
| ROI basis labels | [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) · [`ROI_MODEL.md`](ROI_MODEL.md) |

**Artifact root:** `artifacts/model-seats/<cohort-label>/` (local; do not commit customer-identifying content)

**Fixtures:** [`fixtures/model-seats-counter-positioning/`](../../fixtures/model-seats-counter-positioning/)

---

## When to run

| Trigger | Action |
| --- | --- |
| Before scaling sponsor outreach | Run full 3-session message test |
| After a sponsor says "we already have Copilot seats" | Log session; compare to prior cohort |
| After bakeoff scoreboard shows L1/L3/L7 loss modes | Re-test Script C with honest loss acknowledgment |

**Cohort minimum:** **3** sponsor conversations (different accounts or roles). **External claim gate:** do not publish "beats ChatGPT" language until synthesis passes.

---

## Three sponsor scripts (≤90 seconds each)

Use **one script per conversation** in the test cohort. Rotate A → B → C across sessions.

### Script A — Accountability and governance

> "You already pay for frontier models — and your architects should keep using them for exploration. ArchLucid is not a replacement for a $20-a-month chat seat.
>
> ArchLucid is for when a design has to survive architecture review, audit, or procurement: a **finalized architecture package**, **evidence-linked findings** with explainability traces, **append-only audit events**, and optional **governance gates** before handoff. Chat transcripts do not give you that durable proof package.
>
> The pilot question is not 'can AI answer architecture questions?' — it is 'can we produce a **defensible architecture package** faster, with a trail someone can reconstruct six months later?' That is what [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) and our differentiation packet describe as shipped today."

**Evidence anchors:** architecture package · `ExplainabilityTrace` · typed audit · pre-finalize governance ([`POSITIONING.md`](POSITIONING.md) §4 table).

### Script B — Repeatable proof package vs ephemeral chat

> "More model seats help individuals draft faster. ArchLucid helps the **organization** repeat architecture proof: same structured pipeline — topology, cost, compliance, critic — to a **versioned manifest**, sponsor export, and **two-review compare** when the design changes.
>
> Generic AI gives strong first drafts; [`COMPETITIVE_LANDSCAPE.md`](COMPETITIVE_LANDSCAPE.md) §4.4 is explicit that ad-hoc tools win on zero setup and breadth. ArchLucid wins when you need **repeatability, drift comparison, and labeled ROI basis** — not when someone only wants a one-off brainstorm.
>
> Pilot success is measured on time to finalized architecture package and traceability — not on beating ChatGPT prose in a single session."

**Evidence anchors:** multi-agent pipeline · two-review compare · sponsor first-value report · ROI basis labels ([`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md)).

### Script C — Decision system vs chat (honest counterfactual)

> "If your only need is exploratory Q&A, buy more seats — ArchLucid is the wrong tool.
>
> If your bottleneck is **review preparation, decision traceability, and governance evidence**, seats alone leave you reconstructing conclusions from email and chat history. ArchLucid packages evidence, findings, and exports in one review workflow — and we run **honest bakeoffs** against manual frontier-AI review on the same evidence, tracking decision-change count and repeat-use intent without claiming we always win on first-draft speed.
>
> The buy decision is: do you need a **chat assistant** or a **proof engine** your ARB can sign off on?"

**Evidence anchors:** bakeoff protocol · scoreboard L1–L7 loss modes · [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md).

---

## Disqualifying objections (do not counter-sell)

Stop or pivot when the sponsor's need matches these — **model seats are the right answer**.

| Objection | Why it disqualifies ArchLucid (for now) | Pivot |
| --- | --- | --- |
| "We only need faster first drafts" | L1 loss mode territory; ArchLucid is not optimized for ad-hoc speed | Acknowledge; offer bakeoff only if they also have formal review pain |
| "We won't run a finalized review" | Value is in the defensible architecture package, not chat ([`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) § When not a fit) | Qualify out or propose service-led single review deliverable |
| "Azure-native hosting is a hard blocker" | [`SHOULD_YOU_EVALUATE.md`](SHOULD_YOU_EVALUATE.md#when-archlucid-is-not-a-fit) · [`COMPETITIVE_POSITIONING.md`](COMPETITIVE_POSITIONING.md) | Resolve platform fit before pilot |
| "We need CPA SOC 2 / external pen test before any pilot" | V1.1 backlog; self-assessment only ([`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md)) | Trust Center + defer or route to TB-135/TB-136 only if owner directs |
| "Copilot is $20/mo unlimited — prove cheaper TCO" | [`COMPETITIVE_LANDSCAPE.md`](COMPETITIVE_LANDSCAPE.md) §4.4 — cost per interaction favors chat | Reframe to risk-of-undocumented-decisions, not seat price |
| "We need native Jira/ServiceNow/Slack day one" | V1.1 connectors per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) | REST/CLI/export handoff only |

**Hard fail for external use:** sponsor still believes ArchLucid replaces all frontier-AI usage after Script A — messaging failed; do not scale outreach.

---

## Recommended next-question flow

After delivering a script, use this sequence. Stop when disqualified.

```
1. "Where does architecture review slow down today — preparation, alignment, or audit reconstruction?"
   → If only "faster drafting" → disqualify or Script C pivot

2. "Do you need a durable artifact after review — manifest, audit trail, sponsor export?"
   → No → disqualify (chat suffices)

3. "Would a second review need to compare against the first package with structured deltas?"
   → Yes → Script B proof points; mention two-review compare

4. "Who signs off — ARB, security, procurement — and what evidence do they require?"
   → Governance / audit → Script A; offer Trust Center index

5. "Are you open to a controlled pilot with labeled ROI basis — not guaranteed savings?"
   → Yes → CORE_PILOT path; No → hold

6. "Would you run the same redacted evidence through your preferred frontier AI for a bakeoff row?"
   → Yes → schedule bakeoff; append scoreboard (M-40)
   → No → pilot on proof-package value only; no superiority claims
```

Record answers in the session template. Tag **primary script**, **disqualifier hit (Y/N)**, and **recommended pilot motion**.

---

## Message test protocol (3 sessions)

### Setup

```powershell
$cohort = "cohort-2026-06"
$root = "artifacts/model-seats/$cohort"
New-Item -ItemType Directory -Force -Path "$root/sessions" | Out-Null
Copy-Item fixtures/model-seats-counter-positioning/message-test-session.template.md "$root/sessions/session-01.md"
Copy-Item fixtures/model-seats-counter-positioning/message-test-session.template.md "$root/sessions/session-02.md"
Copy-Item fixtures/model-seats-counter-positioning/message-test-session.template.md "$root/sessions/session-03.md"
Copy-Item fixtures/model-seats-counter-positioning/cohort-synthesis.template.md "$root/cohort-synthesis.md"
```

| Step | Owner | Done when |
| --- | --- | --- |
| Recruit 3 executive sponsors or budget holders | Founder | Distinct accounts or roles |
| Assign script rotation A / B / C | Founder | One primary script per session |
| Run next-question flow | Founder | Template § Flow complete |
| Score pass/fail per session | Founder | Template § Scoring complete |
| Synthesize cohort | Founder | `cohort-synthesis.md` within 7 days of session 3 |

### Per-session pass criteria

| Criterion | Pass |
| --- | --- |
| Sponsor distinguishes chat assistant vs proof engine | Yes — can restate in their words |
| No over-claim correction needed | Founder did not walk back a false superiority claim |
| Disqualifier handled honestly | Pivot or qualify-out when triggered |
| Next step named | Pilot, bakeoff, hold, or disqualify |

**Cohort pass:** ≥2 of 3 sessions pass **and** at least one names a concrete pilot or bakeoff next step.

**Cohort hold:** 0–1 passes — rewrite scripts using `cohort-synthesis.md` loss notes; re-run before claim expansion.

---

## Cohort synthesis outputs

After session 3, complete `cohort-synthesis.md`:

| Output | Use |
| --- | --- |
| Best-performing script (A/B/C) | Default for next 5 sponsor calls |
| Top disqualifying objection | Update [`PROCUREMENT_OBJECTION_PLAYBOOK.md`](PROCUREMENT_OBJECTION_PLAYBOOK.md) private notes |
| Phrases that resonated (verbatim) | Feed [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md#12-one-email-sponsor--procurement-kit) — no repo commit of buyer quotes without clearance |
| Phrases that failed | Remove from outreach |
| Recommended external claim posture | Conservative / pilot-only / hold |

---

## Related

- [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) — generic-AI comparison rubric
- [`PROCUREMENT_OBJECTION_PLAYBOOK.md`](PROCUREMENT_OBJECTION_PLAYBOOK.md#controlled-pilot-drill) — procurement drill (complementary)
- [`FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md`](FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md) — empirical counterfactual rows
- [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md#12-one-email-sponsor--procurement-kit) — sponsor email copy
- **GTM M-42** — execution tracker in [`GTM_BACKLOG.md`](GTM_BACKLOG.md)
