using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class TechnologyLedgerArtifactLintOptionsTests
{
    [Fact]
    public void SectionPath_matches_configuration_key()
    {
        TechnologyLedgerArtifactLintOptions.SectionPath
            .Should()
            .Be("ArchLucid:TechnologyConsistency:ArtifactLint");
    }

    [Fact]
    public void Defaults_are_enabled_warn_only()
    {
        TechnologyLedgerArtifactLintOptions options = new();

        options.Enabled.Should().BeTrue();
        options.Mode.Should().Be(TechnologyConsistencyFindingEngineMode.WarnOnly);
    }
}
