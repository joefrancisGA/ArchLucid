# Finding semantic support band contract

> **Authority:** ADR [0085 — Semantic support is a Working career band, not a sync commit gate](../architecture/adrs/0085-semantic-support-band-working-career-not-commit-gate.md) · TB-1228 Lane B positioning · [`FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md`](FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md)

## What the band is

The **semantic support band** is a Working career honesty overlay on decision-grade findings. It answers whether the **finding sentence** is supported by the **cited excerpt text**, not whether citations exist structurally.

| Value | Meaning for architects |
| --- | --- |
| **Supported** | Exact quote overlap between finding message and citation excerpts (AS-057 heuristic). |
| **Unchecked** | Citations exist but overlap is inconclusive (paraphrase) or async Lane B has not scored yet. |
| **Unsupported** | Citations exist but excerpt text does not support the claim (quote mismatch). |
| **NotScored** | Checklist rows or nothing to score (no excerpts). |

## What the band is not

- **Not** a sync commit gate by default — finalize warns on Unchecked; it does not block seal on LLM faithfulness (ADR 0085).
- **Not** insight-density demotion — `DeterministicInsightDensityGate` must not read the band (AS-066 ratchet).
- **Not** legal truth, auditor conclusion, or CPA attestation.
- **Not** a substitute for ADR 0082 structural provenance — empty `EvidenceRefs` fail closed as provenance, not as Unsupported.

## Scorers and lanes

| Path | Default | Notes |
| --- | --- | --- |
| AS-057 heuristic quote overlap | **On** (sync at emit) | `FindingSemanticSupportBandScorer` · version `as057-quote-overlap-v1` |
| TB-1228 Lane B support-ratio | **Async when present** | Missing row stays Unchecked, never Supported (AS-058) |
| Premium LLM judge | **Off** | `EnableSemanticSupportBandLlmJudge` defaults false (AS-074) |

## Simulator / Rehearsal honesty

When structural execution mode is Simulator or Fallback, Working must not show career-looking **Supported** chips from wire bands alone. Rehearsal presentation uses explicit rehearsal copy (AS-068 / LP-06).

## Architect restatement (AS-070)

Human architect restatement is append-only judgment. Restatement text **never** upgrades the band to Supported even when quote overlap would score Supported on the restated sentence. The typed/model claim remains the scored message.

## Warn vs hold

| Band | Default finalize | PilotStrict (optional, AS-065) |
| --- | --- | --- |
| Unchecked | Warn on career export / finalize honesty surfaces | May warn |
| Unsupported | Visible on Working; row stays decision-grade | Optional hold — **default off** |

## Examples

**Supported:** Finding message exactly matches an ARM-backed excerpt in `EvidenceRefs`.

**Unsupported:** `EvidenceRefs` cite `/subscriptions/.../Microsoft.Sql/servers/sql-primary` but the finding claims unrestricted public internet ingress with no overlap tokens — livelihood exhibit (AS-073).

**Unchecked:** Paraphrase with partial token overlap; await Lane B or human review.

**NotScored:** Checklist coverage row — band chip omitted or labeled Not scored.

## Related implementation waves

AS-059 wire enum · AS-061 desk chip · AS-062 stamp counts · AS-071 export/ADR/print · AS-072 desk ratchet · AS-073 mismatch exhibit · AS-074 LLM default off · AS-075 this contract.
