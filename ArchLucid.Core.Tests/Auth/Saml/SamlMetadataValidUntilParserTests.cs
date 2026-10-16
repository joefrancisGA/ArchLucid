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
}
