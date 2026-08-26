using System.Text.Json;

using ArchLucid.ContextIngestion.Infrastructure;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class CanonicalInfrastructurePropertyBagTests
{
    [Fact]
    public void TryAddTfProperty_redacts_sensitive_keys()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

        CanonicalInfrastructurePropertyBag.TryAddTfProperty(properties, "admin_password", "supersecret")
            .Should().BeTrue();

        properties["tf.admin_password"].Should().Be("[REDACTED]");
    }

    [Fact]
    public void TryAddTfProperty_redacts_camelCase_sensitive_keys()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

        CanonicalInfrastructurePropertyBag.TryAddTfProperty(properties, "connectionString", "Server=db;Password=secret")
            .Should().BeTrue();

        properties["tf.connectionstring"].Should().Be("[REDACTED]");
    }

    [Fact]
    public void TryAddTfProperty_truncates_long_values()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);
        string longValue = new('a', 600);

        CanonicalInfrastructurePropertyBag.TryAddTfProperty(properties, "note", longValue)
            .Should().BeTrue();

        properties["tf.note"].Length.Should().Be(512);
    }

    [Fact]
    public void CanonicalizeNumberText_normalizes_equivalent_whole_numbers()
    {
        using JsonDocument intDocument = JsonDocument.Parse("1");
        using JsonDocument decimalDocument = JsonDocument.Parse("1.0");

        string intText = CanonicalInfrastructurePropertyBag.CanonicalizeNumberText(intDocument.RootElement);
        string decimalText = CanonicalInfrastructurePropertyBag.CanonicalizeNumberText(decimalDocument.RootElement);

        intText.Should().Be("1");
        decimalText.Should().Be("1");
    }

    [Fact]
    public void TryAddTfProperty_lowercases_property_keys()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal);

        CanonicalInfrastructurePropertyBag.TryAddTfProperty(properties, "allowBlobPublicAccess", "true")
            .Should().BeTrue();

        properties.ContainsKey("tf.allowblobpublicaccess").Should().BeTrue();
    }

    [Fact]
    public void TryAddTfJsonProperty_canonicalizes_array_property_casing()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);
        using JsonDocument document = JsonDocument.Parse(
            """[{"Name":"AllowAll","IpAddress":"0.0.0.0/0","Action":"Allow"}]""");

        CanonicalInfrastructurePropertyBag.TryAddTfJsonProperty(properties, "ipSecurityRestrictions", document.RootElement)
            .Should().BeTrue();

        properties["tf.ipsecurityrestrictions"].Should().Be(
            """[{"action":"allow","ipaddress":"0.0.0.0/0","name":"allowall"}]""");
    }

    [Fact]
    public void TryAddTfJsonProperty_redacts_nested_sensitive_object_values()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);
        using JsonDocument document = JsonDocument.Parse(
            """{"connectionString":"supersecret","enabled":true}""");

        CanonicalInfrastructurePropertyBag.TryAddTfJsonProperty(properties, "siteConfig", document.RootElement)
            .Should().BeTrue();

        properties["tf.siteconfig"].Should().Be("[REDACTED]");
    }

    [Fact]
    public void TryAddTfBlockProperty_lowercases_block_keys()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal);

        CanonicalInfrastructurePropertyBag.TryAddTfBlockProperty(properties, "Site_Config", "enabled = true")
            .Should().BeTrue();

        properties.ContainsKey("tf.site_config").Should().BeTrue();
    }
}
