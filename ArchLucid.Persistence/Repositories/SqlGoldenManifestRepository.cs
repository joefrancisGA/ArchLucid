using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.GoldenManifests;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed <see cref="IGoldenManifestRepository" /> with dual-write to legacy JSON columns and
///     phase-1 relational tables for assumptions, warnings, decisions (+ evidence/node links + RawDecisionJson),
///     and provenance reference lists. Reads prefer relational slices per collection when rows exist.
///     JSON columns are <c>NVARCHAR(MAX)</c> with rowstore PAGE compression (migration 174); payloads above
///     <see cref="ArtifactLargePayloadOptions" /> thresholds offload to <c>ManifestPayloadBlobUri</c> instead of growing in-row JSON.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class SqlGoldenManifestRepository(
    ISqlConnectionFactory connectionFactory,
    IGoldenManifestLookupReadConnectionFactory manifestLookupReadConnectionFactory,
    IArtifactBlobStore blobStore,
    IOptionsMonitor<ArtifactLargePayloadOptions> largePayloadOptions) : IGoldenManifestRepository
{
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
