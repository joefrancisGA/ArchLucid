using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Integrations;

public sealed partial class SqlTenantItsmConnectorConnectionRepository
{
    public async Task<IReadOnlyList<TenantItsmConnectorConnectionRecord>> ListAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT
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
                               UpdatedUtc
                           FROM dbo.TenantItsmConnectorConnections
                           WHERE TenantId = @TenantId
                           ORDER BY Provider;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<Row> rows = await connection.QueryAsync<Row>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.Select(ToRecord).ToList();
    }

    public async Task<TenantItsmConnectorConnectionRecord?> GetAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT
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
                               UpdatedUtc
                           FROM dbo.TenantItsmConnectorConnections
                           WHERE TenantId = @TenantId
                             AND Provider = @Provider;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await connection.QueryFirstOrDefaultAsync<Row>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    Provider = TenantItsmConnectorConnectionRepositoryCore.ToPersistenceProviderLabel(provider)
                },
                cancellationToken: cancellationToken));

        return row is null ? null : ToRecord(row);
    }
}
