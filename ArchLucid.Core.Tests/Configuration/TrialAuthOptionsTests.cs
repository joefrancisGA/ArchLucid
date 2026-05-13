using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class TrialAuthOptionsTests
{
    [Fact]
    public void SectionPath_matches_binding_root()
    {
        TrialAuthOptions.SectionPath.Should().Be("Auth:Trial");
    }

    [Fact]
    public void Defaults_modes_empty_and_nested_local_identity_constructed()
    {
        TrialAuthOptions options = new();

        options.Modes.Should().BeEmpty();
        options.ExternalIdTenantId.Should().BeNull();
        options.LocalIdentity.Should().NotBeNull();
        options.LocalIdentity.JwtPrivateKeyPemPath.Should().BeEmpty();
    }

    [Fact]
    public void Round_trips_modes_and_external_tenant()
    {
        TrialAuthOptions options = new()
        {
            Modes = ["MsaExternalId", "Local"],
            ExternalIdTenantId = "11111111-1111-1111-1111-111111111111",
        };

        options.Modes.Should().Equal("MsaExternalId", "Local");
        options.ExternalIdTenantId.Should().Be("11111111-1111-1111-1111-111111111111");
    }
}
