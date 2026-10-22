using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class TechnologyConsistencyFindingEngineOptionsTests
{
    [Fact]
    public void SectionPath_matches_configuration_key()
    {
        TechnologyConsistencyFindingEngineOptions.SectionPath
            .Should()
            .Be("ArchLucid:TechnologyConsistency:FindingEngine");
    }

    [Fact]
    public void Defaults_are_enabled_warn_only()
    {
        TechnologyConsistencyFindingEngineOptions options = new();

        options.Enabled.Should().BeTrue();
        options.Mode.Should().Be(TechnologyConsistencyFindingEngineMode.WarnOnly);
    }
}
