using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Documented lifecycle events for <see cref="EvidenceCondition" /> transitions (TB-1985).</summary>
public enum EvidenceConditionLifecycleEvent
{
    SetSufficient = 1,
    SetInsufficient = 2,
    SetConflicting = 3,
    SetStale = 4,
    SetUnverified = 5,
}
