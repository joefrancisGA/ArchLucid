# Risk & Tradeoffs — Step 1: C# Contracts

## Context

Implement the contract layer for the Risk & Tradeoffs analyzer described in
`docs/architecture/analyzer_component.md` (rev 7). This step produces the shared
types consumed by every subsequent step. No business logic, no persistence, no
API surface — contracts only.

## What to build

Add the following files under `ArchLucid.Contracts/Risk/`:

### Enums (one file each)

`WafPillar.cs`
```csharp
public enum WafPillar { Reliability, Security, Cost, Operations, Performance }
```

`TradeoffStatus.cs`
```csharp
// Conflicting = sacrifice contradicts a stated requirement (the ⚠ headline).
// Unacknowledged = real sacrifice, no intake answer accepting it (= unvalidated assumption).
// Acknowledged = matches an intake answer (shown as articulated bet, not flagged).
public enum TradeoffStatus { Acknowledged, Unacknowledged, Conflicting }
```

`RiskConsequence.cs`
```csharp
public enum RiskConsequence { Low, Medium, High }
```

`ReversibilityClass.cs`
```csharp
// Ordering input: consequence leads; reversibility is the tiebreaker (§1.2).
public enum ReversibilityClass { Reversible, Costly, OneWayDoor }
```

`RequirementSmellKind.cs`
```csharp
public enum RequirementSmellKind { Unjustified, Incoherent, RoundNumber, CostInfeasible }
```

`ConcernSource.cs`
```csharp
public enum ConcernSource { Architectural, ExecutionCredibility }
```

`DisclosureState.cs`
```csharp
public enum DisclosureState { DisclosedOk, DisclosedRisk, Undisclosed }
```

### Domain types (one file each)

`ArchitectureTradeoff.cs`
```csharp
public sealed class ArchitectureTradeoff
{
    public string TradeoffId { get; set; } = Guid.NewGuid().ToString("N");
    public WafPillar GainedPillar { get; set; }
    public WafPillar SacrificedPillar { get; set; }
    // Catalog mechanism key (e.g. "cost-reliability/single-region").
    public string Mechanism { get; set; } = null!;
    public List<string> EvidenceNodeIds { get; set; } = [];
    public List<string> EvidenceFindingIds { get; set; } = [];
    // L0 pillar answer key that explicitly accepts the sacrifice, if any.
    public string? AcknowledgedByAnswerKey { get; set; }
    // Stated requirement violated when Status == Conflicting.
    public string? ConflictingRequirementId { get; set; }
    // Set when this is an optimization-mismatch tradeoff (§3.3).
    public string? RelatedOutcomeRef { get; set; }
    public TradeoffStatus Status { get; set; }
    public RiskConsequence Consequence { get; set; }
    public ReversibilityClass Reversibility { get; set; }
    // Key into the WAF counterfactual catalog; null when not applicable.
    public string? CounterfactualRef { get; set; }
}
```

`SuggestedConcern.cs`
```csharp
public sealed class SuggestedConcern
{
    public string ConcernId { get; set; } = Guid.NewGuid().ToString("N");
    // Plain language, specific, references named entities from customer context.
    public string Statement { get; set; } = null!;
    // Must contain >= 2 held facts (named entities) to pass the quality gate.
    public List<string> RelatedFactRefs { get; set; } = [];
    public ConcernSource Source { get; set; }
    public RiskConsequence Consequence { get; set; }
    public ReversibilityClass Reversibility { get; set; }
}
```

`RequirementSmell.cs`
```csharp
public sealed class RequirementSmell
{
    public string RequirementId { get; set; } = null!;
    public RequirementSmellKind Kind { get; set; }
    public string Rationale { get; set; } = null!;
    public List<string> EvidenceRefs { get; set; } = [];
}
```

`ExecutionContextItem.cs`
```csharp
public sealed class ExecutionContextItem
{
    public string ItemKey { get; set; } = null!;
    // Key of the elicitation question that produced this item.
    public string ElicitationQuestionKey { get; set; } = null!;
    public DisclosureState Disclosure { get; set; }
    public string? AssertedAnswerRef { get; set; }
}
```

`RiskSnapshot.cs` — mirrors `FindingsSnapshot`; one immutable record per review run
```csharp
public sealed class RiskSnapshot
{
    public string SnapshotId { get; set; } = Guid.NewGuid().ToString("N");
    public string ReviewRunId { get; set; } = null!;
    public string TenantId { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public List<ArchitectureTradeoff> Tradeoffs { get; set; } = [];
    public List<RequirementSmell> RequirementSmells { get; set; } = [];
    public List<SuggestedConcern> Concerns { get; set; } = [];
    public List<ExecutionContextItem> ExecutionContext { get; set; } = [];
}
```

`RiskBehaviorChangeEvent.cs` — leading commercial metric (never used to train the model)
```csharp
// Logged when a conflict leads to [ change requirement ], an accepted counterfactual,
// or a subsequent manifest revision. Kept separate from outcome-capture events.
public sealed class RiskBehaviorChangeEvent
{
    public string EventId { get; set; } = Guid.NewGuid().ToString("N");
    public string SnapshotId { get; set; } = null!;
    public string ItemId { get; set; } = null!;     // TradeoffId, ConcernId, etc.
    public string TenantId { get; set; } = null!;
    public DateTimeOffset OccurredAt { get; set; }
    public string ActionTaken { get; set; } = null!; // "ChangeRequirement" | "AcceptCounterfactual" | "ManifestRevision"
}
```

`RiskOutcomeCaptureEvent.cs` — predictive-validity signal; trains the flywheel
```csharp
// Captured on ignored findings ("what happened?"). Case B (ignored-but-came-true)
// is the crown-jewel calibration signal. Never conflated with behavior-change events.
public sealed class RiskOutcomeCaptureEvent
{
    public string EventId { get; set; } = Guid.NewGuid().ToString("N");
    public string SnapshotId { get; set; } = null!;
    public string ItemId { get; set; } = null!;
    public string TenantId { get; set; } = null!;
    public DateTimeOffset OccurredAt { get; set; }
    // "ConfirmedCorrect" | "ConfirmedIncorrect" | "Inconclusive"
    public string OutcomeVerdict { get; set; } = null!;
    public string? Notes { get; set; }
}
```

## Guardrails

- One class per file. Each file lives in `ArchLucid.Contracts/Risk/`.
- No business logic in contracts.
- No dependency on `ArchLucid.Application` or `ArchLucid.Decisioning`.
- `RiskSnapshot` is immutable by convention — no setters except those needed for
  deserialization; treat it the same as `FindingsSnapshot`.
- `RiskBehaviorChangeEvent` and `RiskOutcomeCaptureEvent` must remain separate
  classes; they feed separate metric streams.
- Follow existing code style in `ArchLucid.Contracts/Findings/`.

## Acceptance criteria

- All files compile in `ArchLucid.Contracts` (use `agent-compile-check.ps1 -ProjectPath ArchLucid.Contracts/ArchLucid.Contracts.csproj`).
- No new dependencies added to the contracts project.
- Unit tests for any non-trivial logic (none expected at this step).
