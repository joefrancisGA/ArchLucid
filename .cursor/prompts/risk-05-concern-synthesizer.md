# Risk & Tradeoffs — Step 5: Suggested Concern Synthesizer

## Context

Implement the AI-suggested concern synthesizer described in
`docs/architecture/analyzer_component.md` §4 (rev 7). This is the "hook" bucket —
lower trust, prominently labeled "AI-suggested, unverified," never counted in the
governance packet.

Prerequisites: Steps 1–4 must be complete. The synthesizer runs after detection;
it has access to the full manifest, trail, tradeoffs list, and requirement smells.

## What it does

For a given review run, produce **at most 3** suggested concerns that pass the
quality gate. Fewer is better. One strong, specific, grounded concern is more
valuable than five generic ones — the dismiss-rate ceiling (§11.4) is the metric
that enforces this.

## Quality gate — all conditions must pass

A concern that fails any condition is **suppressed, not surfaced**:

1. **≥2 grounded relations**: the statement must reference at least 2 named
   entities drawn from the customer's actual context (business units, named
   components, team names, adoption plan, sponsor, budget line). Generic adjectives
   fail this test.
2. **Specificity**: must name the customer's specific actors/components, not
   describe a general category.
   - Fail: *"This architecture appears operationally heavier than the team you described."*
   - Pass: *"This migration depends on six business units changing behavior at once, but the adoption plan you described covers one."*
3. **Non-obviousness**: must not be something a competent principal architect
   would catch from the manifest alone without the LLM. Single-pillar conflicts
   that the tradeoff detector already surfaces do not qualify.
4. **Source must be grounded**: the concern must emerge from ≥2 fields the system
   actually holds (intake answers, manifest sections, requirement text, trail
   provenance) — not from the LLM's general knowledge.

## Interface

```csharp
// ArchLucid.Decisioning/Risk/ISuggestedConcernSynthesizer.cs
public interface ISuggestedConcernSynthesizer
{
    Task<IReadOnlyList<SuggestedConcern>> SynthesizeAsync(
        ManifestDocument manifest,
        TransparencyTrail trail,
        IReadOnlyList<ArchitectureTradeoff> detectedTradeoffs,
        IReadOnlyList<RequirementSmell> detectedSmells,
        CancellationToken cancellationToken = default);
}
```

## LLM prompt design

The LLM call must:
- Be provided all relevant customer context (manifest summary, intake answers,
  tradeoffs, smells) in the system prompt.
- Be instructed to produce exactly N candidates (where N is configurable, default
  5), each with a `statement`, list of `relatedFactRefs`, and a `source` classification.
- Be explicitly told: "Do not generate concerns that are obvious to a principal
  architect. Do not generate concerns you cannot ground in the provided facts.
  Each concern must reference at least two named entities from the context."
- **Not** be told to generate a fixed number of final concerns — the post-LLM
  quality gate filters to the passing set.

After the LLM call, apply the quality gate deterministically in C# (not in the
prompt). Set `Source` to `ExecutionCredibility` when the concern relates
architecture complexity to disclosed capacity; `Architectural` otherwise.

## Dismiss-rate tracking

Before returning, check `ISmellDismissRateRepository.GetDismissRate(tenantId)`.
If the running dismiss rate for the `SuggestedConcern` bucket for this tenant
exceeds the configured ceiling (default: 40%), suppress the entire bucket for
this run and log a warning. This is the §11.4 fail-quiet mechanism.

## Unit tests

- Quality gate correctly suppresses a concern with < 2 fact refs.
- Quality gate correctly suppresses a concern that mirrors an already-detected
  tradeoff (non-obviousness check).
- Dismiss-rate ceiling → empty list returned, no exception.
- At most 3 concerns returned even when all 5 LLM candidates pass the gate
  (take top 3 by consequence × reversibility order).

## Guardrails

- Suggested concerns are **never** added to the governance packet / executive
  count. They are architect-view only.
- `SuggestedConcern.Statement` must never contain a fabricated probability or
  percentage ("70% chance…" → fail the quality gate before storing).
- The LLM call uses the same retry/timeout/logging pattern as other LLM calls
  in the codebase (do not invent a new pattern).
