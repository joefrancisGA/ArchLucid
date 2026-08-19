using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Integrations;

/// <inheritdoc cref="ITenantItsmConnectorConnectionRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via ArchLucid.sql / DbUp and integration tests.")]
public sealed class SqlTenantItsmConnectorConnectionRepository(ISqlConnectionFactory connectionFactory)
    : ITenantItsmConnectorConnectionRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

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
                new { TenantId = tenantId, Provider = TenantItsmConnectorConnectionUpsertValidation.ToProviderPersistenceLabel(provider) },
                cancellationToken: cancellationToken));

        return row is null ? null : ToRecord(row);
    }

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
                    Provider = TenantItsmConnectorConnectionUpsertValidation.ToProviderPersistenceLabel(provider),
                    command.InstanceBaseUrl,
                    AuthMode = TenantItsmConnectorConnectionUpsertValidation.ToAuthModeLabel(command.AuthMode),
                    command.AuthUserName,
                    command.CredentialKeyVaultSecretName,
                    command.OAuthClientIdKeyVaultSecretName,
                    command.OAuthClientSecretKeyVaultSecretName,
                    command.OAuthRefreshTokenKeyVaultSecretName,
                    command.InboundWebhookKeyVaultSecretName,
                    command.IsEnabled,
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
                new { TenantId = tenantId, Provider = TenantItsmConnectorConnectionUpsertValidation.ToProviderPersistenceLabel(provider) },
                cancellationToken: cancellationToken));

        return affected > 0;
    }

    private static TenantItsmConnectorConnectionRecord ToRecord(Row row)
    {
        if (!TenantItsmConnectorConnectionUpsertValidation.TryParseProvider(row.Provider, out TenantItsmConnectorProvider provider, out _))
            throw new InvalidOperationException($"Unknown ITSM provider label '{row.Provider}' in SQL row.");

        if (!TenantItsmConnectorConnectionUpsertValidation.TryParseAuthModeLabel(row.AuthMode, out ItsmConnectorAuthMode authMode))
            throw new InvalidOperationException($"Unknown ITSM auth mode label '{row.AuthMode}' in SQL row.");

        return new TenantItsmConnectorConnectionRecord
        {
            TenantId = row.TenantId,
            Provider = provider,
            InstanceBaseUrl = row.InstanceBaseUrl,
            AuthMode = authMode,
            AuthUserName = row.AuthUserName,
            CredentialKeyVaultSecretName = row.CredentialKeyVaultSecretName,
            OAuthClientIdKeyVaultSecretName = row.OAuthClientIdKeyVaultSecretName,
            OAuthClientSecretKeyVaultSecretName = row.OAuthClientSecretKeyVaultSecretName,
            OAuthRefreshTokenKeyVaultSecretName = row.OAuthRefreshTokenKeyVaultSecretName,
            InboundWebhookKeyVaultSecretName = row.InboundWebhookKeyVaultSecretName,
            IsEnabled = row.IsEnabled,
            Label = row.Label,
            UpdatedUtc = new DateTimeOffset(row.UpdatedUtc, TimeSpan.Zero)
        };
    }

    private sealed class Row
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public string Provider
        {
            get;
            init;
        } = "";

        public string InstanceBaseUrl
        {
            get;
            init;
        } = "";

        public string AuthMode
        {
            get;
            init;
        } = TenantItsmConnectorConnectionUpsertValidation.ToAuthModeLabel(ItsmConnectorAuthMode.BasicApiToken);

        public string AuthUserName
        {
            get;
            init;
        } = "";

        public string CredentialKeyVaultSecretName
        {
            get;
            init;
        } = "";

        public string? OAuthClientIdKeyVaultSecretName
        {
            get;
            init;
        }

        public string? OAuthClientSecretKeyVaultSecretName
        {
            get;
            init;
        }

        public string? OAuthRefreshTokenKeyVaultSecretName
        {
            get;
            init;
        }

        public string? InboundWebhookKeyVaultSecretName
        {
            get;
            init;
        }

        public bool IsEnabled
        {
            get;
            init;
        }

        public string? Label
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }
}
