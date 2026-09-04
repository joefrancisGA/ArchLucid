using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostingEnvironmentNamePatternsProddingTests
{
    [Theory]
    [InlineData("Prodding")]
    [InlineData("prodding")]
    [InlineData("prodding-dev")]
    public void EnvironmentNameImpliesProductionLike_rejects_prodding_environment_names(string environmentName)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .BeFalse();
    }
}
