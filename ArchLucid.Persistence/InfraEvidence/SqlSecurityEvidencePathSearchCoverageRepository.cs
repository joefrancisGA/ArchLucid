using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlSecurityEvidencePathSearchCoverageRepository(ISqlConnectionFactory connectionFactory)
    : ISecurityEvidencePathSearchCoverageRepository
{
    public async Task ReplaceForEngineAsync(
        ScopeContext scope,
        Guid snapshotId,
        string engineName,
        IReadOnlyList<SecurityEvidencePathSearchCoverageRecord> rows,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(rows);

        if (string.IsNullOrWhiteSpace(engineName))
        {
            throw new ArgumentException("Engine name is required.", nameof(engineName));
        }

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using System.Data.IDbTransaction transaction = connection.BeginTransaction();

        const string deleteSql = """
                                 DELETE FROM dbo.SecurityEvidencePathSearchCoverage
                                 WHERE TenantId = @TenantId
                                   AND WorkspaceId = @WorkspaceId
                                   AND ProjectId = @ProjectId
                                   AND SnapshotId = @SnapshotId
                                   AND EngineName = @EngineName;
                                 """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                deleteSql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    SnapshotId = snapshotId,
                    EngineName = engineName,
                },
                transaction: transaction,
                cancellationToken: cancellationToken));

        const string insertSql = """
                                 INSERT INTO dbo.SecurityEvidencePathSearchCoverage
                                 (
                                     SearchCoverageId, TenantId, WorkspaceId, ProjectId, SnapshotId,
                                     EngineName, LimitKind, LimitValue, PathsEmitted, CreatedUtc
                                 )
                                 VALUES
                                 (
                                     @SearchCoverageId, @TenantId, @WorkspaceId, @ProjectId, @SnapshotId,
                                     @EngineName, @LimitKind, @LimitValue, @PathsEmitted, @CreatedUtc
                                 );
                                 """;

        foreach (SecurityEvidencePathSearchCoverageRecord row in rows)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertSql,
                    new
                    {
                        row.SearchCoverageId,
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                        SnapshotId = snapshotId,
                        EngineName = engineName,
                        LimitKind = row.LimitKind.ToString(),
                        row.LimitValue,
                        row.PathsEmitted,
                        row.CreatedUtc,
                    },
                    transaction: transaction,
                    cancellationToken: cancellationToken));
        }

        transaction.Commit();
    }

    public async Task<IReadOnlyList<SecurityEvidencePathSearchCoverageRecord>> ListBySnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT SearchCoverageId, TenantId, WorkspaceId, ProjectId, SnapshotId,
                                  EngineName, LimitKind, LimitValue, PathsEmitted, CreatedUtc
                           FROM dbo.SecurityEvidencePathSearchCoverage
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND SnapshotId = @SnapshotId;
                           """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<CoverageRow> rows = await connection.QueryAsync<CoverageRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    SnapshotId = snapshotId,
                },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    private static SecurityEvidencePathSearchCoverageRecord Map(CoverageRow row)
    {
        if (!Enum.TryParse(row.LimitKind, ignoreCase: false, out SecurityEvidencePathSearchLimitKind limitKind))
        {
            limitKind = SecurityEvidencePathSearchLimitKind.MaxPaths;
        }

        return new SecurityEvidencePathSearchCoverageRecord
        {
            SearchCoverageId = row.SearchCoverageId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            SnapshotId = row.SnapshotId,
            EngineName = row.EngineName,
            LimitKind = limitKind,
            LimitValue = row.LimitValue,
            PathsEmitted = row.PathsEmitted,
            CreatedUtc = row.CreatedUtc,
        };
    }

    private sealed class CoverageRow
    {
        public Guid SearchCoverageId { get; init; }

        public Guid TenantId { get; init; }

        public Guid WorkspaceId { get; init; }

        public Guid ProjectId { get; init; }

        public Guid SnapshotId { get; init; }

        public string EngineName { get; init; } = string.Empty;

        public string LimitKind { get; init; } = string.Empty;

        public int LimitValue { get; init; }

        public int PathsEmitted { get; init; }

        public DateTime CreatedUtc { get; init; }
    }
}
