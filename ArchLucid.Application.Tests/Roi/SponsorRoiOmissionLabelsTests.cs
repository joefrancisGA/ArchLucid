using ArchLucid.Application.Roi;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.Roi;

public sealed class SponsorRoiOmissionLabelsTests
{
    [Fact]
    public void NormalizeCategory_uses_not_stored_and_stored_empty_copy()
    {
        SponsorRoiRunCollector.NormalizeCategory(null).Should().Be(SponsorRoiOmissionLabels.CategoryNotStored);
        SponsorRoiRunCollector.NormalizeCategory("").Should().Be(SponsorRoiOmissionLabels.CategoryStoredEmpty);
        SponsorRoiRunCollector.NormalizeCategory("   ").Should().Be(SponsorRoiOmissionLabels.CategoryStoredEmpty);
        SponsorRoiRunCollector.NormalizeCategory("Security").Should().Be("Security");
    }

    [Fact]
    public void ResolveSystemName_uses_not_stored_copy_when_missing()
    {
        SponsorRoiRunCollector.NormalizeSystemName(null).Should().Be(SponsorRoiOmissionLabels.SystemNameNotStored);
        SponsorRoiRunCollector.NormalizeSystemName("  ").Should().Be(SponsorRoiOmissionLabels.SystemNameNotStored);
    }
}
