using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.AiProviders;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification =
    "SQL-dependent repository; exercised via ArchLucid.sql / DbUp and integration tests.")]
public sealed class DapperTenantAzureOpenAiConnectionRepository(ISqlConnectionFactory connectionFactory)
    : ITenantAzureOpenAiConnectionRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<TenantAzureOpenAiConnectionRecord?> GetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT
                               TenantId,
                               Endpoint,
                               AuthMode,
                               ApiKeyKeyVaultSecretName,
                               DeploymentsJson,
                               IsEnabled,
                               Label,
                               LastProbeSucceeded,
                               LastProbeMessage,
                               LastProbeUtc,
                               UpdatedUtc
                           FROM dbo.TenantAzureOpenAiConnections
                           WHERE TenantId = @TenantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        Row? row = await connection.QueryFirstOrDefaultAsync<Row>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return row is null ? null : ToRecord(row);
    }

    public async Task<TenantAzureOpenAiConnectionRecord?> UpsertAsync(
        Guid tenantId,
        TenantAzureOpenAiConnectionUpsertCommand command,
        CancellationToken cancellationToken)
    {
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
        {
            return null;
        }

        const string mergeSql = """
                                MERGE dbo.TenantAzureOpenAiConnections AS t
                                USING (
                                    SELECT
                                        @TenantId AS TenantId,
                                        @Endpoint AS Endpoint,
                                        @AuthMode AS AuthMode,
                                        @ApiKeyKeyVaultSecretName AS ApiKeyKeyVaultSecretName,
                                        @DeploymentsJson AS DeploymentsJson,
                                        @IsEnabled AS IsEnabled,
                                        @Label AS Label
                                ) AS s
                                ON t.TenantId = s.TenantId
                                WHEN MATCHED THEN UPDATE SET
                                    Endpoint = s.Endpoint,
                                    AuthMode = s.AuthMode,
                                    ApiKeyKeyVaultSecretName = s.ApiKeyKeyVaultSecretName,
                                    DeploymentsJson = s.DeploymentsJson,
                                    IsEnabled = s.IsEnabled,
                                    Label = s.Label,
                                    UpdatedUtc = SYSUTCDATETIME()
                                WHEN NOT MATCHED THEN INSERT (
                                    TenantId,
                                    Endpoint,
                                    AuthMode,
                                    ApiKeyKeyVaultSecretName,
                                    DeploymentsJson,
                                    IsEnabled,
                                    Label,
                                    UpdatedUtc)
                                VALUES (
                                    s.TenantId,
                                    s.Endpoint,
                                    s.AuthMode,
                                    s.ApiKeyKeyVaultSecretName,
                                    s.DeploymentsJson,
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
                    command.Endpoint,
                    AuthMode = command.AuthMode.ToString(),
                    command.ApiKeyKeyVaultSecretName,
                    command.DeploymentsJson,
                    command.IsEnabled,
                    command.Label,
                },
                cancellationToken: cancellationToken));

        return await GetAsync(tenantId, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        const string sql = """
                           DELETE FROM dbo.TenantAzureOpenAiConnections
                           WHERE TenantId = @TenantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int affected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return affected > 0;
    }

    public async Task<bool> UpdateProbeResultAsync(
        Guid tenantId,
        bool succeeded,
        string? message,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.TenantAzureOpenAiConnections
                           SET LastProbeSucceeded = @Succeeded,
                               LastProbeMessage = @Message,
                               LastProbeUtc = SYSUTCDATETIME(),
                               UpdatedUtc = SYSUTCDATETIME()
                           WHERE TenantId = @TenantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, Succeeded = succeeded, Message = message },
                cancellationToken: cancellationToken));

        return affected > 0;
    }

    private static TenantAzureOpenAiConnectionRecord ToRecord(Row row) =>
        new()
        {
            TenantId = row.TenantId,
            Endpoint = row.Endpoint,
            AuthMode = Enum.Parse<TenantAzureOpenAiAuthMode>(row.AuthMode, ignoreCase: true),
            ApiKeyKeyVaultSecretName = row.ApiKeyKeyVaultSecretName,
            DeploymentsJson = row.DeploymentsJson,
            IsEnabled = row.IsEnabled,
            Label = row.Label,
            LastProbeSucceeded = row.LastProbeSucceeded,
            LastProbeMessage = row.LastProbeMessage,
            LastProbeUtc = row.LastProbeUtc is null
                ? null
                : new DateTimeOffset(row.LastProbeUtc.Value, TimeSpan.Zero),
            UpdatedUtc = new DateTimeOffset(row.UpdatedUtc, TimeSpan.Zero),
        };

    private sealed class Row
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public string Endpoint
        {
            get;
            init;
        } = "";

        public string AuthMode
        {
            get;
            init;
        } = "";

        public string ApiKeyKeyVaultSecretName
        {
            get;
            init;
        } = "";

        public string DeploymentsJson
        {
            get;
            init;
        } = "";

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

        public bool? LastProbeSucceeded
        {
            get;
            init;
        }

        public string? LastProbeMessage
        {
            get;
            init;
        }

        public DateTime? LastProbeUtc
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
