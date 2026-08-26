> **Scope:** Honesty note for insight-density scoring (WK-15). Gate behavior unchanged.

# Insight density miss clause

**Advisory only:** `DeterministicInsightDensityGate` computes a score for typed-engine findings but returns **Promote** / **DecisionGradeFinding** with penalty reason **`typed-engine-protected`**. Scores do **not** demote production engine output today.

## Pillar clauses vs current mechanisms

| Pillar clause (assessment language) | Current mechanism |
|-------------------------------------|-------------------|
| Miss | Partial — dismiss / mute flows; no automatic "miss" demotion for typed engines |
| Dismiss | Operator disposition + insight-density advisory labels |
| Operationalize | Governance queue / ITSM — not density-score gated |
| Package | Sealed snapshot + exports — not density-score gated |

A **filter cannot raise density** by itself; raising the headline score requires **new information** (engines, parsers, intake actors) — not relabeling.

## Corpus limit

The distribution report exercises **six** engines in the golden harness slice (eight after declaration engines in harness fixtures). **33+** built-in engines are absent from that table. `WouldDemoteIfUnprotectedCount` is a **counterfactual** — not production behavior.

## Forbidden without owner decision

- Applying `DemotionThreshold` to typed-engine findings
- Adding a 40th coverage-shaped engine from weakness remediation prompts — see [`HOLD_NO_COVERAGE_ENGINES.md`](HOLD_NO_COVERAGE_ENGINES.md)
- Checking in fake frontier LLM transcripts (`tests/eval-corpus/insight-density-frontier-delta/`)

## Related

- [`insight-density-engine-distribution.md`](insight-density-engine-distribution.md)
- [`../architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](../architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) ID-11
