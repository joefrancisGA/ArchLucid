using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.GoldenManifests;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlGoldenManifestRepository
{
    private const string SelectLatestForRunByContractManifestVersion = """
        SELECT TOP (1)
            TenantId, WorkspaceId, ProjectId,
            ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
            CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
            MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
            ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson,
            WarningsJson, ProvenanceJson, HasherBoundJson, ManifestPayloadBlobUri, ContractManifestVersion
        FROM dbo.GoldenManifests
        WHERE TenantId = @TenantId
          AND WorkspaceId = @WorkspaceId
          AND ProjectId = @ProjectId
          AND RunId = @RunId
          AND ContractManifestVersion COLLATE Latin1_General_CI_AI = @ManifestVersion
        ORDER BY CreatedUtc DESC;
        """;

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
    public Task<ManifestDocument?> GetByContractManifestVersionAsync(
        ScopeContext scope,
        string manifestVersion,
        CancellationToken ct) =>
        ReadByContractManifestVersionAsync(scope, manifestVersion, null, ct);

    /// <inheritdoc />
    public Task<ManifestDocument?> GetByRunAndContractManifestVersionAsync(
        ScopeContext scope,
        Guid runId,
        string manifestVersion,
        CancellationToken ct) =>
        ReadByContractManifestVersionAsync(scope, manifestVersion, runId, ct);

    private async Task<ManifestDocument?> ReadByContractManifestVersionAsync(
        ScopeContext scope,
        string manifestVersion,
        Guid? runId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (string.IsNullOrWhiteSpace(manifestVersion))
            throw new ArgumentException("Manifest version is required.", nameof(manifestVersion));

        string query = runId.HasValue
            ? SelectLatestForRunByContractManifestVersion
            : GoldenManifestReadSql.SelectLatestByContractManifestVersion;
        object parameters = runId.HasValue
            ? new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, RunId = runId.Value, ManifestVersion = manifestVersion }
            : GoldenManifestInsertParameters.ForContractManifestVersion(scope, manifestVersion);

        await using SqlConnection connection = await manifestLookupReadConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        GoldenManifestStorageRow? row = await connection.QuerySingleOrDefaultAsync<GoldenManifestStorageRow>(
            new CommandDefinition(
                query,
                parameters,
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
}
