namespace ArchLucid.Contracts.Governance.Coverage;

/// <summary>Persisted selection state for one coverage assignment row.</summary>
public enum CoverageSelectionState
{
    AlwaysActive,
    RequiredAndLocked,
    RecommendedAndSelected,
    RecommendedButExcluded,
    OptionalAndSelected,
    OptionalAndNotSelected,
    NotApplicable,
    Retired,
}
