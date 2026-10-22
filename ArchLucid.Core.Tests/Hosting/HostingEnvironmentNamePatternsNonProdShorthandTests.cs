using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HostingEnvironmentNamePatternsNonProdShorthandTests
{
    [Theory]
    [InlineData("non-prod")]
    [InlineData("non.prod")]
    [InlineData("non_prod")]
    [InlineData("non prod")]
    [InlineData("NON-PROD")]
    public void EnvironmentNameImpliesProductionLike_rejects_non_prod_shorthand_variants(string environmentName)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .BeFalse();
    }
}
