> **Reviewed:** 2026-07-26

> **Scope:** Market validation protocol — live principal-architect sessions, fillable session scorecard (formerly `PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md`), blind insight comparison, and cohort operating checklist. Tests whether experienced architects find ArchLucid outputs non-obvious, correct, evidence-backed, decision-changing, and worth repeating after demo novelty wears off. Validation work, not a product spec.

# Principal-Architect Insight Validation Protocol

**Audience:** Founder / release owner running live demos, advisory sessions, or paid pilots.  
**Duration:** 30–45 minutes per session.  
**Last reviewed:** 2026-07-26.  
**Recommended sample:** 3–5 sessions before changing roadmap messaging; 5+ sessions before treating results as directional market evidence.

**Blind comparison + cohort ops:** [`#blind-insight-validation`](#blind-insight-validation) · [`#blind-cohort-operating-checklist`](#blind-cohort-operating-checklist) · Fillable worksheet: [`#session-scorecard`](#session-scorecard)

## Purpose

Answer the highest-value market question:

> **Do principal architects find ArchLucid outputs non-obvious, correct, evidence-backed, decision-changing, and worth repeating after the demo novelty wears off?**

This protocol is designed to test whether ArchLucid produces architecture-review value beyond a polished UI or generic frontier-AI output. It should help distinguish between:

- findings that are merely obvious but well formatted;
- findings that are useful but expected;
- findings that are non-obvious, correct, and decision-changing;
- findings that are plausible but unsupported;
- findings that are wrong or unsafe to sponsor.

This is not a substitute for shipping pilot proof mechanics. It is a market-validation instrument.

## Core hypothesis

ArchLucid is valuable if experienced architects conclude that it produces a repeatable architecture package with enough evidence, traceability, governance context, and decision impact to justify reuse in a real architecture-review process.

ArchLucid does not need to be more conversational than raw frontier AI. It needs to be more **governed, repeatable, auditable, evidence-backed, and sponsor-ready**.

## Participant profile

### Include

- Principal architect, lead architect, staff architect, cloud architect, platform architect, security architect, enterprise architect, or CTO.
- At least 8 years of hands-on architecture review or technical governance experience.
- Experience reviewing cloud, security, reliability, cost, compliance, or operability tradeoffs.
- Willingness to criticize AI output honestly.

### Exclude

- ArchLucid builders.
- Paid advocates who are not expected to critique honestly.
- Participants who only provide high-level executive reactions and cannot evaluate findings.
- Participants who have not reviewed architecture decisions in practice.

### Ideal cohort

Run 3–5 sessions before changing roadmap messaging. Treat individual reactions as anecdotes until patterns repeat across participants.

## Session variants

Use the full protocol for paid or serious validation sessions. Use the light protocol for informal architect feedback.

### Full protocol

Use when you have 30–45 minutes, a prepared packet, ArchLucid output, and a frontier-AI baseline.

### Light protocol

Use when the participant is time-constrained. Still capture:

1. Their top 3 concerns after reading the packet cold.
2. Which ArchLucid findings were non-obvious.
3. Which findings were wrong or unsupported.
4. Whether ArchLucid beat raw frontier AI on insight, evidence, traceability, or sponsor readiness.
5. Whether they would use it again and why.

## Materials to prepare before the session

| Item | Source / note |
| --- | --- |
| Sanitized architecture packet | Customer-redacted packet or realistic Contoso-style sample, ideally 8–15 pages. |
| ArchLucid finalized review output | Real-mode preferred. Simulator output is acceptable only if clearly labeled as representative. |
| Frontier-AI manual baseline | Same packet reviewed in Claude Opus / GPT-5 / Gemini Pro using a principal-architect prompt. |
| Scoring sheet | [`#session-scorecard`](#session-scorecard) or equivalent shared form. |
| Blind comparison packet | Recommended for at least 2 of 5 sessions. Use [`#blind-insight-validation`](#blind-insight-validation). |
| Session log template | `templates/principal-architect-session.template.json` or equivalent notes document. |

### Frontier-AI baseline prompt

Use the same architecture packet and do not include ArchLucid-specific outputs.

```text
You are a principal cloud architect reviewing this architecture for security, cost, reliability, compliance, and operability.
List findings by severity.
Cite assumptions.
Do not invent infrastructure, controls, dependencies, or requirements that are not in the packet.
For each finding, explain the evidence from the packet and the decision or remediation it would affect.
```

## Session flow: full protocol

| Minute | Activity | Notes |
| --- | --- | --- |
| 0–5 | Context only | Do not pitch. Explain that the goal is critique, not approval. Label simulator vs real-mode output if applicable. |
| 5–10 | Cold packet read | Participant reads the packet and notes top 3 concerns without tools. |
| 10–25 | ArchLucid review walkthrough | Walk through findings, evidence trail, architecture package, and sponsor packet. Observer stays mostly silent. |
| 25–35 | Frontier-AI baseline comparison | Show the manual frontier-AI output or let participant compare against their own pre-session baseline. |
| 35–45 | Scoring interview | Use the scoring questions and classification scheme below. |

## Session flow: light protocol

| Minute | Activity |
| --- | --- |
| 0–5 | Explain objective and ask participant to read packet summary. |
| 5–10 | Ask for their top 3 concerns before seeing ArchLucid output. |
| 10–20 | Show ArchLucid findings and evidence trail. |
| 20–25 | Show raw frontier-AI baseline if available. |
| 25–30 | Ask reuse, decision-impact, wrong/unsupported, and buying-path questions. |

## Observer instructions

The observer should avoid defending ArchLucid during the scoring portion. The goal is not to persuade the participant; the goal is to discover whether the output survives expert scrutiny.

When the participant criticizes a finding, ask for specificity:

- Is it wrong, unsupported, obvious, or merely not important?
- What evidence would have made it sponsor-safe?
- Would a competent architect have written this in the first pass?
- Would it change approval, priority, or remediation?

## Observation questions

Ask these in every session.

1. Which ArchLucid finding would you **not** have written yourself in the first pass?
2. Which finding was **wrong, overstated, or unsupported** by the packet?
3. Where is the **evidence trail** stronger than manual AI output?
4. Where did raw frontier AI perform better than ArchLucid?
5. Would you **reuse** ArchLucid for the next review cycle? Why or why not?
6. What would make you **stop** using it after two reviews?
7. Which finding would change your approval decision, approval conditions, remediation priority, or escalation path?
8. Which finding would you remove before sending the packet to an executive sponsor?
9. Would you use this as part of a formal architecture review board process?
10. Who in your organization would need to approve adoption or fund a pilot?
11. What would make this unsafe, embarrassing, or politically risky to use?

## Finding classification

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

## Numeric scoring rubric

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

## Comparison dimensions: ArchLucid vs raw frontier AI

Separate insight quality from process quality. Raw frontier AI may be more flexible or conversational; that does not automatically mean it is better for governed architecture review.

| Dimension | What to observe |
| --- | --- |
| Insight quality | Which output found better architecture issues? |
| Non-obvious findings | Which output produced more **N** or **D** findings? |
| Correctness | Which output had fewer wrong or overstated claims? |
| Evidence traceability | Which output better tied findings to packet evidence, manifest, artifacts, or policy context? |
| Repeatability | Same packet should produce comparable output and review history. |
| Governance readiness | Export labels, execution mode, evidence trail, manifest, audit rows, and exception workflow. |
| Sponsor packet quality | Would participant send the output to a CTO, CISO, architecture board, or executive sponsor? |
| Workflow fit | Which output fits a real architecture review board process better? |
| Time to first reviewable packet | Measure wall clock where possible; label estimates as illustrative unless measured. |
| Flexibility | Where did raw AI feel more adaptive, conversational, or exploratory? |

## Pass / fail thresholds

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

## What changes roadmap or messaging

| Outcome | Action |
| --- | --- |
| Pass on N-rate, D-rate, correctness, and reuse | Advance insight-density narrative; continue proof-gated GTM. |
| Fail on N-rate but pass on evidence/governance | Position ArchLucid around durability, audit, repeatability, and governance rather than superior insight. |
| Fail on X findings | Make faithfulness, retrieval, evidence binding, and claim calibration the engineering priority. Do not add new surfaces. |
| Fail on S findings | Improve evidence citation, manifest linkage, and sponsor-safe wording before expanding pilot messaging. |
| Manual AI wins on flexibility | Emphasize governed package, evidence trail, repeatability, and audit readiness. Consider conversational exploration as V1.1. |
| Participants like it but would not reuse | Investigate workflow friction, buying path, and whether findings changed real decisions. |
| Participants would reuse but cannot identify buyer | Validate adoption path with CTO/CISO/architecture board sponsor. |

## Buying-path questions

Ask after the technical scoring, not before.

1. Would you personally sponsor a pilot after seeing this output?
2. Who would own this tool: architecture, cloud platform, security, governance, compliance, or engineering productivity?
3. Who would have budget authority?
4. What existing tool or process would ArchLucid replace or augment?
5. What proof would you need before recommending adoption?
6. Would this be more valuable as a standalone tool, a workflow around existing AI, or an integration into existing governance systems?

## Blind comparison guidance

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

## Simulator-output rule

Real-mode output is preferred for validation. Simulator output is acceptable only when clearly labeled.

If simulator output is used, say:

> This is representative simulator output, not measured live execution behavior. Please judge the usefulness, evidence structure, and sponsor readiness, not runtime performance.

Do not use simulator output to claim measured execution speed, repeatability, or production reliability.

## Session notes template

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

## Cohort aggregation

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

## Blind insight validation

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

**Manual baseline:** same sanitized packet; principal-architect prompt ([`fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt`](../../../fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt)); save findings list — not a chat dump — before unblinding.

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
| Regulated scenario (demo-safe) | [`fixtures/blind-validation/regulated-scenario/`](../../../fixtures/blind-validation/regulated-scenario/) | Demo-derived only |
| Sample assembled packet | [`../fixtures/blind-validation-regulated-scenario-sample/`](../fixtures/blind-validation-regulated-scenario-sample/) | Checked-in assembler output (`--seed 42`) |

---

## Blind cohort operating checklist

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

Tracker: [`../validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md`](../validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md) · GTM **M-50**.

---

## Session scorecard

**Audience:** Facilitator running expert validation sessions. Captures market uncertainty — not product claims.  
**Bakeoff framing:** [`../GENERIC_AI_BAKEOFF_PROTOCOL.md`](../GENERIC_AI_BAKEOFF_PROTOCOL.md).

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

**Electronic capture:** Copy [`../templates/first-non-obvious-moment.template.json`](../templates/first-non-obvious-moment.template.json) to `artifacts/first-non-obvious-moment/<runId>/moment.json` after debrief; proof collection surfaces **`first-non-obvious-moment-report.md`**. For dismissal signals, copy [`../templates/pilot-dismissal-trigger.template.json`](../templates/pilot-dismissal-trigger.template.json) to `artifacts/pilot-dismissal-triggers/<runId>/dismissal.json`.

Former standalone: `docs/go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md` → this section.

---

## Related files

- [`#session-scorecard`](#session-scorecard) (fillable worksheet)
- [`../templates/blind-validation-scoring-sheet.template.json`](../templates/blind-validation-scoring-sheet.template.json)
- [`../templates/blind-validation-exec-summary.template.md`](../templates/blind-validation-exec-summary.template.md)
- [`../PILOT_ROI_MODEL.md`](../PILOT_ROI_MODEL.md)
- [`../GENERIC_AI_BAKEOFF_PROTOCOL.md`](../GENERIC_AI_BAKEOFF_PROTOCOL.md)
- [`../GTM_BACKLOG.md`](../GTM_BACKLOG.md) § Proof-gated rollout

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
