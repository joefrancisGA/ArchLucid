using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;

using ArchLucid.Api.Auth.Services;

using FluentAssertions;

using ITfoxtec.Identity.Saml2;
using ITfoxtec.Identity.Saml2.Schemas.Metadata;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Auth")]
public sealed class ArchLucidSaml2IdpMetadataBinderTests
{
    [Fact]
    public void ApplyResolvedEntity_maps_sso_slo_certs_and_optional_authn_request_signing()
    {
        X509Certificate2 idpSigning = CreateValidTestCertificate(validYears: 10);
        string certB64 = Convert.ToBase64String(idpSigning.Export(X509ContentType.Cert));

        StringBuilder xml = new();
        xml.AppendLine("""<?xml version="1.0" encoding="UTF-8"?>""");
        xml.AppendLine(
            """<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://idp.test.example/metadata">""");
        xml.AppendLine(
            """  <IDPSSODescriptor WantAuthnRequestsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">""");
        xml.AppendLine("""    <KeyDescriptor use="signing">""");
        xml.AppendLine("""      <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">""");
        xml.AppendLine("""        <X509Data>""");
        xml.AppendLine($"""          <X509Certificate>{certB64}</X509Certificate>""");
        xml.AppendLine("""        </X509Data>""");
        xml.AppendLine("""      </KeyInfo>""");
        xml.AppendLine("""    </KeyDescriptor>""");
        xml.AppendLine(
            """    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://idp.test.example/sso"/>""");
        xml.AppendLine(
            """    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://idp.test.example/slo"/>""");
        xml.AppendLine("""  </IDPSSODescriptor>""");
        xml.AppendLine("</EntityDescriptor>");

        EntityDescriptor entityDescriptor = new EntityDescriptor();
        entityDescriptor.ReadIdPSsoDescriptor(xml.ToString());

        Saml2Configuration configuration = new();
        configuration.SignatureValidationCertificates.Clear();

        ArchLucidSaml2IdpMetadataBinder.ApplyResolvedEntity(configuration, entityDescriptor);

        configuration.AllowedIssuer.Should().Be("https://idp.test.example/metadata");
        configuration.SingleSignOnDestination.ToString().Should().Be("https://idp.test.example/sso");
        configuration.SingleLogoutDestination.Should().NotBeNull();
        configuration.SingleLogoutDestination!.ToString().Should().Be("https://idp.test.example/slo");
        configuration.SignatureValidationCertificates.Should().ContainSingle();
        configuration.SignAuthnRequest.Should().BeTrue();
    }

    [Fact]
    public void ApplyResolvedEntity_throws_when_idp_descriptor_missing()
    {
        EntityDescriptor entityDescriptor = new();

        Saml2Configuration configuration = new();

        Action act = () => ArchLucidSaml2IdpMetadataBinder.ApplyResolvedEntity(configuration, entityDescriptor);

        act.Should().Throw<InvalidOperationException>().WithMessage("*IdPSSODescriptor*");
    }

    [Fact]
    public void ApplyResolvedEntity_throws_when_no_valid_signing_certificates()
    {
        X509Certificate2 expired = CreateTestCertificate(notBeforeUtc: DateTime.UtcNow.AddYears(-2), notAfterUtc: DateTime.UtcNow.AddDays(-1));
        string certB64 = Convert.ToBase64String(expired.Export(X509ContentType.Cert));

        StringBuilder xml = new();
        xml.AppendLine("""<?xml version="1.0" encoding="UTF-8"?>""");
        xml.AppendLine(
            """<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://idp.test.example/metadata">""");
        xml.AppendLine(
            """  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">""");
        xml.AppendLine("""    <KeyDescriptor use="signing">""");
        xml.AppendLine("""      <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">""");
        xml.AppendLine("""        <X509Data>""");
        xml.AppendLine($"""          <X509Certificate>{certB64}</X509Certificate>""");
        xml.AppendLine("""        </X509Data>""");
        xml.AppendLine("""      </KeyInfo>""");
        xml.AppendLine("""    </KeyDescriptor>""");
        xml.AppendLine(
            """    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://idp.test.example/sso"/>""");
        xml.AppendLine("""  </IDPSSODescriptor>""");
        xml.AppendLine("</EntityDescriptor>");

        EntityDescriptor entityDescriptor = new EntityDescriptor();
        entityDescriptor.ReadIdPSsoDescriptor(xml.ToString());

        Saml2Configuration configuration = new();
        configuration.SignatureValidationCertificates.Clear();

        Action act = () => ArchLucidSaml2IdpMetadataBinder.ApplyResolvedEntity(configuration, entityDescriptor);

        act.Should().Throw<InvalidOperationException>().WithMessage("*signing certificates*");
    }

    private static X509Certificate2 CreateValidTestCertificate(int validYears)
    {
        return CreateTestCertificate(DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddYears(validYears));
    }

    private static X509Certificate2 CreateTestCertificate(DateTime notBeforeUtc, DateTime notAfterUtc)
    {
        using RSA rsa = RSA.Create(2048);

        CertificateRequest request = new(
            "CN=ArchLucid SAML Metadata Binder Test IdP",
            rsa,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);

        return request.CreateSelfSigned(new DateTimeOffset(notBeforeUtc), new DateTimeOffset(notAfterUtc));
    }
}
