namespace ArchLucid.Contracts.Governance.Posture;

/// <summary>
///     Canonical architecture-quality pillar keys aligned with governance policy-pack
///     <c>QualityDimension</c> strings and the posture overview surface.
/// </summary>
public enum ArchitecturePillar
{
    Security = 0,
    ReliabilityAndResilience = 1,
    PerformanceAndScalability = 2,
    CostEffectiveness = 3,
    OperationalExcellence = 4,

    /// <summary>
    ///     Separate from <see cref="Security" /> so compliance and privacy findings do not
    ///     inflate the most scrutinized security pillar counts.
    /// </summary>
    DataAndCompliance = 5,
    SustainabilityAndResourceEfficiency = 6,
}
