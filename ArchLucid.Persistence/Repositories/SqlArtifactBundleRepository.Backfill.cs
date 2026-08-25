using System.Data;

using ArchLucid.Persistence.RelationalRead;

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

        int artifactRowCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ArtifactBundleArtifacts WHERE BundleId = @BundleId",
            new
            {
                BundleId = bundleId
            },
            ct);

        int genCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ArtifactBundleTraceGenerators WHERE BundleId = @BundleId",
            new
            {
                BundleId = bundleId
            },
            ct);

        int traceDecCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ArtifactBundleTraceDecisionLinks WHERE BundleId = @BundleId",
            new
            {
                BundleId = bundleId
            },
            ct);

        int notesCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ArtifactBundleTraceNotes WHERE BundleId = @BundleId",
            new
            {
                BundleId = bundleId
            },
            ct);

        if (artifactRowCount == 0 && bundle.Artifacts.Count > 0)
        {
            await InsertArtifactBundleArtifactsRelationalAsync(bundle, connection, transaction, ct);
            await InsertArtifactBundleTraceRelationalAsync(bundle, connection, transaction, ct);
            return;
        }

        if (genCount == 0 && bundle.Trace.GeneratorsUsed.Count > 0)
            await InsertArtifactBundleTraceGeneratorsRelationalAsync(bundle, connection, transaction, ct);

        if (traceDecCount == 0 && bundle.Trace.SourceDecisionIds.Count > 0)
            await InsertArtifactBundleTraceDecisionLinksRelationalAsync(bundle, connection, transaction, ct);

        if (notesCount == 0 && bundle.Trace.Notes.Count > 0)
            await InsertArtifactBundleTraceNotesRelationalAsync(bundle, connection, transaction, ct);
    }
}
