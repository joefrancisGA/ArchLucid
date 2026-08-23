using ArchLucid.Contracts.Governance.Posture;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Governance.Posture;

/// <summary>SQL aggregate read for architecture posture (TB-2375, TB-2376).</summary>
public sealed class SqlArchitecturePostureReader(ISqlConnectionFactory connectionFactory) : IArchitecturePostureReader
{
    public async Task<ArchitecturePostureReadModel> ReadAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (workspaceId == Guid.Empty)
            throw new ArgumentException("Workspace id is required.", nameof(workspaceId));

        if (projectId == Guid.Empty)
            throw new ArgumentException("Project id is required.", nameof(projectId));

        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        CommandDefinition command = new(
            ArchitecturePostureReadSql.ReadPostureBatch,
            new
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
            },
            cancellationToken: cancellationToken);

        using SqlMapper.GridReader grid = await connection.QueryMultipleAsync(command);

        List<PillarFindingAggregate> pillarAggregates =
            (await grid.ReadAsync<PillarFindingAggregate>()).ToList();

        List<PillarPackAssignment> packAssignments =
            (await grid.ReadAsync<PillarPackAssignment>()).ToList();

        ReviewIntegrityFooterRow footer =
            await grid.ReadSingleOrDefaultAsync<ReviewIntegrityFooterRow>()
            ?? new ReviewIntegrityFooterRow();

        return new ArchitecturePostureReadModel
        {
            PillarAggregates = pillarAggregates,
            PackAssignments = packAssignments,
            ReviewIntegrity = new ReviewIntegrityAggregate
            {
                CriticalCount = footer.CriticalCount,
                ErrorCount = footer.ErrorCount,
                WarningCount = footer.WarningCount,
                InfoCount = footer.InfoCount,
                DispositionedCount = footer.DispositionedCount,
                MutedCount = footer.MutedCount,
            },
            UncategorizedCount = footer.UncategorizedCount,
            LatestSnapshotCreatedUtc = footer.LatestSnapshotCreatedUtc,
        };
    }

    private sealed class ReviewIntegrityFooterRow
    {
        public int CriticalCount
        {
            get;
            init;
        }

        public int ErrorCount
        {
            get;
            init;
        }

        public int WarningCount
        {
            get;
            init;
        }

        public int InfoCount
        {
            get;
            init;
        }

        public int DispositionedCount
        {
            get;
            init;
        }

        public int MutedCount
        {
            get;
            init;
        }

        public int UncategorizedCount
        {
            get;
            init;
        }

        public DateTimeOffset? LatestSnapshotCreatedUtc
        {
            get;
            init;
        }
    }
}
