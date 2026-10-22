using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Documented lifecycle events for <see cref="GovernanceDisposition" /> transitions (TB-1985).</summary>
public enum GovernanceDispositionLifecycleEvent
{
    SetOpen = 1,
    SetAccepted = 2,
    SetRemediationPlanned = 3,
    SetDeferred = 4,
    SetExceptionGranted = 5,
    SetHumanDecisionRequired = 6,
}
