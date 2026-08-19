using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Secrets;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Category", "Unit")]
public sealed class ItsmTenantConnectorCredentialResolverTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task TryResolveOutboundAsync_prefers_tenant_row_over_deployment_fallback()
    {
        InMemoryTenantItsmConnectorConnectionRepository repository = new();
        await repository.UpsertAsync(
            TenantId,
            TenantItsmConnectorProvider.Jira,
            new TenantItsmConnectorConnectionUpsertCommand
            {
                InstanceBaseUrl = "https://tenant.atlassian.net",
                AuthUserName = "tenant-bot@example.com",
                CredentialKeyVaultSecretName = "kv-jira-token"
            },
            CancellationToken.None);

        DictionarySecretProvider secrets = new();
        secrets.Set("kv-jira-token", "tenant-token");

        IntegrationsItsmOutboundOptions deployment = new()
        {
            Jira = new JiraItsmOutboundOptions
            {
                CloudBaseUrl = "https://shared.atlassian.net",
                ServiceAccountEmail = "shared@example.com",
                ApiToken = "shared-token",
                DefaultProjectKey = "DP"
            }
        };

        ItsmTenantConnectorCredentialResolver sut = CreateSut(repository, secrets, deployment);

        ResolvedItsmOutboundCredentials? resolved = await sut.TryResolveOutboundAsync(
            TenantId,
            TenantItsmConnectorProvider.Jira,
            CancellationToken.None);

        resolved.Should().NotBeNull();
        resolved!.InstanceBaseUrl.Should().Be("https://tenant.atlassian.net");
        resolved.AuthUserName.Should().Be("tenant-bot@example.com");
        resolved.SecretValue.Should().Be("tenant-token");
        resolved.FromTenantConnection.Should().BeTrue();
    }

    [Fact]
    public async Task TryResolveOutboundAsync_resolves_oauth_client_credentials_from_tenant_row()
    {
        InMemoryTenantItsmConnectorConnectionRepository repository = new();
        await repository.UpsertAsync(
            TenantId,
            TenantItsmConnectorProvider.ServiceNow,
            new TenantItsmConnectorConnectionUpsertCommand
            {
                InstanceBaseUrl = "https://tenant.service-now.com",
                AuthMode = ItsmConnectorAuthMode.OAuth2ClientCredentials,
                OAuthClientIdKeyVaultSecretName = "kv-sn-client-id",
                OAuthClientSecretKeyVaultSecretName = "kv-sn-client-secret"
            },
            CancellationToken.None);

        DictionarySecretProvider secrets = new();
        secrets.Set("kv-sn-client-id", "snow-client-id");
        secrets.Set("kv-sn-client-secret", "snow-client-secret");

        ItsmTenantConnectorCredentialResolver sut = CreateSut(
            repository,
            secrets,
            new IntegrationsItsmOutboundOptions { RequireTenantScopedCredentials = true });

        ResolvedItsmOutboundCredentials? resolved = await sut.TryResolveOutboundAsync(
            TenantId,
            TenantItsmConnectorProvider.ServiceNow,
            CancellationToken.None);

        resolved.Should().NotBeNull();
        resolved!.AuthMode.Should().Be(ItsmConnectorAuthMode.OAuth2ClientCredentials);
        resolved.OAuthClientId.Should().Be("snow-client-id");
        resolved.OAuthClientSecret.Should().Be("snow-client-secret");
    }

    [Fact]
    public async Task TryResolveOutboundAsync_when_require_tenant_scoped_skips_deployment_fallback()
    {
        IntegrationsItsmOutboundOptions deployment = new()
        {
            RequireTenantScopedCredentials = true,
            Jira = new JiraItsmOutboundOptions
            {
                CloudBaseUrl = "https://shared.atlassian.net",
                ServiceAccountEmail = "shared@example.com",
                ApiToken = "shared-token"
            }
        };

        ItsmTenantConnectorCredentialResolver sut = CreateSut(
            new InMemoryTenantItsmConnectorConnectionRepository(),
            new DictionarySecretProvider(),
            deployment);

        ResolvedItsmOutboundCredentials? resolved = await sut.TryResolveOutboundAsync(
            TenantId,
            TenantItsmConnectorProvider.Jira,
            CancellationToken.None);

        resolved.Should().BeNull();
    }

    [Fact]
    public async Task TryResolveOutboundAsync_resolves_deployment_oauth_jira_when_tenant_row_missing()
    {
        IntegrationsItsmOutboundOptions deployment = new()
        {
            Jira = new JiraItsmOutboundOptions
            {
                CloudBaseUrl = "https://shared.atlassian.net",
                AuthMode = ItsmConnectorAuthMode.OAuth2RefreshToken,
                OAuthClientId = "client-id",
                OAuthClientSecret = "client-secret",
                OAuthRefreshToken = "refresh-token"
            }
        };

        ItsmTenantConnectorCredentialResolver sut = CreateSut(
            new InMemoryTenantItsmConnectorConnectionRepository(),
            new DictionarySecretProvider(),
            deployment);

        ResolvedItsmOutboundCredentials? resolved = await sut.TryResolveOutboundAsync(
            TenantId,
            TenantItsmConnectorProvider.Jira,
            CancellationToken.None);

        resolved.Should().NotBeNull();
        resolved!.AuthMode.Should().Be(ItsmConnectorAuthMode.OAuth2RefreshToken);
        resolved.OAuthClientId.Should().Be("client-id");
        resolved.OAuthRefreshToken.Should().Be("refresh-token");
        resolved.FromTenantConnection.Should().BeFalse();
    }

    private static ItsmTenantConnectorCredentialResolver CreateSut(
        InMemoryTenantItsmConnectorConnectionRepository repository,
        ISecretProvider secretProvider,
        IntegrationsItsmOutboundOptions outbound)
    {
        Mock<IOptionsMonitor<IntegrationsItsmOutboundOptions>> outboundMonitor = new();
        outboundMonitor.Setup(m => m.CurrentValue).Returns(outbound);

        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> inboundMonitor = new();
        inboundMonitor.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions());

        return new ItsmTenantConnectorCredentialResolver(
            repository,
            secretProvider,
            outboundMonitor.Object,
            inboundMonitor.Object);
    }

    private sealed class DictionarySecretProvider : ISecretProvider
    {
        private readonly Dictionary<string, string> _secrets = new(StringComparer.Ordinal);

        public void Set(string name, string value) => _secrets[name] = value;

        public Task<string?> GetSecretAsync(string secretName, CancellationToken ct) =>
            Task.FromResult(_secrets.TryGetValue(secretName, out string? value) ? value : null);
    }
}
