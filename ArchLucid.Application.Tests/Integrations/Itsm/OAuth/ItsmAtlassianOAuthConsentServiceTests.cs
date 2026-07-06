using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.IntegrationSecrets;
using ArchLucid.Core.Secrets;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm.OAuth;

[Trait("Category", "Unit")]
public sealed class ItsmAtlassianOAuthConsentServiceTests
{
    [Fact]
    public async Task TryStartAsync_returns_authorize_url_with_state()
    {
        ItsmAtlassianOAuthConsentService sut = CreateSut(
            tokenExchanger: new Mock<IItsmConnectorOAuthTokenExchanger>().Object,
            secretWriter: new Mock<IIntegrationSecretWriter>().Object,
            connectionRepository: new InMemoryTenantItsmConnectorConnectionRepository());

        ItsmAtlassianOAuthConsentStartRequest request = new()
        {
            InstanceBaseUrl = "https://tenant.atlassian.net",
            RedirectUri = "https://app.example.com/integrations/itsm/oauth/callback",
            OAuthClientIdKeyVaultSecretName = "kv-jira-client-id",
            OAuthClientSecretKeyVaultSecretName = "kv-jira-client-secret",
            OAuthRefreshTokenKeyVaultSecretName = "kv-jira-refresh"
        };

        (ItsmAtlassianOAuthConsentStartResponse? response, string? error) =
            await sut.TryStartAsync(Guid.NewGuid(), request, CancellationToken.None);

        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.AuthorizeUrl.Should().Contain("auth.atlassian.com/authorize");
        response.AuthorizeUrl.Should().Contain("code_challenge=");
        response.State.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task TryCompleteAsync_persists_refresh_token_and_upserts_connection()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantItsmConnectorConnectionRepository repository = new();
        Mock<IItsmConnectorOAuthTokenExchanger> tokenExchangerMock = new();
        Mock<IIntegrationSecretWriter> secretWriterMock = new();

        tokenExchangerMock
            .Setup(exchanger => exchanger.TryExchangeAuthorizationCodeAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ItsmConnectorOAuthTokenExchangeResult
            {
                AccessToken = "access",
                RefreshToken = "refresh-token-value",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(1)
            });

        secretWriterMock
            .Setup(writer => writer.TryUpsertSecretAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        ItsmAtlassianOAuthConsentService sut = CreateSut(
            tokenExchangerMock.Object,
            secretWriterMock.Object,
            repository);

        ItsmAtlassianOAuthConsentStartRequest startRequest = new()
        {
            InstanceBaseUrl = "https://tenant.atlassian.net",
            RedirectUri = "https://app.example.com/integrations/itsm/oauth/callback",
            OAuthClientIdKeyVaultSecretName = "kv-jira-client-id",
            OAuthClientSecretKeyVaultSecretName = "kv-jira-client-secret",
            OAuthRefreshTokenKeyVaultSecretName = "kv-jira-refresh"
        };

        (ItsmAtlassianOAuthConsentStartResponse? started, _) =
            await sut.TryStartAsync(tenantId, startRequest, CancellationToken.None);

        (ItsmAtlassianOAuthConsentCompleteResponse? completed, string? completeError) =
            await sut.TryCompleteAsync(
                tenantId,
                new ItsmAtlassianOAuthConsentCompleteRequest
                {
                    Code = "auth-code",
                    State = started!.State
                },
                CancellationToken.None);

        completeError.Should().BeNull();
        completed.Should().NotBeNull();
        completed!.RefreshTokenStored.Should().BeTrue();
        completed.Connection.Should().NotBeNull();
        completed.Connection!.AuthMode.Should().Be("OAuth2RefreshToken");

        secretWriterMock.Verify(
            writer => writer.TryUpsertSecretAsync(
                "kv-jira-refresh",
                "refresh-token-value",
                It.IsAny<CancellationToken>()),
            Times.Once);

        TenantItsmConnectorConnectionRecord? row =
            await repository.GetAsync(tenantId, TenantItsmConnectorProvider.Jira, CancellationToken.None);

        row.Should().NotBeNull();
        row!.OAuthRefreshTokenKeyVaultSecretName.Should().Be("kv-jira-refresh");
    }

    private static ItsmAtlassianOAuthConsentService CreateSut(
        IItsmConnectorOAuthTokenExchanger tokenExchanger,
        IIntegrationSecretWriter secretWriter,
        ITenantItsmConnectorConnectionRepository connectionRepository)
    {
        IOptions<IntegrationsAtlassianOAuthOptions> options = Options.Create(new IntegrationsAtlassianOAuthOptions
        {
            OAuthClientId = "archlucid-atlassian-client",
            OAuthClientSecret = "archlucid-atlassian-secret",
            Scopes = "read:jira-work write:jira-work offline_access"
        });

        ISecretProvider secretProvider = new Mock<ISecretProvider>().Object;

        return new ItsmAtlassianOAuthConsentService(
            options,
            secretProvider,
            secretWriter,
            tokenExchanger,
            connectionRepository,
            new MemoryCache(new MemoryCacheOptions()),
            NullLogger<ItsmAtlassianOAuthConsentService>.Instance);
    }
}
