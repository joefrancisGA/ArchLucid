using System.Data;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.GoldenManifests;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

using Cm = ArchLucid.Contracts.Manifest;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlGoldenManifestRepository
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
}
