# Risk & Tradeoffs — Step 4: Requirement Smell Detector

## Context

Implement the requirement interrogation engine described in
`docs/architecture/analyzer_component.md` §5 (rev 7).

This engine scrutinizes stated requirements as evidence, not as ground truth.
It does not argue with customers — it raises a question once, records the
disposition, and never re-raises after the customer answers.

Prerequisites: Steps 1–3 must be complete.

## What it does

For a given `TransparencyTrail` + stated requirements + cost section of the manifest:

Detect up to 4 kinds of smells:

| Kind | Signal | Source |
|------|--------|--------|
| `Unjustified` | Requirement asserted with no recorded rationale | `TransparencyTrail` provenance: asserted with no evidence chain |
| `Incoherent` | RTO = 1h but "best-effort" cost pillar answer; "five 9s" but no DR budget | Cross-requirement + cross-pillar consistency check |
| `RoundNumber` | "1 hour", "99.99%", "five 9s" with no supporting justification | Pattern match + missing evidence chain |
| `CostInfeasible` | Stated target implies spend the stated budget cannot fund | Requirement text × cost section of manifest |

Produce one `RequirementSmell` per affected requirement. A single requirement
can have at most one smell (pick the highest-severity kind if multiple apply).

## Interface

```csharp
// ArchLucid.Decisioning/Risk/IRequirementSmellEngine.cs
public interface IRequirementSmellEngine
{
    IReadOnlyList<RequirementSmell> Detect(
        IReadOnlyList<string> statedRequirements,
        TransparencyTrail trail,
        ManifestDocument manifest);
}
```

Synchronous — no LLM in the detection path.

## Key design rules from the design doc

1. **Posture is a question, never an assertion.** The `Rationale` field must be
   phrased as *"This requirement appears [X] — confirm before we hold your
   design to it."* Never: *"This requirement is wrong."*
2. **Raised once, then dispositioned.** The smell is recorded in `RiskSnapshot`;
   the disposition trail (`FindingReviewTrailAppendService`) handles acceptance.
   Once dispositioned `Accepted`, it must not appear in future runs for the same
   requirement ID + tenant. Implement a `RequirementSmellDispositionRepository`
   (or reuse the existing finding-review trail pattern) to check prior dispositions
   before emitting a smell.
3. **Scoped to exactly 4 kinds.** Do not add general requirement critique.

## Disposition check

Before emitting a smell, call `IsAlreadyDispositioned(tenantId, requirementId)`.
If `true`, skip — the customer already answered. This is the "raised once" guarantee.

## Unit tests

Cover:
- Round-number detection: `"RTO = 1 hour"` with no rationale → `RoundNumber`.
- Unjustified: requirement asserted with `ProvisioningSource = Asserted` and
  empty evidence → `Unjustified`.
- Incoherent: `"99.99% availability"` + `"best-effort"` cost pillar answer in
  the same trail → `Incoherent`.
- CostInfeasible: manifest cost section total > stated budget × factor → `CostInfeasible`.
- Already dispositioned → no smell emitted for that requirement ID.
- One requirement, two applicable kinds → only the highest-severity is returned.

## Guardrails

- No LLM calls in this engine.
- `EvidenceRefs` must always contain at least one reference (requirement id,
  trail field, or manifest section path) — never an empty list.
- Do not re-raise after disposition.
