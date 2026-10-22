using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.ArtifactBundles;

internal static partial class ArtifactBundleRelationalRead
{
    /// <summary>
    ///     Loads one artifact row (with body) by id without hydrating sibling artifact bodies.
    ///     Returns <see langword="null" /> when no relational row matches — callers fall back to the
    ///     full bundle hydrate so legacy JSON-only bundles keep working.
    /// </summary>
    internal static async Task<SynthesizedArtifact?> TryLoadSingleArtifactRelationalAsync(
        SqlConnection connection,
        Guid bundleId,
        Guid artifactId,
        CancellationToken ct)
    {
        const string artifactSql = """
                                   SELECT SortOrder, ArtifactId, RunId, ManifestId, CreatedUtc,
                                          ArtifactType, Name, Format, Content, ContentHash, GenerationStatus, ContentBlobUri
                                   FROM dbo.ArtifactBundleArtifacts
                                   WHERE BundleId = @BundleId AND ArtifactId = @ArtifactId;
                                   """;

        ArtifactSliceRow? row = await connection.QuerySingleOrDefaultAsync<ArtifactSliceRow>(
            new CommandDefinition(
                artifactSql,
                new { BundleId = bundleId, ArtifactId = artifactId },
                cancellationToken: ct));

        if (row is null)
            return null;

        const string metaSql = """
                               SELECT ArtifactSortOrder, MetaSortOrder, MetaKey, MetaValue
                               FROM dbo.ArtifactBundleArtifactMetadata
                               WHERE BundleId = @BundleId AND ArtifactSortOrder = @ArtifactSortOrder
                               ORDER BY MetaSortOrder;
                               """;

        List<MetadataSliceRow> metaRows = (await connection.QueryAsync<MetadataSliceRow>(
            new CommandDefinition(
                metaSql,
                new { BundleId = bundleId, ArtifactSortOrder = row.SortOrder },
                cancellationToken: ct))).ToList();

        const string decSql = """
                              SELECT ArtifactSortOrder, LinkSortOrder, DecisionId
                              FROM dbo.ArtifactBundleArtifactDecisionLinks
                              WHERE BundleId = @BundleId AND ArtifactSortOrder = @ArtifactSortOrder
                              ORDER BY LinkSortOrder;
                              """;

        List<ArtifactDecisionSliceRow> decisionRows = (await connection.QueryAsync<ArtifactDecisionSliceRow>(
            new CommandDefinition(
                decSql,
                new { BundleId = bundleId, ArtifactSortOrder = row.SortOrder },
                cancellationToken: ct))).ToList();

        Dictionary<string, string> metadata = new(StringComparer.Ordinal);

        foreach (MetadataSliceRow mr in metaRows)
            metadata[mr.MetaKey] = mr.MetaValue;

        return new SynthesizedArtifact
        {
            ArtifactId = row.ArtifactId,
            RunId = row.RunId,
            ManifestId = row.ManifestId,
            CreatedUtc = row.CreatedUtc,
            ArtifactType = row.ArtifactType,
            Name = row.Name,
            Format = row.Format,
            Content = row.Content ?? string.Empty,
            ContentHash = row.ContentHash,
            Status = SynthesizedArtifactSliceStatusParser.Parse(row.GenerationStatus),
            Metadata = metadata,
            ContributingDecisionIds = decisionRows.Select(static dr => dr.DecisionId).ToList()
        };
    }
}
