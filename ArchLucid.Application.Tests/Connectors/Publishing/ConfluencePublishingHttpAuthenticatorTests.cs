using System.Net.Http.Headers;

using ArchLucid.Application.Connectors.Publishing;
using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Connectors.Publishing;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ConfluencePublishingHttpAuthenticatorTests
{
    [Fact]
    public async Task TryCreateAuthorizationHeaderAsync_basic_mode_returns_basic_header()
    {
        Mock<IOptionsMonitor<ConfluencePublishingOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new ConfluencePublishingOptions
        {
            AuthMode = ItsmConnectorAuthMode.BasicApiToken,
            ServiceAccountEmail = "bot@example.com",
            ApiToken = "secret-token"
        });

        ConfluencePublishingHttpAuthenticator sut = new(
            monitor.Object,
            Mock.Of<IItsmConnectorOAuthTokenExchanger>(),
            new ItsmConnectorOAuthAccessTokenCache());

        AuthenticationHeaderValue? header =
            await sut.TryCreateAuthorizationHeaderAsync(CancellationToken.None);

        header.Should().NotBeNull();
        header!.Scheme.Should().Be("Basic");
    }

    [Fact]
    public async Task TryCreateAuthorizationHeaderAsync_oauth_refresh_uses_exchanger_and_caches()
    {
        Mock<IOptionsMonitor<ConfluencePublishingOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new ConfluencePublishingOptions
        {
            CloudBaseUrl = "https://example.atlassian.net",
            AuthMode = ItsmConnectorAuthMode.OAuth2RefreshToken,
            OAuthClientId = "client",
            OAuthClientSecret = "secret",
            OAuthRefreshToken = "refresh"
        });

        Mock<IItsmConnectorOAuthTokenExchanger> exchanger = new();
        exchanger
            .Setup(e => e.TryExchangeAsync(
                TenantItsmConnectorProvider.Jira,
                ItsmConnectorAuthMode.OAuth2RefreshToken,
                "https://example.atlassian.net",
                "client",
                "secret",
                "refresh",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ItsmConnectorOAuthTokenExchangeResult
            {
                AccessToken = "access-1",
                ExpiresAtUtc = TimeProvider.System.GetUtcNow().AddMinutes(30)
            });

        ItsmConnectorOAuthAccessTokenCache cache = new();
        ConfluencePublishingHttpAuthenticator sut = new(monitor.Object, exchanger.Object, cache);

        AuthenticationHeaderValue? first =
            await sut.TryCreateAuthorizationHeaderAsync(CancellationToken.None);

        AuthenticationHeaderValue? second =
            await sut.TryCreateAuthorizationHeaderAsync(CancellationToken.None);

        first!.Scheme.Should().Be("Bearer");
        second!.Parameter.Should().Be("access-1");
        exchanger.Verify(
            e => e.TryExchangeAsync(
                TenantItsmConnectorProvider.Jira,
                ItsmConnectorAuthMode.OAuth2RefreshToken,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
