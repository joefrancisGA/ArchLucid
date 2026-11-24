using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantDataRegionsReadOnlyTests
{
    [Fact]
    public void Platform_default_regions_cannot_be_changed_by_a_consumer()
    {
        IReadOnlyList<string> regions = TenantDataRegions.PlatformDefaultSupportedRegions;

        regions.Should().Contain(TenantDataRegions.Default);
        regions.Should().NotBeOfType<string[]>();
        var list = regions.Should().BeAssignableTo<IList<string>>().Subject;
        Action overwrite = () => list[0] = "unsupported-region";
        overwrite.Should().Throw<NotSupportedException>();
        regions[0].Should().Be(TenantDataRegions.Default);
    }
}
