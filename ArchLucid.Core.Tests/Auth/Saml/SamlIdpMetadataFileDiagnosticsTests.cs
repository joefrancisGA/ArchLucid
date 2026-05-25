using ArchLucid.Core.Auth.Saml;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Auth.Saml;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SamlIdpMetadataFileDiagnosticsTests
{
    [Fact]
    public void Evaluate_parses_minimal_metadata_with_sso_endpoint()
    {
        const string xml = """
            <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                              entityID="https://idp.example/metadata">
              <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
                <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                                     Location="https://idp.example/sso"/>
              </IDPSSODescriptor>
            </EntityDescriptor>
            """;

        IReadOnlyList<SamlTestConfigComponentResult> results = SamlIdpMetadataFileDiagnostics.Evaluate(xml);

        results.Should().Contain(static r =>
            r.Component == "metadata.parse" && r.Status == SamlTestConfigComponentStatus.Pass);
        results.Should().Contain(static r =>
            r.Component == "metadata.ssoEndpoints" && r.Status == SamlTestConfigComponentStatus.Pass);
    }

    [Fact]
    public void Evaluate_fails_when_sso_endpoint_missing()
    {
        const string xml = """
            <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                              entityID="https://idp.example/metadata">
              <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"/>
            </EntityDescriptor>
            """;

        IReadOnlyList<SamlTestConfigComponentResult> results = SamlIdpMetadataFileDiagnostics.Evaluate(xml);

        results.Should().Contain(static r =>
            r.Component == "metadata.ssoEndpoints" && r.Status == SamlTestConfigComponentStatus.Fail);
    }
}
