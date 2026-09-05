using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostingEnvironmentNamePatternsReproduceTests
{
    [Theory]
    [InlineData("Reproduce")]
    [InlineData("reproduce")]
    [InlineData("reproduce-bug-642")]
    public void EnvironmentNameImpliesProductionLike_rejects_reproduce_environment_names(string environmentName)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .BeFalse();
    }
}
