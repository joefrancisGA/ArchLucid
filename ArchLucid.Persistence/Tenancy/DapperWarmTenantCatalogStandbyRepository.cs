using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

public sealed class DapperWarmTenantCatalogStandbyRepository(ISystemSqlConnectionFactory systemSqlConnectionFactory)
    : IWarmTenantCatalogStandbyRepository
{
    private readonly ISystemSqlConnectionFactory _systemSqlConnectionFactory =
        systemSqlConnectionFactory ?? throw new ArgumentNullException(nameof(systemSqlConnectionFactory));

    public async Task<int> CountUnclaimedAsync(CancellationToken cancellationToken)
    {
        await using SqlConnection connection =
            await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        if (!await TableExistsAsync(connection, cancellationToken))
            return 0;

        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.WarmTenantCatalogStandby
                           WHERE ClaimedUtc IS NULL;
                           """;

        return await connection.QuerySingleAsync<int>(new CommandDefinition(sql, cancellationToken: cancellationToken));
    }

    public async Task<WarmTenantCatalogStandbyRecord?> TryClaimOldestUnclaimedAsync(CancellationToken cancellationToken)
    {
        await using SqlConnection connection =
            await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        if (!await TableExistsAsync(connection, cancellationToken))
            return null;

        const string sql = """
                           SELECT TOP (1)
                               StandbyId,
                               SqlLogicalDatabaseName,
                               SchemaReadyUtc,
                               CreatedUtc,
                               ClaimedUtc
                           FROM dbo.WarmTenantCatalogStandby WITH (UPDLOCK, ROWLOCK, READPAST)
                           WHERE ClaimedUtc IS NULL
                           ORDER BY CreatedUtc ASC;
                           """;

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    public async Task InsertStandbyAsync(WarmTenantCatalogStandbyRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.SqlLogicalDatabaseName);

        await using SqlConnection connection =
            await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           INSERT INTO dbo.WarmTenantCatalogStandby
                               (StandbyId, SqlLogicalDatabaseName, SchemaReadyUtc, CreatedUtc, ClaimedUtc)
                           VALUES
                               (@StandbyId, @SqlLogicalDatabaseName, @SchemaReadyUtc, @CreatedUtc, NULL);
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.StandbyId,
                    SqlLogicalDatabaseName = record.SqlLogicalDatabaseName.Trim(),
                    record.SchemaReadyUtc,
                    record.CreatedUtc
                },
                cancellationToken: cancellationToken));
    }

    public async Task MarkClaimedAsync(Guid standbyId, CancellationToken cancellationToken)
    {
        await using SqlConnection connection =
            await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           UPDATE dbo.WarmTenantCatalogStandby
                           SET ClaimedUtc = SYSUTCDATETIME()
                           WHERE StandbyId = @StandbyId
                             AND ClaimedUtc IS NULL;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(sql, new { StandbyId = standbyId }, cancellationToken: cancellationToken));
    }

    private static async Task<bool> TableExistsAsync(SqlConnection connection, CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT CASE WHEN OBJECT_ID(N'dbo.WarmTenantCatalogStandby', N'U') IS NULL THEN 0 ELSE 1 END;
                           """;

        int flag = await connection.QuerySingleAsync<int>(new CommandDefinition(sql, cancellationToken: cancellationToken));

        return flag != 0;
    }

    private sealed class Row
    {
        public Guid StandbyId
        {
            get;
            init;
        }

        public string SqlLogicalDatabaseName
        {
            get;
            init;
        } = string.Empty;

        public DateTimeOffset SchemaReadyUtc
        {
            get;
            init;
        }

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? ClaimedUtc
        {
            get;
            init;
        }

        internal WarmTenantCatalogStandbyRecord ToRecord() =>
            new()
            {
                StandbyId = StandbyId,
                SqlLogicalDatabaseName = SqlLogicalDatabaseName,
                SchemaReadyUtc = SchemaReadyUtc,
                CreatedUtc = CreatedUtc,
                ClaimedUtc = ClaimedUtc
            };
    }
}
