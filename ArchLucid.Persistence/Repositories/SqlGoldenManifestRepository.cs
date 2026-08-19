using System.Data;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.GoldenManifests;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

using Cm = ArchLucid.Contracts.Manifest;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed <see cref="IGoldenManifestRepository" /> with dual-write to legacy JSON columns and
///     phase-1 relational tables for assumptions, warnings, decisions (+ evidence/node links + RawDecisionJson),
///     and provenance reference lists. Reads prefer relational slices per collection when rows exist.
///     JSON columns are <c>NVARCHAR(MAX)</c> with rowstore PAGE compression (migration 174); payloads above
///     <see cref="ArtifactLargePayloadOptions" /> thresholds offload to <c>ManifestPayloadBlobUri</c> instead of growing in-row JSON.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlGoldenManifestRepository(
    ISqlConnectionFactory connectionFactory,
    IGoldenManifestLookupReadConnectionFactory manifestLookupReadConnectionFactory,
    IArtifactBlobStore blobStore,
    IOptionsMonitor<ArtifactLargePayloadOptions> largePayloadOptions) : IGoldenManifestRepository
{
    public async Task SaveAsync(
        ManifestDocument manifest,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        PersistenceTenantScope.RequireEntityTenant(manifest.TenantId);

        if (connection is not null)
        {
            await SaveCoreAsync(manifest, connection, transaction, ct);
            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tx = owned.BeginTransaction();

        try
        {
            await SaveCoreAsync(manifest, owned, tx, ct);
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<ManifestDocument> SaveAsync(
        Cm.GoldenManifest contract,
        ScopeContext scope,
        SaveContractsManifestOptions keying,
        IManifestHashService contractHash,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null,
        ManifestDocument? authorityPersistBody = null)
    {
        if (contract is null)
            throw new ArgumentNullException(nameof(contract));

        if (scope is null)
            throw new ArgumentNullException(nameof(scope));

        if (keying is null)
            throw new ArgumentNullException(nameof(keying));

        if (contractHash is null)
            throw new ArgumentNullException(nameof(contractHash));

        PersistenceTenantScope.RequireScopedTenant(scope);
        ManifestDocument model = ContractGoldenManifestPersistence.ResolveGoldenManifestForContractSave(
            contract,
            scope,
            keying,
            authorityPersistBody);
        model.ManifestHash = GoldenManifestPersistedHashResolver.Resolve(keying, model, contractHash);
        await SaveAsync(model, ct, connection, transaction);
        return model;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> SupersedeUnreferencedActiveGoldenManifestsAsync(
        ScopeContext scope,
        Guid newManifestId,
        IDbConnection? connection,
        IDbTransaction? transaction,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (connection is not null)
            return await SupersedeUnreferencedActiveGoldenManifestsCoreAsync(scope, newManifestId, connection, transaction, cancellationToken);

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
        await using SqlTransaction tx = owned.BeginTransaction();

        try
        {
            IReadOnlyList<Guid> superseded =
                await SupersedeUnreferencedActiveGoldenManifestsCoreAsync(scope, newManifestId, owned, tx, cancellationToken);
            tx.Commit();
            return superseded;
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    private static async Task<IReadOnlyList<Guid>> SupersedeUnreferencedActiveGoldenManifestsCoreAsync(
        ScopeContext scope,
        Guid newManifestId,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken cancellationToken)
    {
        IEnumerable<Guid> rows = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                GoldenManifestWriteSql.SupersedeUnreferencedActive,
                GoldenManifestInsertParameters.ForSupersede(scope, newManifestId),
                transaction,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return rows.AsList();
    }

    public async Task<ManifestDocument?> GetByIdAsync(ScopeContext scope, Guid manifestId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection =
                await manifestLookupReadConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
            GoldenManifestStorageRow? row = await connection.QuerySingleOrDefaultAsync<GoldenManifestStorageRow>(
                new CommandDefinition(
                    GoldenManifestReadSql.SelectById,
                    GoldenManifestInsertParameters.ForManifest(scope, manifestId),
                    flags: CommandFlags.None,
                    cancellationToken: ct)).ConfigureAwait(false);

            if (row is null)
                return null;

            row = await ApplyManifestBlobOverlayIfPresentAsync(row, ct).ConfigureAwait(false);

            return await GoldenManifestPhase1RelationalRead.HydrateAsync(connection, row, ct).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetGoldenManifestById,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    /// <inheritdoc />
    public async Task<ManifestDocument?> GetByContractManifestVersionAsync(
        ScopeContext scope,
        string manifestVersion,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (string.IsNullOrWhiteSpace(manifestVersion))
            throw new ArgumentException("Manifest version is required.", nameof(manifestVersion));

        await using SqlConnection connection = await manifestLookupReadConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        GoldenManifestStorageRow? row = await connection.QuerySingleOrDefaultAsync<GoldenManifestStorageRow>(
            new CommandDefinition(
                GoldenManifestReadSql.SelectLatestByContractManifestVersion,
                GoldenManifestInsertParameters.ForContractManifestVersion(scope, manifestVersion),
                cancellationToken: ct)).ConfigureAwait(false);

        if (row is null)
            return null;

        row = await ApplyManifestBlobOverlayIfPresentAsync(row, ct).ConfigureAwait(false);

        return await GoldenManifestPhase1RelationalRead.HydrateAsync(connection, row, ct).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ManifestDocument>> ListPriorCommittedForRetrievalAsync(
        ScopeContext scope,
        Guid excludeRunId,
        int maxManifests,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);
        cancellationToken.ThrowIfCancellationRequested();

        if (maxManifests <= 0)
            return Array.Empty<ManifestDocument>();

        await using SqlConnection connection =
            await manifestLookupReadConnectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        IEnumerable<GoldenManifestStorageRow> rows = await connection.QueryAsync<GoldenManifestStorageRow>(
            new CommandDefinition(
                GoldenManifestReadSql.SelectPriorCommittedForRetrieval,
                GoldenManifestInsertParameters.ForPriorRetrieval(scope, excludeRunId, maxManifests),
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        List<ManifestDocument> documents = [];

        foreach (GoldenManifestStorageRow row in rows)
        {
            GoldenManifestStorageRow hydratedRow =
                await ApplyManifestBlobOverlayIfPresentAsync(row, cancellationToken).ConfigureAwait(false);
            documents.Add(GoldenManifestPriorRetrievalRead.Hydrate(hydratedRow));
        }

        return documents;
    }

    private async Task SaveCoreAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        GoldenManifestSerializedPayload payload = GoldenManifestSerializedPayload.FromDocument(manifest);
        string? manifestBlobUri = await TryOffloadPayloadAsync(manifest, payload, ct);

        await connection.ExecuteAsync(new CommandDefinition(
            GoldenManifestWriteSql.Insert,
            GoldenManifestInsertParameters.Create(manifest, payload, manifestBlobUri),
            transaction,
            cancellationToken: ct)).ConfigureAwait(false);

        await GoldenManifestRelationalWriter.InsertAllAsync(manifest, connection, transaction, ct);
    }

    /// <summary>
    ///     Offloads the payload slices to blob storage when their combined size crosses the threshold, returning the blob
    ///     URI to persist instead of growing in-row JSON. Returns <see langword="null" /> when the payload stays in-row.
    /// </summary>
    private async Task<string?> TryOffloadPayloadAsync(
        ManifestDocument manifest,
        GoldenManifestSerializedPayload payload,
        CancellationToken ct)
    {
        ArtifactLargePayloadOptions payloadOptions = largePayloadOptions.CurrentValue;

        if (!LargePayloadOffloadEvaluator.ShouldOffloadManifestOrBundle(payloadOptions, payload.TotalUtf16Length))
            return null;

        return await blobStore.WriteAsync(
            "golden-manifests",
            $"{manifest.ManifestId:D}.json",
            payload.ToBlobEnvelope().ToJson(),
            ct);
    }

    private async Task<GoldenManifestStorageRow> ApplyManifestBlobOverlayIfPresentAsync(
        GoldenManifestStorageRow row,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(row.ManifestPayloadBlobUri))
            return row;

        string? json = await blobStore.ReadAsync(row.ManifestPayloadBlobUri!, ct).ConfigureAwait(false);

        if (string.IsNullOrEmpty(json))
            return row;

        GoldenManifestPayloadBlobEnvelope? envelope = GoldenManifestPayloadBlobEnvelope.TryDeserialize(json);

        if (envelope is null || envelope.SchemaVersion != GoldenManifestPayloadBlobEnvelope.CurrentSchemaVersion)
            return row;

        return GoldenManifestPayloadBlobEnvelope.MergeIntoRow(row, envelope);
    }

    /// <summary>
    ///     Inserts phase-1 relational slices that are still empty while JSON columns contain data (idempotent per slice).
    /// </summary>
    internal static Task BackfillPhase1RelationalSlicesAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        PersistenceTenantScope.RequireEntityTenant(manifest.TenantId);

        return GoldenManifestRelationalWriter.BackfillEmptySlicesAsync(manifest, connection, transaction, ct);
    }
}
