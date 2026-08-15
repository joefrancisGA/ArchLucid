using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

/// <summary>RC30 package-coverage batch: hosting environment name interpretation for production-like guards.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc30Tests
{
    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("   ", false)]
    [InlineData("Development", false)]
    [InlineData("Production", true)]
    [InlineData("PreProduction", true)]
    [InlineData("staging-prod", true)]
    [InlineData("non-production", false)]
    [InlineData("nonproduction", false)]
    [InlineData("NON-PRODUCTION", false)]
    public void HostingEnvironmentNamePatterns_EnvironmentNameImpliesProductionLike_maps_expected(
        string? environmentName,
        bool expectedProductionLike)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .Be(expectedProductionLike);
    }
}
