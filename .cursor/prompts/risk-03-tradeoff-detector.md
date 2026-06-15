# Risk & Tradeoffs — Step 3: Conflicting-Tradeoff Detector (V1 Demo Core)

## Context

Implement the deterministic tradeoff detection engine described in
`docs/architecture/analyzer_component.md` §3.1, §3.3, §3.5 (rev 7).

This is the **V1 demo core** — the thing that must exist for any demo to work.
No LLM in the detection path. LLM is called only afterward to write the
plain-language explanation and closed-form counterfactual for an already-detected,
already-classified tradeoff.

Prerequisites: Step 1 (Contracts) and Step 2 (WAF Catalog) must be complete.

## What this engine does

For a given `ManifestDocument` + `TransparencyTrail` + stated requirements:

1. **Detect** — scan manifest sections for catalog mechanism signatures
   (`IWafTradeoffCatalog.All`, compare `DetectionSignatures` case-insensitive
   against manifest text).
2. **Classify status** — for each detected mechanism:
   - `Conflicting`: there is a stated requirement whose content contradicts the
     sacrificed pillar (e.g. RTO ≤ 1h while the mechanism sacrifices Reliability).
   - `Unacknowledged`: no L0 pillar answer in `TransparencyTrail` accepts the
     sacrifice, and no conflict with a stated requirement.
   - `Acknowledged`: a matching L0 answer explicitly accepts or requires it.
3. **Compute reversibility** — derive `ReversibilityClass` from dependency
   fan-in on the manifest element (how many other manifest sections reference
   this component). High fan-in → `OneWayDoor`; medium → `Costly`; low →
   `Reversible`. Use the catalog's `DefaultReversibility` as the floor.
4. **Set consequence** — start from catalog `DefaultConsequence`; elevate to
   `High` if `Status == Conflicting`.
5. **Detect optimization mismatch** (§3.3) — if the design's dominant sacrificed
   pillar matches the pillar implied by the stated `BusinessOutcome` (e.g.
   outcome = "improve reliability" but dominant sacrifice = Reliability), set
   `RelatedOutcomeRef`.
6. **Assign `CounterfactualRef`** — set to the catalog's `CounterfactualKey`
   for the entry (e.g. `"reliability-cost/multi-region"` for a single-region
   tradeoff). LLM rendering happens downstream, not here.
7. **LLM explanation pass** — for each `Conflicting` tradeoff, call the LLM to
   produce:
   - A 1–2 sentence plain-language conflict statement (architect rendering)
   - A 1-sentence consequence-translation (executive rendering: schedule / cost
     / compliance exposure, no fabricated probability)
   - A closed-form counterfactual: "To satisfy [requirement], you would need
     [catalog inverse mechanism]; approximate impact: [cost delta from catalog]."
     This is a statement, not a chat prompt.

## Interface

```csharp
// ArchLucid.Decisioning/Risk/ITradeoffDetectionEngine.cs
public interface ITradeoffDetectionEngine
{
    Task<IReadOnlyList<ArchitectureTradeoff>> DetectAsync(
        ManifestDocument manifest,
        TransparencyTrail trail,
        IReadOnlyList<string> statedRequirements,
        string? businessOutcome,
        CancellationToken cancellationToken = default);
}
```

## Implementation

`ArchLucid.Decisioning/Risk/TradeoffDetectionEngine.cs`

Inject: `IWafTradeoffCatalog`, an LLM client (use the existing pattern in the
codebase for LLM calls — do not introduce a new abstraction).

Detection is synchronous; the LLM call for explanation is async and only fires
for `Conflicting` tradeoffs.

## Supersede `AuthorityManifestRiskPosture`

After `TradeoffDetectionEngine` is wired, the output of `AuthorityManifestRiskPosture`
should be derived from — or replaced by — the tradeoffs list. Do not delete the
existing class yet; mark it `[Obsolete]` and leave a TODO pointing to this engine.

## Ordering

Sort the output list by:
1. `Status` ascending: `Conflicting` first, then `Unacknowledged`, then `Acknowledged`.
2. `Consequence` descending: `High` before `Medium` before `Low`.
3. `Reversibility` ascending: `OneWayDoor` before `Costly` before `Reversible`.

This is the ordering rule from design doc §1.2. The list is consumed as-is by
the snapshot and the UI.

## Unit tests

Cover at minimum:
- A manifest with a single-region App Service + RTO requirement → produces one
  `Conflicting` tradeoff with `Status == Conflicting`, `Consequence == High`.
- Same manifest, no RTO requirement → `Unacknowledged`.
- Manifest with an L0 answer acknowledging scale-to-zero → `Acknowledged`.
- Ordering: three tradeoffs of mixed status/consequence arrive sorted correctly.
- Optimization mismatch: outcome = "improve reliability", dominant sacrifice =
  Reliability → `RelatedOutcomeRef` is set.

## Guardrails

- No numeric score or probability in the output or LLM prompt.
- LLM prompt must instruct the model: "Do not invent probabilities or statistics.
  State consequences in terms of schedule, cost, or compliance exposure only."
- `CounterfactualRef` is a key, not an inline text — the LLM renders the human
  text from the catalog entry separately.
- Detection is idempotent: same manifest + trail → same output (deterministic).
