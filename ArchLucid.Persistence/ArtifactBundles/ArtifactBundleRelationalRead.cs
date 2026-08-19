using ArchLucid.Persistence.BlobStore;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.ArtifactBundles;

/// <summary>
///     Relational hydration for artifact list slices when rows exist; otherwise <c>ArtifactsJson</c>. Trace base
///     remains JSON with relational list overlays.
/// </summary>
internal static class ArtifactBundleRelationalRead
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

    private static async Task<List<SynthesizedArtifact>> LoadArtifactsRelationalAsync(
        SqlConnection connection,
        Guid bundleId,
        bool loadArtifactBodies,
        CancellationToken ct)
    {
        string artifactsSql = loadArtifactBodies
            ? """

              SELECT SortOrder, ArtifactId, RunId, ManifestId, CreatedUtc,
                     ArtifactType, Name, Format, Content, ContentHash, GenerationStatus, ContentBlobUri

              FROM dbo.ArtifactBundleArtifacts

              WHERE BundleId = @BundleId

              ORDER BY SortOrder;

              """
            : """

              SELECT SortOrder, ArtifactId, RunId, ManifestId, CreatedUtc,

                     ArtifactType, Name, Format, CAST(NULL AS NVARCHAR(MAX)) AS Content,

                     ContentHash, GenerationStatus, ContentBlobUri

              FROM dbo.ArtifactBundleArtifacts

              WHERE BundleId = @BundleId

              ORDER BY SortOrder;

              """;

        List<ArtifactSliceRow> artifactRows = (await connection.QueryAsync<ArtifactSliceRow>(
            new CommandDefinition(
                artifactsSql,
                new { BundleId = bundleId },
                cancellationToken: ct))).ToList();

        if (artifactRows.Count == 0)
            return [];

        const string metaSql = """
                               SELECT ArtifactSortOrder, MetaSortOrder, MetaKey, MetaValue
                               FROM dbo.ArtifactBundleArtifactMetadata
                               WHERE BundleId = @BundleId
                               ORDER BY ArtifactSortOrder, MetaSortOrder;
                               """;

        List<MetadataSliceRow> metaRows = (await connection.QueryAsync<MetadataSliceRow>(
            new CommandDefinition(
                metaSql,
                new { BundleId = bundleId },
                cancellationToken: ct))).ToList();

        const string decSql = """
                              SELECT ArtifactSortOrder, LinkSortOrder, DecisionId
                              FROM dbo.ArtifactBundleArtifactDecisionLinks
                              WHERE BundleId = @BundleId
                              ORDER BY ArtifactSortOrder, LinkSortOrder;
                              """;

        List<ArtifactDecisionSliceRow> decisionRows = (await connection.QueryAsync<ArtifactDecisionSliceRow>(
            new CommandDefinition(
                decSql,
                new { BundleId = bundleId },
                cancellationToken: ct))).ToList();

        Dictionary<int, Dictionary<string, string>> metaByArtifact = new();

        foreach (MetadataSliceRow mr in metaRows)
        {
            if (!metaByArtifact.TryGetValue(mr.ArtifactSortOrder, out Dictionary<string, string>? dict))
            {
                dict = new Dictionary<string, string>(StringComparer.Ordinal);
                metaByArtifact[mr.ArtifactSortOrder] = dict;
            }

            dict[mr.MetaKey] = mr.MetaValue;
        }

        Dictionary<int, List<string>> decisionsByArtifact = new();

        foreach (ArtifactDecisionSliceRow dr in decisionRows)
        {
            if (!decisionsByArtifact.TryGetValue(dr.ArtifactSortOrder, out List<string>? list))
            {
                list = [];
                decisionsByArtifact[dr.ArtifactSortOrder] = list;
            }

            list.Add(dr.DecisionId);
        }

        List<SynthesizedArtifact> result = [];

        foreach (ArtifactSliceRow ar in artifactRows)
        {
            metaByArtifact.TryGetValue(ar.SortOrder, out Dictionary<string, string>? meta);
            meta ??= new Dictionary<string, string>(StringComparer.Ordinal);

            decisionsByArtifact.TryGetValue(ar.SortOrder, out List<string>? decIds);
            decIds ??= [];

            result.Add(
                new SynthesizedArtifact
                {
                    ArtifactId = ar.ArtifactId,
                    RunId = ar.RunId,
                    ManifestId = ar.ManifestId,
                    CreatedUtc = ar.CreatedUtc,
                    ArtifactType = ar.ArtifactType,
                    Name = ar.Name,
                    Format = ar.Format,
                    Content = ar.Content ?? string.Empty,
                    ContentHash = ar.ContentHash,
                    Status = SynthesizedArtifactSliceStatusParser.Parse(ar.GenerationStatus),
                    Metadata = meta,
                    ContributingDecisionIds = decIds
                });
        }

        return result;
    }

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

    private sealed class ArtifactSliceRow
    {
        public int SortOrder
        {
            get;
            init;
        }

        public Guid ArtifactId
        {
            get;
            init;
        }

        public Guid RunId
        {
            get;
            init;
        }

        public Guid ManifestId
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public string ArtifactType
        {
            get;
            init;
        } = null!;

        public string Name
        {
            get;
            init;
        } = null!;

        public string Format
        {
            get;
            init;
        } = null!;

        public string? Content
        {
            get;
            init;
        }

        public string ContentHash
        {
            get;
            init;
        } = null!;

        public string? GenerationStatus
        {
            get;
            init;
        }

        public string? ContentBlobUri
        {
            get;
            init;
        }
    }

    private sealed class MetadataSliceRow
    {
        public int ArtifactSortOrder
        {
            get;
            init;
        }

        public int MetaSortOrder
        {
            get;
            init;
        }

        public string MetaKey
        {
            get;
            init;
        } = null!;

        public string MetaValue
        {
            get;
            init;
        } = null!;
    }

    private sealed class ArtifactDecisionSliceRow
    {
        public int ArtifactSortOrder
        {
            get;
            init;
        }

        public int LinkSortOrder
        {
            get;
            init;
        }

        public string DecisionId
        {
            get;
            init;
        } = null!;
    }
}

