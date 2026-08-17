using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>One legal <c>(from, event) → to</c> triple for evidence conditions.</summary>
public readonly record struct EvidenceConditionTransitionRule(
    EvidenceCondition From,
    EvidenceConditionLifecycleEvent LifecycleEvent,
    EvidenceCondition To);
