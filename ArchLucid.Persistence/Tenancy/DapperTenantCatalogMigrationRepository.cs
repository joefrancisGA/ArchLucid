using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

[TenantScopeExempt(TenantScopeExemptReason.SystemPlaneOnly, "Tenant catalog migration state is stored on the control-plane catalog.")]
public sealed class DapperTenantCatalogMigrationRepository(ISystemSqlConnectionFactory systemSqlConnectionFactory)
    : ITenantCatalogMigrationRepository
{
    private readonly ISystemSqlConnectionFactory _systemSqlConnectionFactory =
        systemSqlConnectionFactory ?? throw new ArgumentNullException(nameof(systemSqlConnectionFactory));

    public async Task<TenantCatalogMigrationRecord?> GetActiveByTenantIdAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _systemSqlConnectionFactory.CreateOpenConnectionAsync(ct);

        if (!await TableExistsAsync(connection, ct))
            return null;

        const string sql = """
                           SELECT TOP (1)
                               MigrationId,
                               TenantId,
                               CorrelationId,
                               Stage,
                               StartedUtc,
                               CompletedUtc,
                               MaintenanceMessage,
                               VerificationPassedUtc,
                               LastVerificationError
                           FROM dbo.TenantCatalogMigrations
                           WHERE TenantId = @TenantId
                             AND CompletedUtc IS NULL
                           ORDER BY StartedUtc DESC;
                           """;

        MigrationRow? row = await connection.QuerySingleOrDefaultAsync<MigrationRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: ct));

        return row?.ToRecord();
    }

    public async Task<TenantCatalogMigrationRecord?> GetByIdAsync(Guid migrationId, CancellationToken ct)
    {
        await using SqlConnection connection = await _systemSqlConnectionFactory.CreateOpenConnectionAsync(ct);

        if (!await TableExistsAsync(connection, ct))
            return null;

        const string sql = """
                           SELECT
                               MigrationId,
                               TenantId,
                               CorrelationId,
                               Stage,
                               StartedUtc,
                               CompletedUtc,
                               MaintenanceMessage,
                               VerificationPassedUtc,
                               LastVerificationError
                           FROM dbo.TenantCatalogMigrations
                           WHERE MigrationId = @MigrationId;
                           """;

        MigrationRow? row = await connection.QuerySingleOrDefaultAsync<MigrationRow>(
            new CommandDefinition(sql, new { MigrationId = migrationId }, cancellationToken: ct));

        return row?.ToRecord();
    }

    public async Task InsertAsync(TenantCatalogMigrationRecord record, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(record);

        await using SqlConnection connection = await _systemSqlConnectionFactory.CreateOpenConnectionAsync(ct);

        const string sql = """
                           INSERT INTO dbo.TenantCatalogMigrations
                               (MigrationId, TenantId, CorrelationId, Stage, StartedUtc, CompletedUtc, MaintenanceMessage, VerificationPassedUtc, LastVerificationError)
                           VALUES
                               (@MigrationId, @TenantId, @CorrelationId, @Stage, @StartedUtc, @CompletedUtc, @MaintenanceMessage, @VerificationPassedUtc, @LastVerificationError);
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.MigrationId,
                    record.TenantId,
                    record.CorrelationId,
                    Stage = record.Stage.ToString(),
                    record.StartedUtc,
                    record.CompletedUtc,
                    record.MaintenanceMessage,
                    record.VerificationPassedUtc,
                    record.LastVerificationError,
                },
                cancellationToken: ct));
    }

    public async Task UpdateStageAsync(Guid migrationId, TenantCatalogMigrationStage stage, CancellationToken ct)
    {
        await using SqlConnection connection = await _systemSqlConnectionFactory.CreateOpenConnectionAsync(ct);

        const string sql = """
                           UPDATE dbo.TenantCatalogMigrations
                           SET Stage = @Stage
                           WHERE MigrationId = @MigrationId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    MigrationId = migrationId,
                    Stage = stage.ToString(),
                },
                cancellationToken: ct));
    }

    public async Task MarkVerificationResultAsync(
        Guid migrationId,
        bool passed,
        string? errorMessage,
        DateTimeOffset utcNow,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _systemSqlConnectionFactory.CreateOpenConnectionAsync(ct);

        const string sql = """
                           UPDATE dbo.TenantCatalogMigrations
                           SET VerificationPassedUtc = @VerificationPassedUtc,
                               LastVerificationError = @LastVerificationError,
                               Stage = @Stage
                           WHERE MigrationId = @MigrationId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    MigrationId = migrationId,
                    VerificationPassedUtc = passed ? utcNow : (DateTimeOffset?)null,
                    LastVerificationError = passed ? null : errorMessage,
                    Stage = passed
                        ? TenantCatalogMigrationStage.Verification.ToString()
                        : TenantCatalogMigrationStage.Verification.ToString(),
                },
                cancellationToken: ct));
    }

    public async Task CompleteAsync(Guid migrationId, DateTimeOffset completedUtc, CancellationToken ct)
    {
        await using SqlConnection connection = await _systemSqlConnectionFactory.CreateOpenConnectionAsync(ct);

        const string sql = """
                           UPDATE dbo.TenantCatalogMigrations
                           SET CompletedUtc = @CompletedUtc,
                               Stage = @Stage
                           WHERE MigrationId = @MigrationId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    MigrationId = migrationId,
                    CompletedUtc = completedUtc,
                    Stage = TenantCatalogMigrationStage.Complete.ToString(),
                },
                cancellationToken: ct));
    }

    private static async Task<bool> TableExistsAsync(SqlConnection connection, CancellationToken ct)
    {
        const string sql = """
                           SELECT 1
                           WHERE OBJECT_ID(N'dbo.TenantCatalogMigrations', N'U') IS NOT NULL;
                           """;

        int? exists = await connection.ExecuteScalarAsync<int?>(new CommandDefinition(sql, cancellationToken: ct));

        return exists == 1;
    }

    private sealed class MigrationRow
    {
        public Guid MigrationId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string CorrelationId
        {
            get;
            init;
        } = string.Empty;

        public string Stage
        {
            get;
            init;
        } = string.Empty;

        public DateTimeOffset StartedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? CompletedUtc
        {
            get;
            init;
        }

        public string MaintenanceMessage
        {
            get;
            init;
        } = string.Empty;

        public DateTimeOffset? VerificationPassedUtc
        {
            get;
            init;
        }

        public string? LastVerificationError
        {
            get;
            init;
        }

        public TenantCatalogMigrationRecord ToRecord()
        {
            if (!Enum.TryParse(Stage, ignoreCase: true, out TenantCatalogMigrationStage stage))
                stage = TenantCatalogMigrationStage.ScopeFreeze;

            return new TenantCatalogMigrationRecord
            {
                MigrationId = MigrationId,
                TenantId = TenantId,
                CorrelationId = CorrelationId,
                Stage = stage,
                StartedUtc = StartedUtc,
                CompletedUtc = CompletedUtc,
                MaintenanceMessage = MaintenanceMessage,
                VerificationPassedUtc = VerificationPassedUtc,
                LastVerificationError = LastVerificationError,
            };
        }
    }
}
