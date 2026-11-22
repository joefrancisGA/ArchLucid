using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Integrations;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantItsmConnectorConnectionRepositoryCoreTests
{
    [Fact]
    public void ResolveIsEnabled_requires_credentials_for_basic_auth()
    {
        TenantItsmConnectorConnectionUpsertCommand command = new()
        {
            InstanceBaseUrl = "https://example.service-now.com",
            AuthMode = ItsmConnectorAuthMode.BasicApiToken,
            CredentialKeyVaultSecretName = "secret",
            IsEnabled = true,
        };

        TenantItsmConnectorConnectionRepositoryCore.ResolveIsEnabled(command, command.AuthMode).Should().BeTrue();

        TenantItsmConnectorConnectionUpsertCommand missingSecret = new()
        {
            InstanceBaseUrl = "https://example.service-now.com",
            AuthMode = ItsmConnectorAuthMode.BasicApiToken,
            CredentialKeyVaultSecretName = "",
            IsEnabled = true,
        };

        TenantItsmConnectorConnectionRepositoryCore.ResolveIsEnabled(missingSecret, missingSecret.AuthMode).Should().BeFalse();
    }

    [Fact]
    public void NormalizeAuthModeForProvider_forces_basic_for_azure_boards()
    {
        TenantItsmConnectorConnectionRepositoryCore
            .NormalizeAuthModeForProvider(
                TenantItsmConnectorProvider.AzureBoards,
                ItsmConnectorAuthMode.OAuth2ClientCredentials)
            .Should()
            .Be(ItsmConnectorAuthMode.BasicApiToken);
    }

    [Fact]
    public void CreateFromUpsert_applies_enabled_resolution()
    {
        Guid tenantId = Guid.NewGuid();
        TenantItsmConnectorConnectionUpsertCommand command = new()
        {
            InstanceBaseUrl = "https://example.atlassian.net",
            AuthMode = ItsmConnectorAuthMode.BasicApiToken,
            CredentialKeyVaultSecretName = "secret",
            IsEnabled = true,
        };

        TenantItsmConnectorConnectionRecord record = TenantItsmConnectorConnectionRepositoryCore.CreateFromUpsert(
            tenantId,
            TenantItsmConnectorProvider.Jira,
            command,
            DateTimeOffset.UtcNow);

        record.TenantId.Should().Be(tenantId);
        record.IsEnabled.Should().BeTrue();
        record.Provider.Should().Be(TenantItsmConnectorProvider.Jira);
    }

    [Fact]
    public void CreateFromUpsert_resolves_enabled_against_azure_boards_normalized_auth_mode()
    {
        TenantItsmConnectorConnectionUpsertCommand command = new()
        {
            InstanceBaseUrl = "https://dev.azure.com/example",
            AuthMode = ItsmConnectorAuthMode.OAuth2ClientCredentials,
            CredentialKeyVaultSecretName = "personal-access-token",
            IsEnabled = true,
        };

        TenantItsmConnectorConnectionRecord record = TenantItsmConnectorConnectionRepositoryCore.CreateFromUpsert(
            Guid.NewGuid(),
            TenantItsmConnectorProvider.AzureBoards,
            command,
            DateTimeOffset.UtcNow);

        record.AuthMode.Should().Be(ItsmConnectorAuthMode.BasicApiToken);
        record.IsEnabled.Should().BeTrue();
    }
}
