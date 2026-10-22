namespace ArchLucid.Contracts.Governance.Posture;

/// <summary>Stable pillar keys seeded in <c>dbo.PillarCatalog</c> (TB-2373).</summary>
public static class ArchitecturePillarCatalogKeys
{
    public static readonly IReadOnlyList<string> All =
    [
        nameof(ArchitecturePillar.Security),
        nameof(ArchitecturePillar.ReliabilityAndResilience),
        nameof(ArchitecturePillar.PerformanceAndScalability),
        nameof(ArchitecturePillar.CostEffectiveness),
        nameof(ArchitecturePillar.OperationalExcellence),
        nameof(ArchitecturePillar.DataAndCompliance),
        nameof(ArchitecturePillar.SustainabilityAndResourceEfficiency),
    ];
}
