using System.Data;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlArtifactBundleRepository
{
    /// <summary>
    ///     Inserts relational artifact/trace slices that are still empty while JSON columns contain data (idempotent per
    ///     slice).
    /// </summary>
    internal static async Task BackfillRelationalSlicesAsync(
        ArtifactBundle bundle,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(bundle);
        ArgumentNullException.ThrowIfNull(connection);

        Guid bundleId = bundle.BundleId;
        object countParam = new { BundleId = bundleId };

        int artifactRowCount = await SqlRelationalSliceBackfillCore.CountSliceRowsAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ArtifactBundleArtifacts WHERE BundleId = @BundleId",
            countParam,
            ct);

        int genCount = await SqlRelationalSliceBackfillCore.CountSliceRowsAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ArtifactBundleTraceGenerators WHERE BundleId = @BundleId",
            countParam,
            ct);

        int traceDecCount = await SqlRelationalSliceBackfillCore.CountSliceRowsAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ArtifactBundleTraceDecisionLinks WHERE BundleId = @BundleId",
            countParam,
            ct);

        int notesCount = await SqlRelationalSliceBackfillCore.CountSliceRowsAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ArtifactBundleTraceNotes WHERE BundleId = @BundleId",
            countParam,
            ct);

        if (SqlRelationalSliceBackfillCore.SliceNeedsBackfill(artifactRowCount, bundle.Artifacts.Count))
        {
            await InsertArtifactBundleArtifactsRelationalAsync(bundle, connection, transaction, ct);
            await InsertArtifactBundleTraceRelationalAsync(bundle, connection, transaction, ct);
            return;
        }

        if (SqlRelationalSliceBackfillCore.SliceNeedsBackfill(genCount, bundle.Trace.GeneratorsUsed.Count))
            await InsertArtifactBundleTraceGeneratorsRelationalAsync(bundle, connection, transaction, ct);

        if (SqlRelationalSliceBackfillCore.SliceNeedsBackfill(traceDecCount, bundle.Trace.SourceDecisionIds.Count))
            await InsertArtifactBundleTraceDecisionLinksRelationalAsync(bundle, connection, transaction, ct);

        if (SqlRelationalSliceBackfillCore.SliceNeedsBackfill(notesCount, bundle.Trace.Notes.Count))
            await InsertArtifactBundleTraceNotesRelationalAsync(bundle, connection, transaction, ct);
    }
}
