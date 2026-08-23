using ArchLucid.Contracts.User;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
public sealed class IanaTimeZonePreferenceValuesTests
{
    [Fact]
    public void NormalizeOrDefault_ReturnsUtcForBlank()
    {
        IanaTimeZonePreferenceValues.NormalizeOrDefault(null).Should().Be("UTC");
        IanaTimeZonePreferenceValues.NormalizeOrDefault("   ").Should().Be("UTC");
    }

    [Fact]
    public void NormalizeOrNull_MapsUtcAliases()
    {
        IanaTimeZonePreferenceValues.NormalizeOrNull("Etc/UTC").Should().Be("UTC");
        IanaTimeZonePreferenceValues.NormalizeOrNull("Africa/Abidjan").Should().Be("UTC");
    }

    [Fact]
    public void NormalizeOrNull_AcceptsKnownZone()
    {
        IanaTimeZonePreferenceValues.NormalizeOrNull("America/New_York").Should().Be("America/New_York");
    }

    [Fact]
    public void NormalizeOrNull_RejectsUnknownZone()
    {
        IanaTimeZonePreferenceValues.NormalizeOrNull("Not/AZone").Should().BeNull();
    }
}
