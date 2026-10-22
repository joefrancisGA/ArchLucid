using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integrations.Itsm;

[Trait("Category", "Unit")]
public sealed class TenantItsmConnectorConnectionUpsertValidationTests
{
    [Fact]
    public void TryValidateCredentialKeyVaultSecretName_rejects_raw_token_url()
    {
        bool ok = TenantItsmConnectorConnectionUpsertValidation.TryValidateCredentialKeyVaultSecretName(
            "https://example.invalid/token",
            out _,
            out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("raw API tokens");
    }

    [Fact]
    public void TryParseProvider_accepts_jira_and_servicenow()
    {
        TenantItsmConnectorConnectionUpsertValidation.TryParseProvider("jira", out TenantItsmConnectorProvider jira, out _)
            .Should().BeTrue();
        jira.Should().Be(TenantItsmConnectorProvider.Jira);

        TenantItsmConnectorConnectionUpsertValidation.TryParseProvider("ServiceNow", out TenantItsmConnectorProvider snow, out _)
            .Should().BeTrue();
        snow.Should().Be(TenantItsmConnectorProvider.ServiceNow);

        TenantItsmConnectorConnectionUpsertValidation.TryParseProvider("AzureBoards", out TenantItsmConnectorProvider azureBoards, out _)
            .Should().BeTrue();
        azureBoards.Should().Be(TenantItsmConnectorProvider.AzureBoards);
    }

    [Fact]
    public void TryBuildUpsertCommandForProvider_AzureBoards_allows_pat_only_without_auth_user_name()
    {
        bool ok = TenantItsmConnectorConnectionUpsertValidation.TryBuildUpsertCommandForProvider(
            TenantItsmConnectorProvider.AzureBoards,
            "https://dev.azure.com/contoso",
            "BasicApiToken",
            authUserName: null,
            credentialKeyVaultSecretName: "kv-azure-boards-pat",
            oauthClientIdKeyVaultSecretName: null,
            oauthClientSecretKeyVaultSecretName: null,
            oauthRefreshTokenKeyVaultSecretName: null,
            inboundWebhookKeyVaultSecretName: null,
            isEnabled: true,
            label: null,
            out TenantItsmConnectorConnectionUpsertCommand? command,
            out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        command.Should().NotBeNull();
        command!.AuthUserName.Should().BeEmpty();
        command.CredentialKeyVaultSecretName.Should().Be("kv-azure-boards-pat");
        command.AuthMode.Should().Be(ItsmConnectorAuthMode.BasicApiToken);
    }
}
