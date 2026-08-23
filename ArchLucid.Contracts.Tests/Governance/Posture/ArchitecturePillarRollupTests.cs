using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Governance.Posture;

namespace ArchLucid.Contracts.Tests.Governance.Posture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturePillarRollupTests
{
    [Fact]
    public void FromSpecialistDimension_maps_every_quality_dimension_without_default()
    {
        foreach (QualityDimension dimension in Enum.GetValues<QualityDimension>())
        {
            ArchitecturePillar pillar = ArchitecturePillarRollup.FromSpecialistDimension(dimension);

            Assert.True(Enum.IsDefined(pillar));
        }
    }

    [Theory]
    [InlineData(QualityDimension.Security, ArchitecturePillar.Security)]
    [InlineData(QualityDimension.Reliability, ArchitecturePillar.ReliabilityAndResilience)]
    [InlineData(QualityDimension.Cost, ArchitecturePillar.CostEffectiveness)]
    [InlineData(QualityDimension.PrivacyCompliance, ArchitecturePillar.DataAndCompliance)]
    public void FromSpecialistDimension_maps_direct_pairs(
        QualityDimension dimension,
        ArchitecturePillar expected)
    {
        ArchitecturePillar actual = ArchitecturePillarRollup.FromSpecialistDimension(dimension);

        Assert.Equal(expected, actual);
    }
}
