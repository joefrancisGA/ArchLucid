using ArchLucid.Core.Safety;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Safety;

[Trait("Category", "Unit")]
public sealed class ContentSafetyBlockSeverityThresholdTests
{
    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 0)]
    [InlineData(2, 2)]
    [InlineData(3, 2)]
    [InlineData(4, 4)]
    [InlineData(5, 4)]
    [InlineData(6, 6)]
    [InlineData(99, 6)]
    public void Normalize_floors_to_standard_four_level_scale(int configured, int expected) =>
        ContentSafetyBlockSeverityThreshold.Normalize(configured).Should().Be(expected);
}
