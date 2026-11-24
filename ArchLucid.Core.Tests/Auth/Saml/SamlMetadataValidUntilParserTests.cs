using ArchLucid.Core.Auth.Saml;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Auth.Saml;

[Trait("Suite", "Core")]
public sealed class SamlMetadataValidUntilParserTests
{
    [Fact]
    public void TryExtractValidUntilUtc_reads_validUntil_from_single_nested_entity_descriptor()
    {
        const string xml =
            """
            <EntitiesDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
              <EntityDescriptor entityID="https://idp.example.invalid" validUntil="2036-06-01T00:00:00Z" />
            </EntitiesDescriptor>
            """;

        DateTimeOffset? validUntil = SamlMetadataValidUntilParser.TryExtractValidUntilUtc(xml);

        validUntil.Should().Be(DateTimeOffset.Parse("2036-06-01T00:00:00Z", System.Globalization.CultureInfo.InvariantCulture));
    }

    [Fact]
    public void TryExtractValidUntilUtc_returns_earliest_validUntil_when_multiple_nested_entities()
    {
        const string xml =
            """
            <EntitiesDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
              <EntityDescriptor entityID="https://idp-a.example.invalid" validUntil="2036-06-01T00:00:00Z" />
              <EntityDescriptor entityID="https://idp-b.example.invalid" validUntil="2035-01-01T00:00:00Z" />
            </EntitiesDescriptor>
            """;

        DateTimeOffset? validUntil = SamlMetadataValidUntilParser.TryExtractValidUntilUtc(xml);

        validUntil.Should().Be(DateTimeOffset.Parse("2035-01-01T00:00:00Z", System.Globalization.CultureInfo.InvariantCulture));
    }

    [Fact]
    public void TryExtractValidUntilUtc_returns_earliest_validUntil_when_root_and_nested_entities_differ()
    {
        const string xml =
            """
            <EntitiesDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" validUntil="2036-06-01T00:00:00Z">
              <EntityDescriptor entityID="https://idp-a.example.invalid" validUntil="2020-01-01T00:00:00Z" />
              <EntityDescriptor entityID="https://idp-b.example.invalid" validUntil="2036-06-01T00:00:00Z" />
            </EntitiesDescriptor>
            """;

        DateTimeOffset? validUntil = SamlMetadataValidUntilParser.TryExtractValidUntilUtc(xml);

        validUntil.Should().Be(DateTimeOffset.Parse("2020-01-01T00:00:00Z", System.Globalization.CultureInfo.InvariantCulture));
    }

    [Fact]
    public void TryExtractValidUntilUtc_prefers_root_validUntil_on_entities_descriptor()
    {
        const string xml =
            """
            <EntitiesDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" validUntil="2035-01-01T00:00:00Z">
              <EntityDescriptor entityID="https://idp.example.invalid" validUntil="2036-06-01T00:00:00Z" />
            </EntitiesDescriptor>
            """;

        DateTimeOffset? validUntil = SamlMetadataValidUntilParser.TryExtractValidUntilUtc(xml);

        validUntil.Should().Be(DateTimeOffset.Parse("2035-01-01T00:00:00Z", System.Globalization.CultureInfo.InvariantCulture));
    }

    [Theory]
    [InlineData("<not-metadata />")]
    [InlineData("<broken")]
    [InlineData("<EntityDescriptor xmlns='urn:oasis:names:tc:SAML:2.0:metadata' validUntil='garbage' />")]
    [InlineData("<EntitiesDescriptor xmlns='urn:oasis:names:tc:SAML:2.0:metadata' validUntil='2036-01-01T00:00:00Z'><EntityDescriptor validUntil=''/></EntitiesDescriptor>")]
    public void TryReadValidUntilUtc_rejects_invalid_document_or_expiry(string xml)
    {
        SamlMetadataValidUntilParser.TryReadValidUntilUtc(xml, out DateTimeOffset? expiry).Should().BeFalse();
        expiry.Should().BeNull();
    }

    [Fact]
    public void TryReadValidUntilUtc_distinguishes_absent_expiry()
    {
        const string xml = "<EntityDescriptor xmlns='urn:oasis:names:tc:SAML:2.0:metadata'/>";
        SamlMetadataValidUntilParser.TryReadValidUntilUtc(xml, out DateTimeOffset? expiry).Should().BeTrue();
        expiry.Should().BeNull();
    }

    [Fact]
    public void TryReadValidUntilUtc_honors_expired_nested_federation_container()
    {
        const string xml = """
            <EntitiesDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" validUntil="2036-01-01T00:00:00Z">
              <EntitiesDescriptor validUntil="2020-01-01T00:00:00Z">
                <EntityDescriptor validUntil="2035-01-01T00:00:00Z"/>
              </EntitiesDescriptor>
            </EntitiesDescriptor>
            """;
        SamlMetadataValidUntilParser.TryReadValidUntilUtc(xml, out DateTimeOffset? expiry).Should().BeTrue();
        expiry.Should().Be(new DateTimeOffset(2020, 1, 1, 0, 0, 0, TimeSpan.Zero));
    }
}
