using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DefenderSecureScoreOrdinalBandMapperTests
{
    [Theory]
    [InlineData(-1, DefenderSecureScoreOrdinalBand.Unknown)]
    [InlineData(101, DefenderSecureScoreOrdinalBand.Unknown)]
    [InlineData(0, DefenderSecureScoreOrdinalBand.Low)]
    [InlineData(39, DefenderSecureScoreOrdinalBand.Low)]
    [InlineData(40, DefenderSecureScoreOrdinalBand.Medium)]
    [InlineData(69, DefenderSecureScoreOrdinalBand.Medium)]
    [InlineData(70, DefenderSecureScoreOrdinalBand.High)]
    [InlineData(100, DefenderSecureScoreOrdinalBand.High)]
    public void FromSecureScorePercent_maps_ordinal_bands(int secureScore, DefenderSecureScoreOrdinalBand expectedBand)
    {
        DefenderSecureScoreOrdinalBandMapper.FromSecureScorePercent(secureScore).Should().Be(expectedBand);
    }

    [Fact]
    public void ToMetadataValue_never_returns_numeric_percent()
    {
        DefenderSecureScoreOrdinalBandMapper.ToMetadataValue(DefenderSecureScoreOrdinalBand.Medium)
            .Should()
            .Be("Medium");

        DefenderSecureScoreOrdinalBandMapper.ToMetadataValue(DefenderSecureScoreOrdinalBand.Unknown)
            .Should()
            .Be("Unknown");
    }
}
