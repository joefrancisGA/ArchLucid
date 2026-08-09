namespace ArchLucid.Core.QualityGates;

/// <summary>
///     Names whether a quality-gate outcome surface is authoritative for buyer/sponsor proof (TB-972).
///     <see cref="Recorded" /> is immutable under threshold upgrades; <see cref="AdvisoryCurrent" /> is diagnostic only.
/// </summary>
public enum QualityGateOutcomeAuthority
{
    /// <summary>Persisted evaluate-time outcome + definition version/hash (TB-973).</summary>
    Recorded = 0,

    /// <summary>Optional recompute under live host floors; never overwrites history (TB-972).</summary>
    AdvisoryCurrent = 1,
}
