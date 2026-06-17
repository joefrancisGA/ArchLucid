> **Scope:** One-page facilitator scorecard for principal-architect insight validation sessions. Captures market uncertainty — not product claims.

# Principal-architect session scorecard

**Audience:** Founder / facilitator running expert validation sessions.  
**Duration:** 30–45 minutes per session.  
**Protocol:** [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) · Bakeoff framing: [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](../GENERIC_AI_BAKEOFF_PROTOCOL.md)

## Session metadata

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

## Artifact checklist (prepare before session)

- [ ] Sanitized architecture packet (8–15 pages)
- [ ] ArchLucid committed review output (sponsor-safe export)
- [ ] Manual frontier-AI baseline on the same packet
- [ ] Printed or shared scoring sheet (this document)
- [ ] Real-mode / simulator label visible on ArchLucid materials

## Numeric scales (blind sessions — per finding)

When using [`BLIND_INSIGHT_VALIDATION_PROTOCOL.md`](BLIND_INSIGHT_VALIDATION_PROTOCOL.md), score **Arm A** and **Arm B** in `scoring-sheet.json`:

| Field | 1 | 5 |
| --- | --- | --- |
| `novelty` | Obvious to any architect | Non-obvious and valuable |
| `correctnessConfidence` | Likely wrong vs packet | High confidence correct |
| `actionability` | Vague | Clear sponsor/team next step |
| `surpriseFactor` | Expected in first pass | Would not write unprompted |
| `decisionImpact` | Informational only | Changes approval or priority |

## Finding labels (per material finding)

Rate **each material finding** separately for ArchLucid and for the manual frontier-AI baseline (or blind arms before unblinding):

| Code | Label | Definition |
| --- | --- | --- |
| **O** | Obvious | Experienced architect would write this in a first pass |
| **U** | Useful | Correct and actionable but not surprising |
| **N** | Non-obvious | Correct and not expected in a first pass — primary value signal |
| **X** | Wrong / unsupported | Incorrect, missing evidence, or not grounded in the packet |
| **S** | Skipped | Not produced when it should have been |

## Session scores (counts)

| Source | O | U | N | X | S |
| --- | --- | --- | --- | --- | --- |
| ArchLucid | | | | | |
| Manual frontier AI | | | | | |

## Reuse and decision intent

| Question | Response |
| --- | --- |
| Would participant reuse ArchLucid for the next review cycle? | yes / maybe / no |
| Primary blocker to reuse (if not yes) | |
| Strongest evidence-trail advantage vs manual AI | |
| Weakest ArchLucid finding (if any X) | |

## Roadmap guidance (observation-driven)

- **High N-rate + reuse intent yes/maybe:** sharpen proof-package positioning; do not add features by default.
- **High X-rate:** treat as correctness / faithfulness work — not marketing.
- **High O-rate, low N-rate:** ArchLucid is competent but not differentiated — run more sessions before changing messaging.
- **Low reuse intent:** validate whether the gap is insight quality, workflow friction, or procurement — do not infer from a single session.

## Post-session storage

Store completed scorecards and transcripts outside the repository. Summarize aggregate N/X rates and reuse intent in private founder notes only until **≥ 3 sessions** justify a messaging update.

**Electronic capture:** Copy [`first-non-obvious-moment.template.json`](../templates/first-non-obvious-moment.template.json) to `artifacts/first-non-obvious-moment/<runId>/moment.json` after debrief; proof collection surfaces **`first-non-obvious-moment-report.md`**. For dismissal signals, copy [`pilot-dismissal-trigger.template.json`](../templates/pilot-dismissal-trigger.template.json) to `artifacts/pilot-dismissal-triggers/<runId>/dismissal.json`.

## Related

- [`BLIND_INSIGHT_VALIDATION_PROTOCOL.md`](BLIND_INSIGHT_VALIDATION_PROTOCOL.md)
- [`templates/blind-validation-scoring-sheet.template.json`](../templates/blind-validation-scoring-sheet.template.json)
- [`PILOT_BUYER_SAFE_EVIDENCE_TEMPLATE.md`](../PILOT_BUYER_SAFE_EVIDENCE_TEMPLATE.md)
- [`PILOT_ROI_MODEL.md`](../../library/PILOT_ROI_MODEL.md)
