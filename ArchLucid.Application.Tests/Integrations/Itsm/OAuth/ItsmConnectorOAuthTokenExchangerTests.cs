using System.Net;
using System.Net.Http.Json;

using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Core.Integrations.Itsm;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.OAuth;

[Trait("Category", "Unit")]
public sealed class ItsmConnectorOAuthTokenExchangerTests
{
    [Fact]
    public async Task TryExchangeAsync_ServiceNow_client_credentials_returns_bearer_token()
    {
        StubHandler handler = new(static (_, _) => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = JsonContent.Create(new { access_token = "snow-access", expires_in = 3600 })
        });

        ItsmConnectorOAuthTokenExchanger sut = new(new HttpClient(handler), NullLogger<ItsmConnectorOAuthTokenExchanger>.Instance);

        ItsmConnectorOAuthTokenExchangeResult? result = await sut.TryExchangeAsync(
            TenantItsmConnectorProvider.ServiceNow,
            ItsmConnectorAuthMode.OAuth2ClientCredentials,
            "https://tenant.service-now.com",
            "client-id",
            "client-secret",
            oauthRefreshToken: null,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.AccessToken.Should().Be("snow-access");
        handler.LastRequestUri.Should().Be("https://tenant.service-now.com/oauth_token.do");
    }

    [Fact]
    public async Task TryExchangeAuthorizationCodeAsync_atlassian_returns_refresh_token()
    {
        StubHandler handler = new(static (_, _) => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = JsonContent.Create(new { access_token = "atl-access", expires_in = 3600, refresh_token = "atl-refresh" })
        });

        ItsmConnectorOAuthTokenExchanger sut = new(new HttpClient(handler), NullLogger<ItsmConnectorOAuthTokenExchanger>.Instance);

        ItsmConnectorOAuthTokenExchangeResult? result = await sut.TryExchangeAuthorizationCodeAsync(
            "client-id",
            "client-secret",
            "auth-code",
            "https://app.example.com/callback",
            "verifier",
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.AccessToken.Should().Be("atl-access");
        result.RefreshToken.Should().Be("atl-refresh");
        handler.LastRequestUri.Should().Be("https://auth.atlassian.com/oauth/token");
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, HttpResponseMessage> _handler;

        public StubHandler(Func<HttpRequestMessage, CancellationToken, HttpResponseMessage> handler) =>
            _handler = handler ?? throw new ArgumentNullException(nameof(handler));

        public Uri? LastRequestUri
        {
            get;
            private set;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequestUri = request.RequestUri;

            return Task.FromResult(_handler(request, cancellationToken));
        }
    }
}
