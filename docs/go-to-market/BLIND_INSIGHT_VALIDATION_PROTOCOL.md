> **Scope:** Blind principal-architect validation — repeatable evaluation package, scoring rubric, and packet assembly. Market validation only; not a product spec.

# Blind insight validation protocol

**Audience:** Founder / release owner, external principal-architect reviewers, product and executive stakeholders aggregating cohort evidence.  
**Last reviewed:** 2026-06-15

## Purpose

Convert market uncertainty about **insight quality** into measurable, repeatable evidence by comparing ArchLucid committed-review outputs against a **manual frontier-AI baseline** on the **same sanitized architecture packet** — without revealing which arm is which during scoring.

This protocol extends:

- [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION.md`](PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION.md) — live session flow
- [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md) — honest comparison framing
- [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) — capability matrix

## What gets measured

| Dimension | Field | Scale | Definition |
| --- | --- | --- | --- |
| Novelty | `novelty` | 1–5 | 1 = obvious to any competent architect; 5 = non-obvious and valuable |
| Correctness confidence | `correctnessConfidence` | 1–5 | 1 = likely wrong vs packet; 5 = high confidence correct |
| Actionability | `actionability` | 1–5 | 1 = vague; 5 = clear sponsor/team next step |
| Surprise factor | `surpriseFactor` | 1–5 | 1 = expected in first pass; 5 = would not have written unprompted |
| Decision impact | `decisionImpact` | 1–5 | 1 = informational only; 5 = would change approval or priority |

Optional single-letter **classification** per finding (compatible with the live scorecard): **O** / **U** / **N** / **X** / **S**.

## Blind comparison design

| Arm | Contents | Reviewer sees |
| --- | --- | --- |
| **Arm A** | Shuffled — either ArchLucid export or manual baseline | `A-F01`, `A-F02`, … anonymized text only |
| **Arm B** | The other source | `B-F01`, `B-F02`, … |

Facilitator holds `source-key.json` until scoring completes. Reviewer packet must not include run ids, tenant ids, or product branding on individual findings.

**Manual baseline requirements**

- Same sanitized packet as ArchLucid path.
- Principal-architect prompt (see [`fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt`](../../fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt) or live transcript).
- Save findings list — not a chat dump — before unblinding.

## Execution steps

### 1. Prepare inputs

| Step | Action |
| --- | --- |
| 1a | Choose a **committed run** (pilot or demo-safe fixture). |
| 1b | Export ArchLucid findings (proof packet, findings snapshot, or fixture JSON). |
| 1c | Run manual frontier-AI baseline on the same packet; capture findings list. |
| 1d | Confirm execution-mode and evidence-basis labels (simulator / real-mode; demo-derived / buyer-provided). |

### 2. Assemble blind packet (automated)

From repository root:

```powershell
python scripts/assemble_blind_validation_packet.py assemble `
  --fixture fixtures/blind-validation/regulated-scenario `
  --output artifacts/blind-validation/<session-label> `
  --session-id <optional-session-id>
```

**Outputs**

| File | Audience |
| --- | --- |
| `reviewer-packet.md` | External reviewer |
| `scoring-sheet.json` | Reviewer + facilitator |
| `blind-packet.json` | Machine-readable packet |
| `source-key.json` | **Facilitator only** — do not share during scoring |
| `facilitator-source-key.md` | Facilitator |
| `exec-summary.template.md` | Product / exec rollup template |

Optional deterministic arm order: `--seed <int>`.

### 3. Run blind session (30–45 min)

Follow [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION.md`](PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION.md) through scoring — but use **Arm A / Arm B** instead of named sources.

1. Reviewer reads sanitized architecture packet cold (5–10 min).
2. Reviewer scores each material finding in `scoring-sheet.json` (15–20 min).
3. Facilitator records reuse intent and blockers in `sessionMetadata`.
4. **After scoring:** reveal source mapping from `source-key.json`.

### 4. Summarize session

```powershell
python scripts/assemble_blind_validation_packet.py summarize `
  --scoring-sheet artifacts/blind-validation/<session-label>/scoring-sheet.json `
  --packet artifacts/blind-validation/<session-label>/blind-packet.json
```

Produces `session-summary.json` and `session-summary.md` for product/exec review.

### 5. Aggregate cohort (≥3 sessions)

Copy per-session summaries into [`templates/blind-validation-exec-summary.template.md`](templates/blind-validation-exec-summary.template.md). Do **not** change roadmap messaging until **≥3** independent sessions support the same direction.

## Interpretation guardrails

| Guardrail | Rationale |
| --- | --- |
| **No fabricated customer claims** | Demo fixtures and single sessions are protocol evidence — not buyer proof. |
| **Label execution mode** | Simulator output must not be presented as live customer validation. |
| **Single session = directional** | One architect's scores do not justify public benchmark claims. |
| **High O-rate ≠ product failure** | Useful obvious findings still matter; low **N** / **surprise** signals differentiation risk. |
| **Any critical X → engineering** | Wrong findings are faithfulness/retrieval work — not GTM expansion. |
| **Manual AI may win day-one breadth** | ArchLucid positioning should emphasize repeatability, evidence packaging, and audit readiness when manual AI scores higher on flexibility. |
| **Store PII outside repo** | Participant names and buyer quotes stay in private storage — see scorecard § Post-session storage. |

## Pass thresholds (conservative — cohort level)

Apply only after **≥3** blind sessions on comparable packets:

| Metric | Pass | Fail |
| --- | --- | --- |
| ArchLucid non-obvious share (N / material) | ≥25% | <15% |
| ArchLucid critical X findings | 0 | ≥1 |
| ArchLucid mean surprise vs manual arm | ≥ manual arm | materially below manual arm |
| Reuse intent | ≥3/5 yes or maybe | ≤2/5 would reuse |

## Fixture catalog

| Fixture | Path | Notes |
| --- | --- | --- |
| Regulated scenario (demo-safe) | [`fixtures/blind-validation/regulated-scenario/`](../../fixtures/blind-validation/regulated-scenario/) | Tied to demo workspace B run id; **demo-derived** only |
| Sample assembled packet | [`fixtures/blind-validation-regulated-scenario-sample/`](fixtures/blind-validation-regulated-scenario-sample/) | Checked-in output from assembler (`--seed 42`) |

Add new fixtures by copying the package layout: `package.json`, `archlucid-findings.json`, `manual-ai-baseline-findings.json`, optional `pilot-run-deltas.json`.

## Related artifacts

- Scoring JSON template: [`templates/blind-validation-scoring-sheet.template.json`](templates/blind-validation-scoring-sheet.template.json)
- Exec rollup template: [`templates/blind-validation-exec-summary.template.md`](templates/blind-validation-exec-summary.template.md)
- Live facilitator scorecard: [`PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md`](PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md)
- Packet assembler: [`scripts/assemble_blind_validation_packet.py`](../../scripts/assemble_blind_validation_packet.py)
