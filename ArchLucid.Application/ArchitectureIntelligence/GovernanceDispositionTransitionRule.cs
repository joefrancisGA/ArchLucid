using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>One legal <c>(from, event) → to</c> triple for governance dispositions.</summary>
public readonly record struct GovernanceDispositionTransitionRule(
    GovernanceDisposition From,
    GovernanceDispositionLifecycleEvent LifecycleEvent,
    GovernanceDisposition To);
