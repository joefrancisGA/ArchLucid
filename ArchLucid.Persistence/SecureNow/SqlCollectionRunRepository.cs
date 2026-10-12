using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.SecureNow;

public sealed class SqlCollectionRunRepository(ISqlConnectionFactory connectionFactory) : ICollectionRunRepository
{
    public async Task UpsertAsync(CollectionRun collectionRun, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(collectionRun);

        const string sql = """
                           UPDATE dbo.SecureNowCollectionRuns
                           SET AgentVersion = @AgentVersion,
                               Schedule = @Schedule,
                               StartedUtc = @StartedUtc,
                               FinishedUtc = @FinishedUtc,
                               Status = @Status,
                               SubscriptionsCoveredJson = @SubscriptionsCoveredJson,
                               ErrorSummary = @ErrorSummary,
                               ZipPath = @ZipPath,
                               ZipSha256 = @ZipSha256,
                               ImportedSnapshotId = @ImportedSnapshotId
                           WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId AND RunId = @RunId;

                           IF @@ROWCOUNT = 0
                           BEGIN
                               INSERT INTO dbo.SecureNowCollectionRuns
                               (TenantId, WorkspaceId, ProjectId, RunId, AgentVersion, Schedule, StartedUtc, FinishedUtc,
                                Status, SubscriptionsCoveredJson, ErrorSummary, ZipPath, ZipSha256, ImportedSnapshotId)
                               VALUES
                               (@TenantId, @WorkspaceId, @ProjectId, @RunId, @AgentVersion, @Schedule, @StartedUtc, @FinishedUtc,
                                @Status, @SubscriptionsCoveredJson, @ErrorSummary, @ZipPath, @ZipSha256, @ImportedSnapshotId);
                           END;
                           """;

        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                collectionRun.TenantId,
                collectionRun.WorkspaceId,
                collectionRun.ProjectId,
                collectionRun.RunId,
                collectionRun.AgentVersion,
                collectionRun.Schedule,
                collectionRun.StartedUtc,
                collectionRun.FinishedUtc,
                Status = (int)collectionRun.Status,
                collectionRun.SubscriptionsCoveredJson,
                collectionRun.ErrorSummary,
                collectionRun.ZipPath,
                collectionRun.ZipSha256,
                collectionRun.ImportedSnapshotId,
            },
            cancellationToken: cancellationToken));
    }

    public async Task<CollectionRun?> GetAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        const string sql = """
                           SELECT TenantId, WorkspaceId, ProjectId, RunId, AgentVersion, Schedule, StartedUtc, FinishedUtc,
                                  Status, SubscriptionsCoveredJson, ErrorSummary, ZipPath, ZipSha256, ImportedSnapshotId
                           FROM dbo.SecureNowCollectionRuns
                           WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId AND RunId = @RunId;
                           """;
        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<CollectionRunRow>(
            new CommandDefinition(sql, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, runId }, cancellationToken: cancellationToken))
            is CollectionRunRow row
            ? row.ToModel()
            : null;
    }

    public async Task<IReadOnlyList<CollectionRun>> ListAsync(
        ScopeContext scope,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        const string sql = """
                           SELECT TenantId, WorkspaceId, ProjectId, RunId, AgentVersion, Schedule, StartedUtc, FinishedUtc,
                                  Status, SubscriptionsCoveredJson, ErrorSummary, ZipPath, ZipSha256, ImportedSnapshotId
                           FROM dbo.SecureNowCollectionRuns
                           WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId
                           ORDER BY StartedUtc DESC, RunId DESC
                           OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
                           """;
        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<CollectionRunRow> rows = await connection.QueryAsync<CollectionRunRow>(
            new CommandDefinition(sql, new
            {
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                Offset = Math.Max(0, offset),
                Limit = Math.Clamp(limit, 1, 100),
            }, cancellationToken: cancellationToken));
        return rows.Select(static row => row.ToModel()).ToArray();
    }

    public async Task<bool> HasImportedHashAsync(
        ScopeContext scope,
        byte[] zipSha256,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(zipSha256);
        const string sql = """
                           SELECT CAST(CASE WHEN EXISTS
                             (SELECT 1 FROM dbo.SecureNowCollectionRuns
                              WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId
                                AND Status = @Status AND ZipSha256 = @ZipSha256)
                             THEN 1 ELSE 0 END AS BIT);
                           """;
        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            sql,
            new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, Status = (int)CollectionRunStatus.Imported, ZipSha256 = zipSha256 },
            cancellationToken: cancellationToken));
    }

    private sealed class CollectionRunRow
    {
        public Guid TenantId { get; init; }
        public Guid WorkspaceId { get; init; }
        public Guid ProjectId { get; init; }
        public Guid RunId { get; init; }
        public string AgentVersion { get; init; } = string.Empty;
        public string? Schedule { get; init; }
        public DateTime StartedUtc { get; init; }
        public DateTime? FinishedUtc { get; init; }
        public int Status { get; init; }
        public string SubscriptionsCoveredJson { get; init; } = "[]";
        public string? ErrorSummary { get; init; }
        public string? ZipPath { get; init; }
        public byte[]? ZipSha256 { get; init; }
        public Guid? ImportedSnapshotId { get; init; }

        public CollectionRun ToModel() => new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            RunId = RunId,
            AgentVersion = AgentVersion,
            Schedule = Schedule,
            StartedUtc = StartedUtc,
            FinishedUtc = FinishedUtc,
            Status = Enum.IsDefined(typeof(CollectionRunStatus), Status)
                ? (CollectionRunStatus)Status
                : CollectionRunStatus.Failed,
            SubscriptionsCoveredJson = SubscriptionsCoveredJson,
            ErrorSummary = ErrorSummary,
            ZipPath = ZipPath,
            ZipSha256 = ZipSha256,
            ImportedSnapshotId = ImportedSnapshotId,
        };
    }
}
