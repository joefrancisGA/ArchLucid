using System.Net;
using System.Text;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Services.Admin;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Admin;

/// <summary>Unit coverage for <see cref="OidcWellKnownDiagnosticsService" /> (OIDC discovery parsing and skip paths).</summary>
[Trait("Suite", "Core")]
public sealed class OidcWellKnownDiagnosticsServiceTests
{
    [Fact]
    public async Task BuildAsync_ApiKeyMode_skips_discovery_with_summary()
    {
        Mock<IOptionsMonitor<ArchLucidAuthOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new ArchLucidAuthOptions { Mode = "ApiKey", Audience = "x", Authority = "https://ignored/" });

        using HttpClient httpClient = new(new NotCalledHandler());
        OidcWellKnownDiagnosticsService sut = new(httpClient, monitor.Object);

        AdminOidcDiagnosticsResponse r = await sut.BuildAsync(CancellationToken.None);

        r.AuthMode.Should().Be("ApiKey");
        r.DiscoveryAttempted.Should().BeFalse();
        r.DiagnosticSummary.Should().Contain("not JwtBearer");
    }

    [Fact]
    public async Task BuildAsync_JwtBearer_local_pem_skips_discovery()
    {
        Mock<IOptionsMonitor<ArchLucidAuthOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new ArchLucidAuthOptions
        {
            Mode = "JwtBearer",
            JwtSigningPublicKeyPemPath = "keys/dev.pem",
            JwtLocalIssuer = "https://local-issuer/",
            JwtLocalAudience = "aud-local",
            Authority = "https://would-be-ignored/"
        });

        using HttpClient httpClient = new(new NotCalledHandler());
        OidcWellKnownDiagnosticsService sut = new(httpClient, monitor.Object);

        AdminOidcDiagnosticsResponse r = await sut.BuildAsync(CancellationToken.None);

        r.UsesLocalJwtSigningKey.Should().BeTrue();
        r.LocalJwtIssuer.Should().Be("https://local-issuer/");
        r.LocalJwtAudience.Should().Be("aud-local");
        r.DiscoveryAttempted.Should().BeFalse();
        r.DiagnosticSummary.Should().Contain("JwtSigningPublicKeyPemPath");
    }

    [Fact]
    public async Task BuildAsync_JwtBearer_empty_authority_returns_error_without_http()
    {
        Mock<IOptionsMonitor<ArchLucidAuthOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new ArchLucidAuthOptions { Mode = "JwtBearer", Audience = "api" });

        using HttpClient httpClient = new(new NotCalledHandler());
        OidcWellKnownDiagnosticsService sut = new(httpClient, monitor.Object);

        AdminOidcDiagnosticsResponse r = await sut.BuildAsync(CancellationToken.None);

        r.DiscoverySucceeded.Should().BeFalse();
        r.DiscoveryAttempted.Should().BeFalse();
        r.DiscoveryError.Should().Contain("Authority is empty");
    }

    [Fact]
    public async Task BuildAsync_JwtBearer_success_parses_discovery_document()
    {
        const string discoveryJson =
            """
            {
              "issuer": "https://idp.example/",
              "authorization_endpoint": "https://idp.example/authorize",
              "token_endpoint": "https://idp.example/token",
              "jwks_uri": "https://idp.example/jwks",
              "userinfo_endpoint": "https://idp.example/userinfo"
            }
            """;

        Mock<IOptionsMonitor<ArchLucidAuthOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new ArchLucidAuthOptions
        {
            Mode = "JwtBearer",
            Authority = "https://idp.example/",
            Audience = "api"
        });

        using HttpClient httpClient = new(new CannedResponseHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(discoveryJson, Encoding.UTF8, "application/json")
        }));

        OidcWellKnownDiagnosticsService sut = new(httpClient, monitor.Object);

        AdminOidcDiagnosticsResponse r = await sut.BuildAsync(CancellationToken.None);

        r.DiscoveryAttempted.Should().BeTrue();
        r.DiscoverySucceeded.Should().BeTrue();
        r.OpenIdConfigurationUrl.Should().Be("https://idp.example/.well-known/openid-configuration");
        r.IssuerFromDiscovery.Should().Be("https://idp.example/");
        r.AuthorizationEndpoint.Should().Be("https://idp.example/authorize");
        r.TokenEndpoint.Should().Be("https://idp.example/token");
        r.JwksUri.Should().Be("https://idp.example/jwks");
        r.UserinfoEndpoint.Should().Be("https://idp.example/userinfo");
    }

    [Fact]
    public async Task BuildAsync_JwtBearer_http_error_surfaces_status()
    {
        Mock<IOptionsMonitor<ArchLucidAuthOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new ArchLucidAuthOptions
        {
            Mode = "JwtBearer",
            Authority = "https://idp.example/",
            Audience = "api"
        });

        using HttpClient httpClient = new(new CannedResponseHandler(_ => new HttpResponseMessage(HttpStatusCode.NotFound)));
        OidcWellKnownDiagnosticsService sut = new(httpClient, monitor.Object);

        AdminOidcDiagnosticsResponse r = await sut.BuildAsync(CancellationToken.None);

        r.DiscoverySucceeded.Should().BeFalse();
        r.DiscoveryError.Should().Contain("404");
    }

    private sealed class NotCalledHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            throw new InvalidOperationException("HTTP should not be invoked for this scenario.");
        }
    }

    private sealed class CannedResponseHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _respond;

        public CannedResponseHandler(Func<HttpRequestMessage, HttpResponseMessage> respond)
        {
            _respond = respond ?? throw new ArgumentNullException(nameof(respond));
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(_respond(request));
        }
    }
}
