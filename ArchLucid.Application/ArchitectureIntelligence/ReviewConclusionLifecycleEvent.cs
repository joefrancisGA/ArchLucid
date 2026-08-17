using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Documented lifecycle events for <see cref="ReviewConclusion" /> transitions (TB-1985).</summary>
public enum ReviewConclusionLifecycleEvent
{
    SpecialistSetPass = 1,
    SpecialistSetFail = 2,
    SpecialistSetIndeterminate = 3,
    SpecialistSetNotApplicable = 4,
    ProvisionalDowngradeToIndeterminate = 5,
}
