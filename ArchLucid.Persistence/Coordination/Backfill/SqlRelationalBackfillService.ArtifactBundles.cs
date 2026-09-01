using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Persistence.Coordination.Backfill;

public sealed partial class SqlRelationalBackfillService
{
    private Task BackfillArtifactBundlesAsync(
        SqlRelationalBackfillOptions options,
        SqlRelationalBackfillReport report,
        CancellationToken ct) =>
        SqlRelationalBackfillStageProcessor.ProcessGuidStageAsync(
            "ArtifactBundles",
            options,
            report,
            connectionFactory,
            _checkpoints,
            _quarantine,
            "dbo.ArtifactBundles",
            "BundleId",
            (bundleId, token) => ProcessArtifactBundleAsync(bundleId, token),
            logger,
            ct);

    private async Task ProcessArtifactBundleAsync(Guid bundleId, CancellationToken ct)
    {
        ArtifactBundle? bundle = await artifactBundleRepository.GetByBundleIdAsync(bundleId, ct);

        if (bundle is null)
            return;

        await using Microsoft.Data.SqlClient.SqlConnection conn = await connectionFactory.CreateOpenConnectionAsync(ct);
        await using Microsoft.Data.SqlClient.SqlTransaction tx = conn.BeginTransaction();

        await SqlArtifactBundleRepository.BackfillRelationalSlicesAsync(bundle, conn, tx, ct);
        tx.Commit();
    }
}
