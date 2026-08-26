using ArchLucid.Persistence.BlobStore;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.ArtifactBundles;

internal static partial class ArtifactBundleRelationalRead
{
    internal static async Task<ArtifactBundle> HydrateBundleAsync(
        SqlConnection connection,
        ArtifactBundleStorageRow row,
        IArtifactBlobStore blobStore,
        bool loadArtifactBodies,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(blobStore);

        Guid bundleId = row.BundleId;

        // Load slices directly instead of probing COUNT(1) first: an empty result carries the same
        // "no relational rows" signal a count would, without four extra round trips per hydrate.
        List<SynthesizedArtifact> relationalArtifacts =
            await LoadArtifactsRelationalAsync(connection, bundleId, loadArtifactBodies, ct);

        List<SynthesizedArtifact> artifacts = relationalArtifacts.Count > 0
            ? relationalArtifacts
            : ArtifactBundleArtifactsJsonReader.DeserializeArtifacts(row.ArtifactsJson);

        SynthesisTrace trace = ArtifactBundleTraceJsonReader.DeserializeTraceBase(row.TraceJson);

        List<string> generators = await LoadOrderedStringsAsync(
            connection,
            """
            SELECT GeneratorName AS Item
            FROM dbo.ArtifactBundleTraceGenerators
            WHERE BundleId = @BundleId
            ORDER BY SortOrder;
            """,
            bundleId,
            ct);

        if (generators.Count > 0)
            trace.GeneratorsUsed = generators;

        List<string> sourceDecisionIds = await LoadOrderedStringsAsync(
            connection,
            """
            SELECT DecisionId AS Item
            FROM dbo.ArtifactBundleTraceDecisionLinks
            WHERE BundleId = @BundleId
            ORDER BY SortOrder;
            """,
            bundleId,
            ct);

        if (sourceDecisionIds.Count > 0)
            trace.SourceDecisionIds = sourceDecisionIds;

        List<string> notes = await LoadOrderedStringsAsync(
            connection,
            """
            SELECT NoteText AS Item
            FROM dbo.ArtifactBundleTraceNotes
            WHERE BundleId = @BundleId
            ORDER BY SortOrder;
            """,
            bundleId,
            ct);

        if (notes.Count > 0)
            trace.Notes = notes;

        return new ArtifactBundle
        {
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            BundleId = row.BundleId,
            RunId = row.RunId,
            ManifestId = row.ManifestId,
            CreatedUtc = row.CreatedUtc,
            Status = ArtifactBundleStatusParser.Parse(row.Status),
            Artifacts = artifacts,
            Trace = trace
        };
    }

    private static async Task<List<string>> LoadOrderedStringsAsync(
        SqlConnection connection,
        string sql,
        Guid bundleId,
        CancellationToken ct)
    {
        IEnumerable<string> rows = await connection.QueryAsync<string>(
            new CommandDefinition(
                sql,
                new { BundleId = bundleId },
                cancellationToken: ct));

        return rows.ToList();
    }
}
