using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostingEnvironmentNamePatternsProdigyTests
{
    [Theory]
    [InlineData("Prodigy")]
    [InlineData("prodigy")]
    [InlineData("prodigy-dev")]
    public void EnvironmentNameImpliesProductionLike_rejects_prodigy_environment_names(string environmentName)
    {
        HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(environmentName)
            .Should()
            .BeFalse();
    }
}
