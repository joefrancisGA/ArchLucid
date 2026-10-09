using System.Net;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
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
    public async Task DiscoverAsync_oidc_includes_claims_supported_in_available_claim_names()
    {
        // The wizard datalist is availableClaimNames. OpenID discovery advertises those names in claims_supported.
        const string discoveryJson =
            """
            {
              "issuer": "https://idp.example/",
              "claims_supported": ["department", "Groups", "  ", "department"]
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
        response.AvailableClaimNames.Take(4).Should().Equal(
            "groups",
            "roles",
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
            "memberOf");
        response.AvailableClaimNames.Should().ContainSingle(name => name == "department");
        response.AvailableClaimNames.Should().ContainSingle(name => name.Equals("groups", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task DiscoverAsync_saml_invisible_only_entity_id_marks_discovery_failed()
    {
        const string metadataXml = """
            <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                              entityID="&#x200B;">
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

        response.DiscoverySucceeded.Should().BeFalse();
        response.DiagnosticSummary.Should().Contain("entityID");
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

    [Fact]
    public async Task DiscoverAsync_saml_reads_entity_id_when_metadata_root_is_entities_descriptor()
    {
        // SAML metadata instances use either EntityDescriptor or EntitiesDescriptor as the document element.
        // A single IdP wrapped in EntitiesDescriptor still carries entityID on the child.
        const string metadataXml = """
            <EntitiesDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
              <EntityDescriptor entityID="https://idp.example/saml">
                <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" />
              </EntityDescriptor>
            </EntitiesDescriptor>
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

    [Fact]
    public async Task DiscoverAsync_saml_rejects_metadata_with_more_than_one_entity_descriptor()
    {
        const string metadataXml = """
            <EntitiesDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
              <EntityDescriptor entityID="https://idp.example/one">
                <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" />
              </EntityDescriptor>
              <EntityDescriptor entityID="https://idp.example/two">
                <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" />
              </EntityDescriptor>
            </EntitiesDescriptor>
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

        response.DiscoverySucceeded.Should().BeFalse();
        response.DiagnosticSummary.Should().Contain("more than one EntityDescriptor");
    }

    [Fact]
    public async Task DiscoverAsync_saml_timeout_returns_failed_response_instead_of_throwing()
    {
        using HttpClient httpClient = new(new TimeoutSimulatingHandler())
        {
            Timeout = TimeSpan.FromMilliseconds(50)
        };

        IdentityProviderDiscoveryService sut = new(httpClient);

        IdentityProviderDiscoverResponse response = await sut.DiscoverAsync(
            new IdentityProviderDiscoverRequest
            {
                Protocol = "saml",
                MetadataUrl = "https://idp.example/metadata/saml"
            },
            CancellationToken.None);

        response.DiscoverySucceeded.Should().BeFalse();
        response.DiagnosticSummary.Should().Contain("timed out");
    }

    [Fact]
    public async Task DiscoverAsync_oidc_invisible_only_issuer_marks_discovery_failed()
    {
        const string discoveryJson =
            """
            {
              "issuer": "\u200B"
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

        response.DiscoverySucceeded.Should().BeFalse();
        response.DiagnosticSummary.Should().Contain("issuer");
    }

    [Fact]
    public async Task DiscoverAsync_rejects_non_http_scheme_metadata_url()
    {
        IdentityProviderDiscoveryService sut = new(new HttpClient(new CannedResponseHandler(_ => new HttpResponseMessage(HttpStatusCode.OK))));

        IdentityProviderDiscoverResponse response = await sut.DiscoverAsync(
            new IdentityProviderDiscoverRequest
            {
                Protocol = "oidc",
                MetadataUrl = "file:///etc/passwd"
            },
            CancellationToken.None);

        response.DiscoverySucceeded.Should().BeFalse();
        response.DiagnosticSummary.Should().Contain("HTTP(S)");
    }

    [Theory]
    [InlineData("file:///etc/passwd")]
    [InlineData("javascript:alert(1)")]
    [InlineData("https://user:pass@idp.example/jwks")]
    [InlineData("https://idp.example/jwks#keys")]
    public async Task DiscoverAsync_oidc_does_not_fetch_jwks_uri_outside_http_validation(string jwksUri)
    {
        // The admin metadata URL is already HTTP(S). The document can still name a jwks_uri the
        // server must not follow: another scheme, embedded credentials, or a fragment.
        string discoveryJson =
            $$"""
            {
              "issuer": "https://idp.example/",
              "jwks_uri": "{{jwksUri}}"
            }
            """;

        List<string> requested = [];

        using HttpClient httpClient = new(new CannedResponseHandler(request =>
        {
            requested.Add(request.RequestUri!.AbsoluteUri);

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(discoveryJson, Encoding.UTF8, "application/json")
            };
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
        response.SigningCertificateThumbprints.Should().BeEmpty();
        requested.Should().ContainSingle();
        requested[0].Should().EndWith("/.well-known/openid-configuration");
    }

    [Theory]
    [InlineData(
        "https://idp.example/oidc?tenant=acme",
        "https://idp.example/oidc/.well-known/openid-configuration?tenant=acme",
        "https://idp.example/oidc")]
    [InlineData(
        "https://idp.example/oidc/?tenant=acme",
        "https://idp.example/oidc/.well-known/openid-configuration?tenant=acme",
        "https://idp.example/oidc")]
    [InlineData(
        "https://idp.example/.well-known/openid-configuration?tenant=acme",
        "https://idp.example/.well-known/openid-configuration?tenant=acme",
        "https://idp.example/")]
    public async Task DiscoverAsync_oidc_keeps_metadata_query_outside_the_well_known_path(
        string metadataUrl,
        string expectedRequest,
        string issuer)
    {
        // Tenant routers put the tenant in the query. The well-known segment belongs on the path.
        string discoveryJson =
            $$"""
            {
              "issuer": "{{issuer}}"
            }
            """;

        List<string> requested = [];

        using HttpClient httpClient = new(new CannedResponseHandler(request =>
        {
            requested.Add(request.RequestUri!.AbsoluteUri);

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(discoveryJson, Encoding.UTF8, "application/json")
            };
        }));

        IdentityProviderDiscoveryService sut = new(httpClient);

        IdentityProviderDiscoverResponse response = await sut.DiscoverAsync(
            new IdentityProviderDiscoverRequest
            {
                Protocol = "oidc",
                MetadataUrl = metadataUrl
            },
            CancellationToken.None);

        requested.Should().ContainSingle();
        requested[0].Should().Be(expectedRequest);
        response.DiscoverySucceeded.Should().BeTrue();
    }

    [Fact]
    public async Task DiscoverAsync_oidc_rejects_issuer_that_does_not_match_the_metadata_url()
    {
        // The wizard copies issuerUri into activate. OpenID discovery requires that value to be
        // the metadata URL the operator asked us to fetch, not a different issuer in the document.
        const string discoveryJson =
            """
            {
              "issuer": "https://evil.example/realms/acme"
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
                MetadataUrl = "https://idp.example/realms/acme"
            },
            CancellationToken.None);

        response.DiscoverySucceeded.Should().BeFalse();
        response.DiagnosticSummary.Should().Contain("does not match");
    }

    [Fact]
    public async Task DiscoverAsync_oidc_accepts_issuer_when_only_the_trailing_slash_differs()
    {
        const string discoveryJson =
            """
            {
              "issuer": "https://idp.example/realms/acme"
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
                MetadataUrl = "https://idp.example/realms/acme/"
            },
            CancellationToken.None);

        response.DiscoverySucceeded.Should().BeTrue();
        response.IssuerUri.Should().Be("https://idp.example/realms/acme");
    }

    [Fact]
    public async Task DiscoverAsync_oidc_reports_jwks_x5t_as_hex_certificate_thumbprint()
    {
        // RFC 7517 x5t is base64url SHA-1. The wizard shows the same hex thumbprint as SAML discovery.
        using RSA rsa = RSA.Create(2048);
        CertificateRequest certificateRequest = new(
            "CN=idp.example",
            rsa,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);
        using X509Certificate2 certificate = certificateRequest.CreateSelfSigned(
            DateTimeOffset.UtcNow.AddDays(-1),
            DateTimeOffset.UtcNow.AddDays(30));

        byte[] sha1 = SHA1.HashData(certificate.RawData);
        string x5t = Convert.ToBase64String(sha1).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        string discoveryJson =
            $$"""
            {
              "issuer": "https://idp.example/",
              "jwks_uri": "https://idp.example/jwks"
            }
            """;
        string jwksJson =
            $$"""
            {
              "keys": [ { "kty": "RSA", "x5t": "{{x5t}}" } ]
            }
            """;

        using HttpClient httpClient = new(new CannedResponseHandler(request =>
        {
            string body = request.RequestUri!.AbsolutePath.EndsWith("/jwks", StringComparison.Ordinal)
                ? jwksJson
                : discoveryJson;

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };
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
        response.SigningCertificateThumbprints.Should().Equal(certificate.Thumbprint);
    }

    [Fact]
    public async Task DiscoverAsync_oidc_uses_x5c_thumbprint_when_x5t_is_not_sha1()
    {
        using RSA rsa = RSA.Create(2048);
        CertificateRequest certificateRequest = new(
            "CN=idp.example",
            rsa,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);
        using X509Certificate2 certificate = certificateRequest.CreateSelfSigned(
            DateTimeOffset.UtcNow.AddDays(-1),
            DateTimeOffset.UtcNow.AddDays(30));

        string certBase64 = Convert.ToBase64String(certificate.RawData);
        string discoveryJson =
            """
            {
              "issuer": "https://idp.example/",
              "jwks_uri": "https://idp.example/jwks"
            }
            """;
        string jwksJson =
            $$"""
            {
              "keys": [ { "kty": "RSA", "x5t": "%%%", "x5c": ["{{certBase64}}"] } ]
            }
            """;

        using HttpClient httpClient = new(new CannedResponseHandler(request =>
        {
            string body = request.RequestUri!.AbsolutePath.EndsWith("/jwks", StringComparison.Ordinal)
                ? jwksJson
                : discoveryJson;

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };
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
        response.SigningCertificateThumbprints.Should().Equal(certificate.Thumbprint);
    }

    [Fact]
    public async Task DiscoverAsync_saml_empty_body_returns_failed_response_instead_of_throwing()
    {
        using HttpClient httpClient = new(new CannedResponseHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(string.Empty, Encoding.UTF8, "application/xml")
        }));

        IdentityProviderDiscoveryService sut = new(httpClient);

        IdentityProviderDiscoverResponse response = await sut.DiscoverAsync(
            new IdentityProviderDiscoverRequest
            {
                Protocol = "saml",
                MetadataUrl = "https://idp.example/metadata/saml"
            },
            CancellationToken.None);

        response.DiscoverySucceeded.Should().BeFalse();
        response.DiagnosticSummary.Should().Contain("SAML metadata XML is required");
    }

    [Fact]
    public async Task DiscoverAsync_oidc_omits_jwks_encryption_keys_from_signing_thumbprints()
    {
        // The wizard shows these values as signing certificate thumbprints. SAML discovery already
        // skips KeyDescriptor use="encryption". JWKS use=enc and encrypt-only key_ops are the same class.
        using X509Certificate2 signingCertificate = CreateSelfSignedCertificate();
        using X509Certificate2 encryptionCertificate = CreateSelfSignedCertificate();
        string signingX5t = ToBase64UrlSha1Thumbprint(signingCertificate);
        string encryptionX5t = ToBase64UrlSha1Thumbprint(encryptionCertificate);
        const string discoveryJson =
            """
            {
              "issuer": "https://idp.example/",
              "jwks_uri": "https://idp.example/jwks"
            }
            """;
        string jwksJson =
            $$"""
            {
              "keys": [
                { "kty": "RSA", "use": "enc", "x5t": "{{encryptionX5t}}" },
                { "kty": "RSA", "key_ops": ["encrypt", "wrapKey"], "x5t": "{{encryptionX5t}}" },
                { "kty": "RSA", "use": "sig", "x5t": "{{signingX5t}}" }
              ]
            }
            """;

        using HttpClient httpClient = new(new CannedResponseHandler(request =>
        {
            string body = request.RequestUri!.AbsolutePath.EndsWith("/jwks", StringComparison.Ordinal)
                ? jwksJson
                : discoveryJson;

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };
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
        response.SigningCertificateThumbprints.Should().Equal(signingCertificate.Thumbprint);
    }

    private static X509Certificate2 CreateSelfSignedCertificate()
    {
        using RSA rsa = RSA.Create(2048);
        CertificateRequest certificateRequest = new(
            "CN=idp.example",
            rsa,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);

        return certificateRequest.CreateSelfSigned(
            DateTimeOffset.UtcNow.AddDays(-1),
            DateTimeOffset.UtcNow.AddDays(30));
    }

    private static string ToBase64UrlSha1Thumbprint(X509Certificate2 certificate)
    {
        byte[] sha1 = SHA1.HashData(certificate.RawData);

        return Convert.ToBase64String(sha1).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private sealed class TimeoutSimulatingHandler : HttpMessageHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            await Task.Delay(TimeSpan.FromSeconds(30), cancellationToken);

            return new HttpResponseMessage(HttpStatusCode.OK);
        }
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
