using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Runs;

/// <summary>One legal <c>(from, event) → to</c> triple in the run lifecycle table.</summary>
public readonly record struct ArchitectureRunStatusTransitionRule(
    ArchitectureRunStatus From,
    ArchitectureRunStatusLifecycleEvent LifecycleEvent,
    ArchitectureRunStatus To);
