using ArchLucid.Api.Services.Admin;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Admin;

/// <summary>Unit coverage for <see cref="SamlMetadataValidUntilParser" />.</summary>
[Trait("Suite", "Core")]
public sealed class SamlMetadataValidUntilParserTests
{
    [Fact]
    public void TryExtractValidUntilUtc_returns_null_for_empty_xml()
    {
        DateTimeOffset? result = SamlMetadataValidUntilParser.TryExtractValidUntilUtc(string.Empty);

        result.Should().BeNull();
    }

    [Fact]
    public void TryExtractValidUntilUtc_reads_root_attribute_on_entity_descriptor()
    {
        const string xml =
            "<EntityDescriptor xmlns=\"urn:oasis:names:tc:SAML:2.0:metadata\" validUntil=\"2032-02-02T02:02:02Z\"></EntityDescriptor>";

        DateTimeOffset? result = SamlMetadataValidUntilParser.TryExtractValidUntilUtc(xml);

        result.Should().Be(DateTimeOffset.Parse("2032-02-02T02:02:02Z", System.Globalization.CultureInfo.InvariantCulture));
    }

    [Fact]
    public void TryExtractValidUntilUtc_returns_null_when_attribute_missing()
    {
        const string xml = "<EntityDescriptor xmlns=\"urn:oasis:names:tc:SAML:2.0:metadata\"></EntityDescriptor>";

        DateTimeOffset? result = SamlMetadataValidUntilParser.TryExtractValidUntilUtc(xml);

        result.Should().BeNull();
    }

    [Fact]
    public void TryExtractValidUntilUtc_returns_null_for_non_xml()
    {
        DateTimeOffset? result = SamlMetadataValidUntilParser.TryExtractValidUntilUtc("<not-xml");

        result.Should().BeNull();
    }
}
