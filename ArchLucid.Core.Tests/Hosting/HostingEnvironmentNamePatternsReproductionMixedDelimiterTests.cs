using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostingEnvironmentNamePatternsReproductionMixedDelimiterTests
{
    [Theory]
    [InlineData("my-reproduction_bug")]
    [InlineData("my_reproduction-bug")]
    public void EnvironmentNameImpliesProductionLike_rejects_mixed_delimiter_reproduction_environment_names(string environmentName)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .BeFalse();
    }
}
