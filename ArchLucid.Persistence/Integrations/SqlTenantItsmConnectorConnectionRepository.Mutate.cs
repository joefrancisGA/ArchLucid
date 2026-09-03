using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Integrations;

public sealed partial class SqlTenantItsmConnectorConnectionRepository
{
    public async Task<TenantItsmConnectorConnectionRecord?> UpsertAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        TenantItsmConnectorConnectionUpsertCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        const string tenantExistsSql = """
                                       SELECT COUNT(1)
                                       FROM dbo.Tenants
                                       WHERE Id = @TenantId;
                                       """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int tenantCount = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                tenantExistsSql,
                new { TenantId = tenantId },
                cancellationToken: cancellationToken));

        if (tenantCount == 0)
            return null;

        bool isEnabled = TenantItsmConnectorConnectionRepositoryCore.ResolveIsEnabled(command);
        ItsmConnectorAuthMode authMode =
            TenantItsmConnectorConnectionRepositoryCore.NormalizeAuthModeForProvider(provider, command.AuthMode);

        const string mergeSql = """
                                MERGE dbo.TenantItsmConnectorConnections AS t
                                USING (
                                    SELECT
                                        @TenantId AS TenantId,
                                        @Provider AS Provider,
                                        @InstanceBaseUrl AS InstanceBaseUrl,
                                        @AuthMode AS AuthMode,
                                        @AuthUserName AS AuthUserName,
                                        @CredentialKeyVaultSecretName AS CredentialKeyVaultSecretName,
                                        @OAuthClientIdKeyVaultSecretName AS OAuthClientIdKeyVaultSecretName,
                                        @OAuthClientSecretKeyVaultSecretName AS OAuthClientSecretKeyVaultSecretName,
                                        @OAuthRefreshTokenKeyVaultSecretName AS OAuthRefreshTokenKeyVaultSecretName,
                                        @InboundWebhookKeyVaultSecretName AS InboundWebhookKeyVaultSecretName,
                                        @IsEnabled AS IsEnabled,
                                        @Label AS Label
                                ) AS s
                                ON t.TenantId = s.TenantId AND t.Provider = s.Provider
                                WHEN MATCHED THEN UPDATE SET
                                    InstanceBaseUrl = s.InstanceBaseUrl,
                                    AuthMode = s.AuthMode,
                                    AuthUserName = s.AuthUserName,
                                    CredentialKeyVaultSecretName = s.CredentialKeyVaultSecretName,
                                    OAuthClientIdKeyVaultSecretName = s.OAuthClientIdKeyVaultSecretName,
                                    OAuthClientSecretKeyVaultSecretName = s.OAuthClientSecretKeyVaultSecretName,
                                    OAuthRefreshTokenKeyVaultSecretName = s.OAuthRefreshTokenKeyVaultSecretName,
                                    InboundWebhookKeyVaultSecretName = s.InboundWebhookKeyVaultSecretName,
                                    IsEnabled = s.IsEnabled,
                                    Label = s.Label,
                                    UpdatedUtc = SYSUTCDATETIME()
                                WHEN NOT MATCHED THEN INSERT (
                                    TenantId,
                                    Provider,
                                    InstanceBaseUrl,
                                    AuthMode,
                                    AuthUserName,
                                    CredentialKeyVaultSecretName,
                                    OAuthClientIdKeyVaultSecretName,
                                    OAuthClientSecretKeyVaultSecretName,
                                    OAuthRefreshTokenKeyVaultSecretName,
                                    InboundWebhookKeyVaultSecretName,
                                    IsEnabled,
                                    Label,
                                    UpdatedUtc)
                                VALUES (
                                    s.TenantId,
                                    s.Provider,
                                    s.InstanceBaseUrl,
                                    s.AuthMode,
                                    s.AuthUserName,
                                    s.CredentialKeyVaultSecretName,
                                    s.OAuthClientIdKeyVaultSecretName,
                                    s.OAuthClientSecretKeyVaultSecretName,
                                    s.OAuthRefreshTokenKeyVaultSecretName,
                                    s.InboundWebhookKeyVaultSecretName,
                                    s.IsEnabled,
                                    s.Label,
                                    SYSUTCDATETIME());
                                """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                mergeSql,
                new
                {
                    TenantId = tenantId,
                    Provider = TenantItsmConnectorConnectionRepositoryCore.ToPersistenceProviderLabel(provider),
                    command.InstanceBaseUrl,
                    AuthMode = TenantItsmConnectorConnectionRepositoryCore.ToPersistenceAuthModeLabel(authMode),
                    command.AuthUserName,
                    command.CredentialKeyVaultSecretName,
                    command.OAuthClientIdKeyVaultSecretName,
                    command.OAuthClientSecretKeyVaultSecretName,
                    command.OAuthRefreshTokenKeyVaultSecretName,
                    command.InboundWebhookKeyVaultSecretName,
                    IsEnabled = isEnabled,
                    command.Label
                },
                cancellationToken: cancellationToken));

        return await GetAsync(tenantId, provider, cancellationToken);
    }

    public async Task<bool> DeleteAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           DELETE FROM dbo.TenantItsmConnectorConnections
                           WHERE TenantId = @TenantId
                             AND Provider = @Provider;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    Provider = TenantItsmConnectorConnectionRepositoryCore.ToPersistenceProviderLabel(provider)
                },
                cancellationToken: cancellationToken));

        return affected > 0;
    }
}
