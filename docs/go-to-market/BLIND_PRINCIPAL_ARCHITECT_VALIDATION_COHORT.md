> **Scope:** Facilitator playbook for blind principal-architect validation cohorts — market validation only; not customer proof.

# Blind principal-architect validation cohort

**Audience:** Founder / release owner, session facilitator, external principal-architect reviewers.  
**Last reviewed:** 2026-06-16

**Purpose:** Run **≥3** independent blind sessions that test whether ArchLucid produces non-obvious, decision-changing findings versus manual frontier AI on the same sanitized packet. This document is the **cohort operating checklist**; it does not claim results until sessions complete.

**Canonical protocols:** [`BLIND_INSIGHT_VALIDATION_PROTOCOL.md`](BLIND_INSIGHT_VALIDATION_PROTOCOL.md) · [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION.md`](PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION.md) · [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md) · [`PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md`](PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md)

---

## Facilitator checklist (before session)

| # | Check | Pass criteria |
| --- | --- | --- |
| 1 | Packet chosen | Committed run **or** demo-safe fixture (`fixtures/blind-validation/regulated-scenario`) — label source |
| 2 | Manual baseline ready | Same sanitized packet; findings **list** saved (not raw chat dump) |
| 3 | Execution mode labeled | Simulator / Real / Fallback / Mixed recorded for ArchLucid arm |
| 4 | Evidence basis labeled | Demo-derived vs buyer-provided explicit in facilitator notes |
| 5 | Blind packet assembled | `reviewer-packet.md` has **no** product branding on individual findings |
| 6 | Source key secured | `source-key.json` **not** shared with reviewer during scoring |
| 7 | Scoring sheet ready | `scoring-sheet.json` or [`templates/blind-validation-scoring-sheet.template.json`](templates/blind-validation-scoring-sheet.template.json) |
| 8 | Participant consent | PII and quotes stored **outside** repo per scorecard § Post-session storage |
| 9 | Time box set | 30–45 min scoring; architecture packet read 5–10 min cold |
| 10 | Anti-claim reminder | Do **not** present demo fixture output as live customer validation |

---

## Packet assembly steps

### Option A — Fixture flow (default until sanitized customer packet provided)

From repository root:

```powershell
python scripts/assemble_blind_validation_packet.py assemble `
  --fixture fixtures/blind-validation/regulated-scenario `
  --output artifacts/blind-validation/<session-label> `
  --session-id <optional-session-id> `
  --seed 42
```

**Sample checked-in output:** [`fixtures/blind-validation-regulated-scenario-sample/`](fixtures/blind-validation-regulated-scenario-sample/README.md)

### Option B — Live committed run

| Step | Action |
| --- | --- |
| 1 | Export ArchLucid findings from proof packet or findings snapshot |
| 2 | Run manual frontier-AI baseline using [`fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt`](../../fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt) |
| 3 | Place inputs in a fixture-shaped folder or pass paths to `assemble` if supported |
| 4 | Record `executionMode` and `evidenceBasis` in facilitator metadata |

### Outputs (per session)

| File | Audience |
| --- | --- |
| `reviewer-packet.md` | External reviewer |
| `scoring-sheet.json` | Reviewer + facilitator |
| `blind-packet.json` | Machine-readable packet |
| `source-key.json` | **Facilitator only** |
| `facilitator-source-key.md` | Facilitator |
| `exec-summary.template.md` | Product / exec rollup seed |

---

## Scoring plan

### Per-finding scales (1–5)

| Dimension | Field | Definition |
| --- | --- | --- |
| Novelty | `novelty` | 1 = obvious; 5 = non-obvious and valuable |
| Correctness confidence | `correctnessConfidence` | 1 = likely wrong vs packet; 5 = high confidence |
| Actionability | `actionability` | 1 = vague; 5 = clear next step |
| Surprise factor | `surpriseFactor` | 1 = expected; 5 = would not have written unprompted |
| Decision impact | `decisionImpact` | 1 = informational; 5 = would change approval |

Optional classification: **O** / **U** / **N** / **X** / **S** (see scorecard).

### Session flow

1. Reviewer reads sanitized architecture packet cold (5–10 min).
2. Reviewer scores each material finding in Arm A and Arm B (15–20 min).
3. Facilitator records reuse intent and blockers in `sessionMetadata`.
4. **After scoring:** reveal `source-key.json`.
5. Summarize:

```powershell
python scripts/assemble_blind_validation_packet.py summarize `
  --scoring-sheet artifacts/blind-validation/<session-label>/scoring-sheet.json `
  --packet artifacts/blind-validation/<session-label>/blind-packet.json
```

### Cohort aggregation (≥3 sessions)

Copy per-session `session-summary.md` into [`templates/blind-validation-exec-summary.template.md`](templates/blind-validation-exec-summary.template.md).

Aggregate with:

```powershell
python scripts/ci/aggregate_blind_insight_sessions.py `
  --input-dir artifacts/blind-validation/cohort-<label>
```

**Do not** change roadmap messaging until **≥3** independent sessions support the same direction.

### Pass thresholds (cohort level — conservative)

| Metric | Pass | Fail |
| --- | --- | --- |
| Non-obvious (**N**) rate | ≥25% of scored findings | <15% |
| Wrong / unsupported (**X**) | 0 critical | Any critical **X** |
| Reuse intent | ≥2 of 3 architects would run a second review | Majority would not return |

---

## Session summary template (copy per session)

```markdown
# Blind validation session summary — <session-label>

**Date (UTC):**  
**Packet:** <fixture name or run id — facilitator eyes only until unblind>  
**Execution mode (ArchLucid arm):** Simulator | Real | Fallback | Mixed  
**Evidence basis:** Demo-derived | Buyer-provided | Sanitized sample  

## Headline (directional — not public claim)

- Arm A mean novelty:  
- Arm B mean novelty:  
- Non-obvious findings (count):  
- Critical wrong findings (count):  
- Reuse intent (1–5):  
- Would recommend to peer (Y/N + why):  

## Honest comparison

- Where manual frontier AI won:  
- Where ArchLucid won:  
- Single dismissal trigger observed (if any):  

## Next action

- [ ] Add to cohort rollup  
- [ ] Engineering follow-up for any **X**  
- [ ] Hold GTM claim changes until cohort threshold met  
```

---

## Guardrails

- **No fabricated customer claims** — demo fixtures are protocol evidence only.
- **Label execution mode** — simulator output is not live customer validation.
- **Single session = directional** — one architect does not justify public benchmarks.
- **High obvious-rate ≠ failure** — low **N** / surprise signals differentiation risk, not useless product.

---

## Related

- [`FRONTIER_AI_BAKEOFF_EVIDENCE_PACK.md`](FRONTIER_AI_BAKEOFF_EVIDENCE_PACK.md) — time/traceability comparison companion
- [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) — G1 insight validation gate
