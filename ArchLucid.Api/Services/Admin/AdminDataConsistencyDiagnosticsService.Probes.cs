using System.Data.Common;

using ArchLucid.Contracts.Admin;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.Admin;

namespace ArchLucid.Api.Services.Admin;

public sealed partial class AdminDataConsistencyDiagnosticsService
{
    public async Task<DataConsistencyOrphanCounts> GetDataConsistencyOrphanCountsAsync(
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return new DataConsistencyOrphanCounts(0, 0, 0, 0, 0, 0);

        DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();
        await using DbConnection _ = connection;
        await connection.OpenAsync(cancellationToken);

        long golden = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection, DataConsistencyOrphanProbeSql.GoldenManifestsRunId,
            cancellationToken);
        long findings = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection, DataConsistencyOrphanProbeSql.FindingsSnapshotsRunId,
            cancellationToken);
        long contextSnapshots = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection, DataConsistencyOrphanProbeSql.ContextSnapshotsRunId,
            cancellationToken);
        long graphSnapshots = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection, DataConsistencyOrphanProbeSql.GraphSnapshotsRunId,
            cancellationToken);

        return new DataConsistencyOrphanCounts(0, 0, golden, findings, contextSnapshots, graphSnapshots);
    }

    /// <inheritdoc />
    public async Task<DataConsistencyHeaderRepointCounts> GetDataConsistencyHeaderRepointCountsAsync(
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return new DataConsistencyHeaderRepointCounts(0, 0, 0, 0, 0, 0);

        DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();
        await using DbConnection _ = connection;
        await connection.OpenAsync(cancellationToken);

        long contextSnapshotId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
            connection,
            CommittedRunHeaderFkRepointProbeSql.ContextSnapshotId,
            cancellationToken);
        long graphSnapshotId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
            connection,
            CommittedRunHeaderFkRepointProbeSql.GraphSnapshotId,
            cancellationToken);
        long findingsSnapshotId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
            connection,
            CommittedRunHeaderFkRepointProbeSql.FindingsSnapshotId,
            cancellationToken);
        long goldenManifestId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
            connection,
            CommittedRunHeaderFkRepointProbeSql.GoldenManifestId,
            cancellationToken);
        long decisionTraceId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
            connection,
            CommittedRunHeaderFkRepointProbeSql.DecisionTraceId,
            cancellationToken);
        long artifactBundleId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
            connection,
            CommittedRunHeaderFkRepointProbeSql.ArtifactBundleId,
            cancellationToken);

        return new DataConsistencyHeaderRepointCounts(
            contextSnapshotId,
            graphSnapshotId,
            findingsSnapshotId,
            goldenManifestId,
            decisionTraceId,
            artifactBundleId);
    }

    public async Task<CrossTenantUsageRollup> GetCrossTenantUsageRollupAsync(
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return new CrossTenantUsageRollup(0, 0, 0, TimeProvider.System.GetUtcNow());

        DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();
        await using DbConnection _ = connection;
        await connection.OpenAsync(cancellationToken);

        long totalRuns =
            await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection, "SELECT COUNT_BIG(*) FROM dbo.Runs;", cancellationToken);

        long committedRuns =
            await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection,
                "SELECT COUNT_BIG(*) FROM dbo.Runs WHERE GoldenManifestId IS NOT NULL;",
                cancellationToken);

        long distinctTenants =
            await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection,
                "SELECT COUNT_BIG(DISTINCT TenantId) FROM dbo.Runs;",
                cancellationToken);

        return new CrossTenantUsageRollup(distinctTenants, committedRuns, totalRuns, TimeProvider.System.GetUtcNow());
    }
}
