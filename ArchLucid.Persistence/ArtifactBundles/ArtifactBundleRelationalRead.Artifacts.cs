using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.ArtifactBundles;

internal static partial class ArtifactBundleRelationalRead
{
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
