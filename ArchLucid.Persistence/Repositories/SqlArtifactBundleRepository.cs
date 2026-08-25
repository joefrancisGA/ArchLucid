using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.ArtifactBundles;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed <see cref="IArtifactBundleRepository" /> with dual-write to legacy JSON columns and
///     relational tables for artifacts (content as plain NVARCHAR(MAX)), metadata, artifact–decision links,
///     and trace lists. Reads prefer relational slices when rows exist; trace scalars (TraceId, etc.) remain
///     sourced from <c>TraceJson</c> when present.
/// </summary>
/// <remarks>
///     Write and backfill methods live in <c>SqlArtifactBundleRepository.{Write|TraceWrite|Backfill}.cs</c> partials.
///     Relational hydration lives in <see cref="ArtifactBundleRelationalRead" />.
/// </remarks>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class SqlArtifactBundleRepository(
    ISqlConnectionFactory connectionFactory,
    IArtifactBlobStore blobStore,
    IOptionsMonitor<ArtifactLargePayloadOptions> largePayloadOptions) : IArtifactBundleRepository
{
    public async Task<ArtifactBundle?> GetByManifestIdAsync(
        ScopeContext scope,
        Guid manifestId,
        bool loadArtifactBodies,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT TOP 1
                               TenantId, WorkspaceId, ProjectId,
                               BundleId, RunId, ManifestId, CreatedUtc, Status, ArtifactsJson, TraceJson, BundlePayloadBlobUri
                           FROM dbo.ArtifactBundles
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ScopeProjectId
                             AND ManifestId = @ManifestId
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        ArtifactBundleStorageRow? row = await connection.QuerySingleOrDefaultAsync<ArtifactBundleStorageRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ManifestId = manifestId
                },
                cancellationToken: ct));

        if (row is null)
            return null;

        row = await ApplyBundleBlobOverlayIfPresentAsync(row, ct);

        try
        {
            return await ArtifactBundleRelationalRead.HydrateBundleAsync(connection, row, blobStore, loadArtifactBodies,
                ct);
        }
        catch (InvalidOperationException ex)
        {
            throw new InvalidOperationException(
                $"Failed to deserialize ArtifactBundle '{row.BundleId}' for manifest '{row.ManifestId}'. " +
                "The stored JSON may be corrupt or from an incompatible schema version.", ex);
        }
    }

    public async Task<SynthesizedArtifact?> GetArtifactByIdAsync(
        ScopeContext scope,
        Guid manifestId,
        Guid artifactId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        // Header lookup without the ArtifactsJson/TraceJson LOB columns — we only need the bundle id.
        const string headerSql = """
                                 SELECT TOP 1 BundleId
                                 FROM dbo.ArtifactBundles
                                 WHERE TenantId = @TenantId
                                   AND WorkspaceId = @WorkspaceId
                                   AND ProjectId = @ScopeProjectId
                                   AND ManifestId = @ManifestId
                                 ORDER BY CreatedUtc DESC;
                                 """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        Guid? bundleId = await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                headerSql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ManifestId = manifestId
                },
                cancellationToken: ct));

        if (bundleId is null)
            return null;

        SynthesizedArtifact? relational = await ArtifactBundleRelationalRead.TryLoadSingleArtifactRelationalAsync(
            connection,
            bundleId.Value,
            artifactId,
            ct);

        if (relational is not null)
            return relational;

        // Legacy JSON-only bundles (or a genuine miss): fall back to the full hydrate so behavior
        // matches GetByManifestIdAsync exactly. Misses pay the full cost but are rare.
        ArtifactBundle? bundle = await GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: true, ct);

        return bundle?.Artifacts.FirstOrDefault(artifact => artifact.ArtifactId == artifactId);
    }

    /// <summary>
    ///     Loads a bundle by primary key (admin/backfill scenarios).
    /// </summary>
    public async Task<ArtifactBundle?> GetByBundleIdAsync(Guid bundleId, CancellationToken ct)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await GetByBundleIdAsync(bundleId, connection, null, ct);
    }

    /// <inheritdoc cref="GetByBundleIdAsync(System.Guid,System.Threading.CancellationToken)" />
    public async Task<ArtifactBundle?> GetByBundleIdAsync(
        Guid bundleId,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        const string sql = """
                           SELECT
                               TenantId, WorkspaceId, ProjectId,
                               BundleId, RunId, ManifestId, CreatedUtc, Status, ArtifactsJson, TraceJson, BundlePayloadBlobUri
                           FROM dbo.ArtifactBundles
                           WHERE BundleId = @BundleId;
                           """;

        ArtifactBundleStorageRow? row = await connection.QuerySingleOrDefaultAsync<ArtifactBundleStorageRow>(
            new CommandDefinition(
                sql,
                new
                {
                    BundleId = bundleId
                },
                transaction,
                cancellationToken: ct));

        if (row is null)
            return null;

        SqlConnection sqlConnection = connection as SqlConnection
                                      ?? throw new InvalidOperationException(
                                          "SQL Server backfill requires SqlConnection.");

        row = await ApplyBundleBlobOverlayIfPresentAsync(row, ct);

        return await ArtifactBundleRelationalRead.HydrateBundleAsync(sqlConnection, row, blobStore, loadArtifactBodies: true,
            ct);
    }

    private async Task<ArtifactBundleStorageRow> ApplyBundleBlobOverlayIfPresentAsync(
        ArtifactBundleStorageRow row,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(row.BundlePayloadBlobUri))
            return row;

        string? json = await blobStore.ReadAsync(row.BundlePayloadBlobUri!, ct);

        if (string.IsNullOrEmpty(json))
            return row;

        ArtifactBundlePayloadBlobEnvelope? envelope = ArtifactBundlePayloadBlobEnvelope.TryDeserialize(json);

        if (envelope is null || envelope.SchemaVersion != ArtifactBundlePayloadBlobEnvelope.CurrentSchemaVersion)
            return row;

        return ArtifactBundlePayloadBlobEnvelope.MergeIntoRow(row, envelope);
    }
}
