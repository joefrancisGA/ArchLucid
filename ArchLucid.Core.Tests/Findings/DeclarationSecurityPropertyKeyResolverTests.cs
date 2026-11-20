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
    public void TryGet_resolves_tf_public_network_access_enabled()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.public_network_access_enabled"] = "true",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.public_network_access_enabled");
        value.Should().Be("true");
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
    public void TryGet_resolves_compacted_tf_publiclyaccessible()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.publiclyaccessible"] = "false",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.publiclyaccessible");
        value.Should().Be("false");
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
    public void TryGet_resolves_compacted_tf_sslenforcementenabled()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.sslenforcementenabled"] = "Disabled",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.sslenforcementenabled");
        value.Should().Be("Disabled");
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
    public void TryGet_resolves_tf_networkacls_for_ingress_blob()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.networkacls"] = "0.0.0.0/0:22",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.IngressBlob,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.networkacls");
        value.Should().Be("0.0.0.0/0:22");
    }

    [Fact]
    public void TryGet_resolves_tf_ipsecurityrestrictions_for_ingress_blob()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.ipsecurityrestrictions"] = """[{"ipAddress":"0.0.0.0/0","action":"Allow"}]""",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.IngressBlob,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.ipsecurityrestrictions");
        value.Should().Contain("0.0.0.0/0");
    }

    [Fact]
    public void TryGet_resolves_tf_network_acls_for_ingress_blob()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.network_acls"] = """[{"ipAddress":"0.0.0.0/0","action":"Allow"}]""",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.IngressBlob,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.network_acls");
        value.Should().Contain("0.0.0.0/0");
    }

    [Fact]
    public void TryGet_resolves_compacted_tf_minimaltlsversion()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.minimaltlsversion"] = "TLS1_2",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.minimaltlsversion");
        value.Should().Be("TLS1_2");
    }

    [Fact]
    public void TryGet_resolves_tf_ssl_enforcement_shorthand_on_sql_bags()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.ssl_enforcement"] = "Enabled",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.ssl_enforcement");
        value.Should().Be("Enabled");
    }

    [Fact]
    public void TryGet_resolves_compacted_tf_sslenforcement_without_enabled_suffix()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.sslenforcement"] = "Enabled",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.sslenforcement");
        value.Should().Be("Enabled");
    }

    [Fact]
    public void TryGet_resolves_compacted_tf_enablehttpstrafficonly()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.enablehttpstrafficonly"] = "true",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.HttpsOnly,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.enablehttpstrafficonly");
        value.Should().Be("true");
    }

    [Fact]
    public void TryGet_resolves_compacted_tf_requiressl_for_https_only_logical_name()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.requiressl"] = "true",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.HttpsOnly,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.requiressl");
        value.Should().Be("true");
    }

    [Fact]
    public void TryGet_resolves_compacted_tf_ipv4enabled_for_public_network_access()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.ipv4enabled"] = "false",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.ipv4enabled");
        value.Should().Be("false");
    }

    [Fact]
    public void TryGet_resolves_compacted_tf_enablepublicaccess_for_public_network_access()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.enablepublicaccess"] = "false",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.enablepublicaccess");
        value.Should().Be("false");
    }

    [Fact]
    public void TryGet_resolves_compacted_tf_internetaccessenabled_for_public_network_access()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.internetaccessenabled"] = "false",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.internetaccessenabled");
        value.Should().Be("false");
    }

    [Fact]
    public void TryGet_resolves_compacted_tf_encryptionenabled_for_storage_encrypted()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.encryptionenabled"] = "false",
        };

        bool found = DeclarationSecurityPropertyKeyResolver.TryGet(
            properties,
            DeclarationSecurityPropertyLogicalNames.StorageEncrypted,
            out string? canonicalKey,
            out string? value);

        found.Should().BeTrue();
        canonicalKey.Should().Be("tf.encryptionenabled");
        value.Should().Be("false");
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
