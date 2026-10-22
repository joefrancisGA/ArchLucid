namespace ArchLucid.Core.QualityGates;

/// <summary>
///     Classifies why a persisted quality-gate definition was later found wrong (TB-974 playbook).
/// </summary>
public enum QualityGateWrongDefinitionClass
{
    /// <summary>Floors were too loose; accepted packages should not have passed.</summary>
    TooLoose = 0,

    /// <summary>Floors were too strict; rejected packages should have passed under corrected floors.</summary>
    TooStrict = 1,

    /// <summary>Scorer implementation bug (historical class of TB-255/TB-256); forward fix only.</summary>
    ScorerImplementationBug = 2,
}
