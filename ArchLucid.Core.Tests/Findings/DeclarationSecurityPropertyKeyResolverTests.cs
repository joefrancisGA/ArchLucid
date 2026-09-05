using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class DeclarationSecurityPropertyKeyResolverTests
{
    [Fact]
    public void TryGet_resolves_tf_snake_case_public_network_access()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access"] = "enabled",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.public_network_access");
        value.Should().Be("enabled");
    }

    [Fact]
    public void TryGet_resolves_compacted_tf_publicnetworkaccess()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.publicnetworkaccess"] = "enabled",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.publicnetworkaccess");
        value.Should().Be("enabled");
    }

    [Fact]
    public void TryGet_resolves_arm_publicNetworkAccess()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["publicNetworkAccess"] = "enabled",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("publicNetworkAccess");
        value.Should().Be("enabled");
    }

    [Fact]
    public void TryGet_resolves_arm_sslEnforcementEnabled()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["sslEnforcementEnabled"] = "Enabled",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("sslEnforcementEnabled");
        value.Should().Be("Enabled");
    }

    [Fact]
    public void TryGet_returns_false_for_empty_properties()
    {
        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            new Dictionary<string, string>(),
            DeclarationSecurityPropertyLogicalNames.HttpsOnly,
            out _,
            out _);

        found.Should().BeFalse();
    }
}
