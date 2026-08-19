using System.Net;
using System.Text;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Admin;

[Trait("Suite", "Core")]
public sealed class IdentityProviderDiscoveryServiceTests
{
    [Fact]
    public async Task DiscoverAsync_oidc_success_parses_issuer_and_jwks_uri()
    {
        const string discoveryJson =
            """
            {
              "issuer": "https://idp.example/",
              "jwks_uri": "https://idp.example/jwks"
            }
            """;

        using HttpClient httpClient = new(new CannedResponseHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(discoveryJson, Encoding.UTF8, "application/json")
        }));

        IdentityProviderDiscoveryService sut = new(httpClient);

        IdentityProviderDiscoverResponse response = await sut.DiscoverAsync(
            new IdentityProviderDiscoverRequest
            {
                Protocol = "oidc",
                MetadataUrl = "https://idp.example/"
            },
            CancellationToken.None);

        response.DiscoverySucceeded.Should().BeTrue();
        response.IssuerUri.Should().Be("https://idp.example/");
        response.JwksUri.Should().Be("https://idp.example/jwks");
    }

    [Fact]
    public async Task DiscoverAsync_saml_success_parses_entity_id()
    {
        const string metadataXml = """
            <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                              entityID="https://idp.example/saml">
              <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" />
            </EntityDescriptor>
            """;

        using HttpClient httpClient = new(new CannedResponseHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(metadataXml, Encoding.UTF8, "application/xml")
        }));

        IdentityProviderDiscoveryService sut = new(httpClient);

        IdentityProviderDiscoverResponse response = await sut.DiscoverAsync(
            new IdentityProviderDiscoverRequest
            {
                Protocol = "saml",
                MetadataUrl = "https://idp.example/metadata/saml"
            },
            CancellationToken.None);

        response.DiscoverySucceeded.Should().BeTrue();
        response.IssuerUri.Should().Be("https://idp.example/saml");
    }

    private sealed class CannedResponseHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _respond;

        public CannedResponseHandler(Func<HttpRequestMessage, HttpResponseMessage> respond)
        {
            _respond = respond ?? throw new ArgumentNullException(nameof(respond));
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(_respond(request));
    }
}
