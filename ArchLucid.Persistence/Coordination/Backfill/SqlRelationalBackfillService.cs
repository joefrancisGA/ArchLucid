using System.Diagnostics.CodeAnalysis;
using ArchLucid.Core.Tenancy;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>
///     Scans authority tables for JSON-only rows, hydrates domain models (same paths as repositories), and inserts
///     missing relational slices. Safe to re-run: each slice insert is skipped when child rows already exist.
/// </summary>
[ExcludeFromCodeCoverage(Justification =
    "Entirely SQL-dependent; every method runs Dapper queries and transactions against live SQL Server.")]
[TenantScopeExempt(TenantScopeExemptReason.Operational, "Relational backfill orchestration runs under dedicated job identity within tenant catalogs.")]
public sealed partial class SqlRelationalBackfillService(
    ISqlConnectionFactory connectionFactory,
    SqlContextSnapshotRepository contextSnapshotRepository,
    SqlGraphSnapshotRepository graphSnapshotRepository,
    SqlFindingsSnapshotRepository findingsSnapshotRepository,
    SqlGoldenManifestRepository goldenManifestRepository,
    SqlArtifactBundleRepository artifactBundleRepository,
    IGraphSnapshotProjectionCache graphSnapshotProjectionCache,
    ILogger<SqlRelationalBackfillService> logger) : ISqlRelationalBackfillService
{
    private readonly SqlRelationalBackfillCheckpointStore _checkpoints = new(connectionFactory);
    private readonly SqlRelationalBackfillFailureQuarantineStore _quarantine = new(connectionFactory);

    public async Task<SqlRelationalBackfillReport> RunAsync(SqlRelationalBackfillOptions options, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(options);
        SqlRelationalBackfillReport report = new();

        if (options.ContextSnapshots)
        {
            await SqlRelationalBackfillStageRunner.RunTrackedStageAsync(
                "ContextSnapshots",
                report,
                () => BackfillContextSnapshotsAsync(options, report, ct),
                ct);
        }

        if (options.GraphSnapshots)
        {
            await SqlRelationalBackfillStageRunner.RunTrackedStageAsync(
                "GraphSnapshots",
                report,
                () => BackfillGraphSnapshotsAsync(options, report, ct),
                ct);
        }

        if (options.FindingsSnapshots)
        {
            await SqlRelationalBackfillStageRunner.RunTrackedStageAsync(
                "FindingsSnapshots",
                report,
                () => BackfillFindingsSnapshotsAsync(options, report, ct),
                ct);
        }

        if (options.GoldenManifestsPhase1)
        {
            await SqlRelationalBackfillStageRunner.RunTrackedStageAsync(
                "GoldenManifestsPhase1",
                report,
                () => BackfillGoldenManifestsAsync(options, report, ct),
                ct);
        }

        if (options.ArtifactBundles)
        {
            await SqlRelationalBackfillStageRunner.RunTrackedStageAsync(
                "ArtifactBundles",
                report,
                () => BackfillArtifactBundlesAsync(options, report, ct),
                ct);
        }

        return report;
    }
}
