using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DefenderSecureScoreRankAdjustmentTests
{
    [Theory]
    [InlineData(DefenderSecureScoreOrdinalBand.Low, 0.5)]
    [InlineData(DefenderSecureScoreOrdinalBand.Medium, 0.25)]
    [InlineData(DefenderSecureScoreOrdinalBand.High, 0)]
    [InlineData(DefenderSecureScoreOrdinalBand.Unknown, 0)]
    public void BlastRadiusPostureAdjustment_maps_ordinal_bands(
        DefenderSecureScoreOrdinalBand band,
        decimal expectedAdjustment)
    {
        DefenderSecureScoreRankAdjustment.BlastRadiusPostureAdjustment(band).Should().Be(expectedAdjustment);
    }
}
