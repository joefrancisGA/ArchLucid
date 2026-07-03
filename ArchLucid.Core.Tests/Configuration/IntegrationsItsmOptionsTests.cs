using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class IntegrationsItsmOptionsTests
{
    [Fact]
    public void SectionName_matches_binding_root()
    {
        IntegrationsItsmOptions.SectionName.Should().Be("Integrations:Itsm");
    }

    [Fact]
    public void NativeEnabled_defaults_true_for_v1_ga_posture()
    {
        IntegrationsItsmOptions options = new();

        options.NativeEnabled.Should().BeTrue();
    }
}
