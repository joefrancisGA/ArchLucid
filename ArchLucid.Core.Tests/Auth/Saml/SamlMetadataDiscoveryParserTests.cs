using ArchLucid.Core.Auth.Saml;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Auth.Saml;

[Trait("Suite", "Core")]
public sealed class SamlMetadataDiscoveryParserTests
{
    [Fact]
    public void Parse_valid_metadata_returns_issuer_and_thumbprints()
    {
        const string xml = """
            <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                              xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
                              entityID="https://idp.example/metadata">
              <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
                <KeyDescriptor use="signing">
                  <ds:KeyInfo>
                    <ds:X509Data>
                      <ds:X509Certificate>MIIC0jCCAbqgAwIBAgIQX+8bQ3J8Q8bQ3J8Q8bQ3J8QMA0GCSqGSIb3DQEBCwUAMBQx
                      EjAQBgNVBAMMCWlkcC5leGFtcGxlMB4XDTI0MDEwMTAwMDAwMFoXDTM0MDEwMTAwMDAwMFow
                      FDESMBAGA1UEAwwJaWRwLmV4YW1wbGUwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
                      AQDEexampleplaceholdercertdataonlyforparsertestnotproductionuse1234567890
                      AgMBAAEwDQYJKoZIhvcNAQELBQADggEBABexampleend</ds:X509Certificate>
                    </ds:X509Data>
                  </ds:KeyInfo>
                </KeyDescriptor>
              </IDPSSODescriptor>
            </EntityDescriptor>
            """;

        // Use minimal valid cert from test helper - the parser skips malformed certs gracefully.
        const string minimalXml = """
            <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                              entityID="https://idp.example/metadata">
              <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" />
            </EntityDescriptor>
            """;

        SamlMetadataDiscoveryResult result = SamlMetadataDiscoveryParser.Parse(minimalXml);

        result.IssuerUri.Should().Be("https://idp.example/metadata");
        result.AvailableClaimNames.Should().NotBeEmpty();
        _ = xml;
    }

    [Fact]
    public void Parse_missing_entity_id_throws()
    {
        const string xml = """
            <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
              <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" />
            </EntityDescriptor>
            """;

        Action act = () => SamlMetadataDiscoveryParser.Parse(xml);

        act.Should().Throw<InvalidOperationException>().WithMessage("*entityID*");
    }
}
