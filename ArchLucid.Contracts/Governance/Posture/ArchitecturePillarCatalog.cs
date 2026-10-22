namespace ArchLucid.Contracts.Governance.Posture;

/// <summary>Canonical pillar catalog aligned with <c>dbo.PillarCatalog</c> seed (migration 320).</summary>
public static class ArchitecturePillarCatalog
{
    public static readonly IReadOnlyList<ArchitecturePillarCatalogEntry> All =
    [
        new() { PillarKey = nameof(ArchitecturePillar.Security), DisplayName = "Security", DisplayOrder = 1, IsReviewIntegrityAxis = false },
        new() { PillarKey = nameof(ArchitecturePillar.ReliabilityAndResilience), DisplayName = "Reliability and Resilience", DisplayOrder = 2, IsReviewIntegrityAxis = false },
        new() { PillarKey = nameof(ArchitecturePillar.PerformanceAndScalability), DisplayName = "Performance and Scalability", DisplayOrder = 3, IsReviewIntegrityAxis = false },
        new() { PillarKey = nameof(ArchitecturePillar.CostEffectiveness), DisplayName = "Cost Effectiveness", DisplayOrder = 4, IsReviewIntegrityAxis = false },
        new() { PillarKey = nameof(ArchitecturePillar.OperationalExcellence), DisplayName = "Operational Excellence", DisplayOrder = 5, IsReviewIntegrityAxis = false },
        new() { PillarKey = nameof(ArchitecturePillar.DataAndCompliance), DisplayName = "Data and Compliance", DisplayOrder = 6, IsReviewIntegrityAxis = false },
        new() { PillarKey = nameof(ArchitecturePillar.SustainabilityAndResourceEfficiency), DisplayName = "Sustainability and Resource Efficiency", DisplayOrder = 7, IsReviewIntegrityAxis = false },
    ];
}
