using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
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
            "https://tenant.atlassian.net",
            "tenant-bot@example.com",
            "kv-jira-token",
            inboundWebhookKeyVaultSecretName: null,
            isEnabled: true,
            label: null,
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
