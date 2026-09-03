using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostingEnvironmentNamePatternsReproductionEmbeddedTests
{
    [Theory]
    [InlineData("my-reproduction-bug")]
    [InlineData("reproductions")]
    public void EnvironmentNameImpliesProductionLike_rejects_embedded_reproduction_environment_names(string environmentName)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .BeFalse();
    }
}
