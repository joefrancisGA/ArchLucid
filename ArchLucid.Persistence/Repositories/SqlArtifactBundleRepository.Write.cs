using System.Data;
using System.Security.Cryptography;
using System.Text;

using ArchLucid.Persistence.ArtifactBundles;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlArtifactBundleRepository
{
    public async Task SaveAsync(
        ArtifactBundle bundle,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(bundle);

        if (connection is not null)
        {
            await SaveCoreAsync(bundle, connection, transaction, ct);
            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct);
        await using SqlTransaction tx = owned.BeginTransaction();

        try
        {
            await SaveCoreAsync(bundle, owned, tx, ct);
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    private async Task SaveCoreAsync(
        ArtifactBundle bundle,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        const string sql = """
                           INSERT INTO dbo.ArtifactBundles
                           (
                               BundleId, RunId, ManifestId, CreatedUtc, Status, ArtifactsJson, TraceJson,
                               TenantId, WorkspaceId, ProjectId, BundlePayloadBlobUri
                           )
                           VALUES
                           (
                               @BundleId, @RunId, @ManifestId, @CreatedUtc, @Status, @ArtifactsJson, @TraceJson,
                               @TenantId, @WorkspaceId, @ProjectId, @BundlePayloadBlobUri
                           );
                           """;

        string artifactsJson = JsonEntitySerializer.Serialize(bundle.Artifacts);
        string traceJson = JsonEntitySerializer.Serialize(bundle.Trace);

        ArtifactLargePayloadOptions payloadOpts = largePayloadOptions.CurrentValue;
        string? bundlePayloadBlobUri = null;

        if (LargePayloadOffloadEvaluator.ShouldOffloadManifestOrBundle(
                payloadOpts,
                ArtifactBundlePayloadBlobEnvelope.SumUtf16Length(artifactsJson, traceJson)))
        {
            ArtifactBundlePayloadBlobEnvelope envelope =
                ArtifactBundlePayloadBlobEnvelope.FromJsonPair(artifactsJson, traceJson);
            bundlePayloadBlobUri = await blobStore.WriteAsync(
                "artifact-bundles",
                $"{bundle.BundleId:D}.json",
                envelope.ToJson(),
                ct);
        }

        object args = new
        {
            bundle.BundleId,
            bundle.RunId,
            bundle.ManifestId,
            bundle.CreatedUtc,
            Status = bundle.Status.ToString(),
            ArtifactsJson = artifactsJson,
            TraceJson = traceJson,
            bundle.TenantId,
            bundle.WorkspaceId,
            bundle.ProjectId,
            BundlePayloadBlobUri = bundlePayloadBlobUri
        };

        await connection.ExecuteAsync(new CommandDefinition(sql, args, transaction, cancellationToken: ct));

        ArtifactBundlePersistContext persistContext = new(blobStore, payloadOpts);

        await InsertArtifactBundleArtifactsRelationalAsync(bundle, connection, transaction, ct, persistContext);
        await InsertArtifactBundleTraceRelationalAsync(bundle, connection, transaction, ct);
    }

    private static async Task InsertArtifactBundleArtifactsRelationalAsync(
        ArtifactBundle bundle,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct,
        ArtifactBundlePersistContext? persistContext = null)
    {
        Guid bundleId = bundle.BundleId;

        const string insertArtifactSql = """
                                         INSERT INTO dbo.ArtifactBundleArtifacts
                                         (
                                             BundleId, SortOrder, ArtifactId, RunId, ManifestId, CreatedUtc,
                                             TenantId, WorkspaceId, ProjectId,
                                             ArtifactType, Name, Format, Content, ContentHash, GenerationStatus, ContentBlobUri
                                         )
                                         VALUES
                                         (
                                             @BundleId, @SortOrder, @ArtifactId, @RunId, @ManifestId, @CreatedUtc,
                                             @TenantId, @WorkspaceId, @ProjectId,
                                             @ArtifactType, @Name, @Format, @Content, @ContentHash, @GenerationStatus, @ContentBlobUri
                                         );
                                         """;

        for (int i = 0; i < bundle.Artifacts.Count; i++)
        {
            SynthesizedArtifact a = bundle.Artifacts[i];

            string content = a.Content;
            string? contentBlobUri = null;

            if (persistContext is { } ctx
                && LargePayloadOffloadEvaluator.ShouldOffloadArtifactContent(ctx.Options, content.Length))
            {
                string shaHex = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(content))).ToLowerInvariant();
                string dedupLogical = ArtifactBlobTenantPaths.FormatDedupArtifactContentRelativePath(shaHex);
                contentBlobUri = await ctx.BlobStore.TryGetExistingUriAsync("artifact-contents", dedupLogical, ct);

                if (contentBlobUri is null)
                {
                    contentBlobUri = await ctx.BlobStore.WriteAsync(
                        "artifact-contents",
                        dedupLogical,
                        content,
                        ct);
                }

                content = string.Empty;
            }

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertArtifactSql,
                    new
                    {
                        BundleId = bundleId,
                        SortOrder = i,
                        a.ArtifactId,
                        a.RunId,
                        a.ManifestId,
                        a.CreatedUtc,
                        bundle.TenantId,
                        bundle.WorkspaceId,
                        bundle.ProjectId,
                        a.ArtifactType,
                        a.Name,
                        a.Format,
                        Content = content,
                        a.ContentHash,
                        GenerationStatus = a.Status.ToString(),
                        ContentBlobUri = contentBlobUri
                    },
                    transaction,
                    cancellationToken: ct));

            int metaOrder = 0;

            foreach (KeyValuePair<string, string> meta in a.Metadata)
            {
                const string insertMetaSql = """
                                             INSERT INTO dbo.ArtifactBundleArtifactMetadata
                                             (BundleId, ArtifactSortOrder, MetaSortOrder, MetaKey, MetaValue,
                                              TenantId, WorkspaceId, ProjectId)
                                             VALUES (@BundleId, @ArtifactSortOrder, @MetaSortOrder, @MetaKey, @MetaValue,
                                                     @TenantId, @WorkspaceId, @ProjectId);
                                             """;

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        insertMetaSql,
                        new
                        {
                            BundleId = bundleId,
                            ArtifactSortOrder = i,
                            MetaSortOrder = metaOrder,
                            MetaKey = meta.Key,
                            MetaValue = meta.Value,
                            bundle.TenantId,
                            bundle.WorkspaceId,
                            bundle.ProjectId
                        },
                        transaction,
                        cancellationToken: ct));

                metaOrder++;
            }

            for (int d = 0; d < a.ContributingDecisionIds.Count; d++)
            {
                const string insertDecSql = """
                                            INSERT INTO dbo.ArtifactBundleArtifactDecisionLinks
                                            (BundleId, ArtifactSortOrder, LinkSortOrder, DecisionId,
                                             TenantId, WorkspaceId, ProjectId)
                                            VALUES (@BundleId, @ArtifactSortOrder, @LinkSortOrder, @DecisionId,
                                                    @TenantId, @WorkspaceId, @ProjectId);
                                            """;

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        insertDecSql,
                        new
                        {
                            BundleId = bundleId,
                            ArtifactSortOrder = i,
                            LinkSortOrder = d,
                            DecisionId = a.ContributingDecisionIds[d],
                            bundle.TenantId,
                            bundle.WorkspaceId,
                            bundle.ProjectId
                        },
                        transaction,
                        cancellationToken: ct));
            }
        }
    }
}
