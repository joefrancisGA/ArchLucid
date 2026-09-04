using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostingEnvironmentNamePatternsProduceTests
{
    [Theory]
    [InlineData("Produce")]
    [InlineData("produce")]
    [InlineData("produce-dev")]
    public void EnvironmentNameImpliesProductionLike_rejects_produce_environment_names(string environmentName)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .BeFalse();
    }
}
