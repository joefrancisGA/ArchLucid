using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HostingEnvironmentNamePatternsNonProductionDelimiterTests
{
    [Theory]
    [InlineData("non_production")]
    [InlineData("non.production")]
    [InlineData("non production")]
    [InlineData("NON_PRODUCTION")]
    public void EnvironmentNameImpliesProductionLike_rejects_non_production_delimiter_variants(string environmentName)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .BeFalse();
    }
}
