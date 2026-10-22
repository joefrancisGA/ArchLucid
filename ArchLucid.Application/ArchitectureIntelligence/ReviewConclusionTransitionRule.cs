using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>One legal <c>(from, event) → to</c> triple for review conclusions.</summary>
public readonly record struct ReviewConclusionTransitionRule(
    ReviewConclusion From,
    ReviewConclusionLifecycleEvent LifecycleEvent,
    ReviewConclusion To);
