using ArchLucid.Core.Tenancy;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

public sealed class DapperTenantDatabaseBindingRepository(ISystemSqlConnectionFactory systemSqlConnectionFactory)
    : ITenantDatabaseBindingRepository
{
    private readonly ISystemSqlConnectionFactory _systemSqlConnectionFactory =
        systemSqlConnectionFactory ?? throw new ArgumentNullException(nameof(systemSqlConnectionFactory));

    public async Task<TenantDatabaseBindingRecord?> GetByTenantIdAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection =
            await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        if (!await TenantDatabaseBindingsTableExistsAsync(connection, cancellationToken))
            return null;

        const string sql = """
                           SELECT TenantId,
                                  SqlLogicalDatabaseName,
                                  ProvisioningState,
                                  LastError
                           FROM dbo.TenantDatabaseBindings
                           WHERE TenantId = @TenantId;
                           """;

        BindingRow? row = await connection.QuerySingleOrDefaultAsync<BindingRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return row is null ? null : row.ToRecord();
    }

    public async Task<IReadOnlyList<TenantDatabaseBindingRecord>> ListBindingsWithStateAsync(
        TenantDatabaseProvisioningState state,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection =
            await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        if (!await TenantDatabaseBindingsTableExistsAsync(connection, cancellationToken))
            return [];

        const string sql = """
                           SELECT TenantId,
                                  SqlLogicalDatabaseName,
                                  ProvisioningState,
                                  LastError
                           FROM dbo.TenantDatabaseBindings
                           WHERE ProvisioningState = @State
                           ORDER BY CreatedUtc ASC;
                           """;

        IEnumerable<BindingRow> rows = await connection.QueryAsync<BindingRow>(
            new CommandDefinition(
                sql,
                new { State = (byte)state },
                cancellationToken: cancellationToken));

        return rows.Select(static r => r.ToRecord()).ToList();
    }

    public async Task UpsertPendingAsync(
        Guid tenantId,
        string sqlLogicalDatabaseName,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sqlLogicalDatabaseName);

        await using SqlConnection connection =
            await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           MERGE dbo.TenantDatabaseBindings AS target
                           USING (SELECT @TenantId AS TenantId) AS src
                           ON target.TenantId = src.TenantId
                           WHEN MATCHED THEN
                               UPDATE SET SqlLogicalDatabaseName = @DbName,
                                          ProvisioningState = @Pending,
                                          LastError = NULL,
                                          UpdatedUtc = SYSUTCDATETIME()
                           WHEN NOT MATCHED THEN
                               INSERT (TenantId, SqlLogicalDatabaseName, ProvisioningState, LastError, CreatedUtc, UpdatedUtc)
                               VALUES (@TenantId, @DbName, @Pending, NULL, SYSUTCDATETIME(), SYSUTCDATETIME());
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    DbName = sqlLogicalDatabaseName.Trim(),
                    Pending = (byte)TenantDatabaseProvisioningState.Pending,
                },
                cancellationToken: cancellationToken));
    }

    public async Task MarkActiveAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        await using SqlConnection connection =
            await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           UPDATE dbo.TenantDatabaseBindings
                           SET ProvisioningState = @Active,
                               LastError = NULL,
                               UpdatedUtc = SYSUTCDATETIME()
                           WHERE TenantId = @TenantId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, Active = (byte)TenantDatabaseProvisioningState.Active, },
                cancellationToken: cancellationToken));
    }

    public async Task MarkFailedAsync(
        Guid tenantId,
        string errorMessage,
        CancellationToken cancellationToken)
    {
        string trimmed = errorMessage.Trim();
        if (trimmed.Length > 4000)
            trimmed = trimmed[..4000];

        await using SqlConnection connection =
            await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           UPDATE dbo.TenantDatabaseBindings
                           SET ProvisioningState = @Failed,
                               LastError = @Err,
                               UpdatedUtc = SYSUTCDATETIME()
                           WHERE TenantId = @TenantId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    Failed = (byte)TenantDatabaseProvisioningState.Failed,
                    Err = trimmed,
                },
                cancellationToken: cancellationToken));
    }

    private static async Task<bool> TenantDatabaseBindingsTableExistsAsync(
        SqlConnection connection,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT CASE WHEN OBJECT_ID(N'dbo.TenantDatabaseBindings', N'U') IS NULL THEN 0 ELSE 1 END;
                           """;

        int flag = await connection.QuerySingleAsync<int>(new CommandDefinition(sql, cancellationToken: cancellationToken));

        return flag != 0;
    }

    private sealed class BindingRow
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public string SqlLogicalDatabaseName
        {
            get;
            init;
        } = string.Empty;

        public byte ProvisioningState
        {
            get;
            init;
        }

        public string? LastError
        {
            get;
            init;
        }

        internal TenantDatabaseBindingRecord ToRecord()
        {
            return new TenantDatabaseBindingRecord
            {
                TenantId = TenantId,
                SqlLogicalDatabaseName = SqlLogicalDatabaseName,
                ProvisioningState = (TenantDatabaseProvisioningState)ProvisioningState,
                LastError = LastError,
            };
        }
    }
}
