using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostingEnvironmentNamePatternsProdigalTests
{
    [Theory]
    [InlineData("Prodigal")]
    [InlineData("prodigal-dev")]
    public void EnvironmentNameImpliesProductionLike_rejects_prodigal_environment_names(string environmentName)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .BeFalse();
    }
}
