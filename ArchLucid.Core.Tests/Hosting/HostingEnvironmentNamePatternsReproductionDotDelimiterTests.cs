using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostingEnvironmentNamePatternsReproductionDotDelimiterTests
{
    [Theory]
    [InlineData("my.reproduction.bug")]
    [InlineData("reproduction.bug")]
    [InlineData("bug.reproduction")]
    [InlineData("my.reproduction_bug")]
    public void EnvironmentNameImpliesProductionLike_rejects_dot_delimiter_reproduction_environment_names(string environmentName)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .BeFalse();
    }
}
