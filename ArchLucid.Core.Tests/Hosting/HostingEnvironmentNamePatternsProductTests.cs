using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostingEnvironmentNamePatternsProductTests
{
    [Theory]
    [InlineData("Product")]
    [InlineData("product")]
    [InlineData("product-dev")]
    public void EnvironmentNameImpliesProductionLike_rejects_product_team_environment_names(string environmentName)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .BeFalse();
    }
}
