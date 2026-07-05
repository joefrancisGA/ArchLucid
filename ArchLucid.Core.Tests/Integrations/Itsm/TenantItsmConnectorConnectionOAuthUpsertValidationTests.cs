using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integrations.Itsm;

[Trait("Category", "Unit")]
public sealed class TenantItsmConnectorConnectionOAuthUpsertValidationTests
{
    [Fact]
    public void TryBuildUpsertCommand_OAuth2ClientCredentials_requires_oauth_secret_names()
    {
        bool ok = TenantItsmConnectorConnectionUpsertValidation.TryBuildUpsertCommand(
            "https://tenant.service-now.com",
            "OAuth2ClientCredentials",
            authUserName: null,
            credentialKeyVaultSecretName: null,
            oauthClientIdKeyVaultSecretName: "kv-sn-client-id",
            oauthClientSecretKeyVaultSecretName: "kv-sn-client-secret",
            oauthRefreshTokenKeyVaultSecretName: null,
            inboundWebhookKeyVaultSecretName: null,
            isEnabled: true,
            label: null,
            out TenantItsmConnectorConnectionUpsertCommand? command,
            out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        command.Should().NotBeNull();
        command!.AuthMode.Should().Be(ItsmConnectorAuthMode.OAuth2ClientCredentials);
        command.OAuthClientIdKeyVaultSecretName.Should().Be("kv-sn-client-id");
    }

    [Fact]
    public void TryBuildUpsertCommand_OAuth2RefreshToken_requires_refresh_token_secret_name()
    {
        bool ok = TenantItsmConnectorConnectionUpsertValidation.TryBuildUpsertCommand(
            "https://tenant.atlassian.net",
            "OAuth2RefreshToken",
            authUserName: null,
            credentialKeyVaultSecretName: null,
            oauthClientIdKeyVaultSecretName: "kv-jira-client-id",
            oauthClientSecretKeyVaultSecretName: "kv-jira-client-secret",
            oauthRefreshTokenKeyVaultSecretName: "kv-jira-refresh",
            inboundWebhookKeyVaultSecretName: null,
            isEnabled: true,
            label: null,
            out TenantItsmConnectorConnectionUpsertCommand? command,
            out string? error);

        ok.Should().BeTrue();
        command!.AuthMode.Should().Be(ItsmConnectorAuthMode.OAuth2RefreshToken);
        command.OAuthRefreshTokenKeyVaultSecretName.Should().Be("kv-jira-refresh");
    }
}
