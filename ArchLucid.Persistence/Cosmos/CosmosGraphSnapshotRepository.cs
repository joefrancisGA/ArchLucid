using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Net;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;

using Microsoft.Azure.Cosmos;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>Cosmos-backed <see cref="IGraphSnapshotRepository" /> (single document per snapshot).</summary>
[ExcludeFromCodeCoverage(Justification = "Requires Cosmos account or emulator.")]
public sealed class CosmosGraphSnapshotRepository(
    CosmosClientFactory clientFactory,
    IScopeContextProvider scopeContextProvider) : IGraphSnapshotRepository
{
    private const string ContainerId = "graph-snapshots";

    private readonly CosmosClientFactory _clientFactory =
        clientFactory ?? throw new ArgumentNullException(nameof(clientFactory));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc />
    public async Task SaveAsync(
        GraphSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        if (connection is not null || transaction is not null)
            throw new InvalidOperationException(
                "Cosmos graph snapshots cannot participate in SQL transactions. "
                + "Ensure CosmosDb:GraphSnapshotsEnabled is coordinated with AuthorityPipelineStagesExecutor (non-transactional save), "
                + "or disable Cosmos graph snapshots.");

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        GraphSnapshotDocument doc = ToDocument(snapshot, scope);
        await container.UpsertItemAsync(doc, new PartitionKey(doc.GraphSnapshotId), cancellationToken: ct);
    }

    /// <inheritdoc />
    public Task<GraphSnapshot?> GetByIdAsync(ScopeContext scope, Guid graphSnapshotId, CancellationToken ct) =>
        GetByIdCoreAsync(scope, graphSnapshotId, ct);

    private async Task<GraphSnapshot?> GetByIdCoreAsync(ScopeContext scope, Guid graphSnapshotId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string pk = graphSnapshotId.ToString("D");
        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);

        try
        {
            ItemResponse<GraphSnapshotDocument> response = await container.ReadItemAsync<GraphSnapshotDocument>(
                graphSnapshotId.ToString("D"),
                new PartitionKey(pk),
                cancellationToken: ct);

            if (!CosmosGraphSnapshotScopeFilter.DocumentMatchesScope(scope, response.Resource))
                return null;

            return FromDocument(response.Resource);
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    /// <inheritdoc />
    public async Task<GraphSnapshot?> GetLatestByContextSnapshotIdAsync(
        ScopeContext scope,
        Guid contextSnapshotId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        string ctx = contextSnapshotId.ToString("D");

        string sql = scope.TenantId == Guid.Empty
            ? """
              SELECT * FROM c
              WHERE c.contextSnapshotId = @ctx
              ORDER BY c.createdUtc DESC
              """
            : """
              SELECT * FROM c
              WHERE c.contextSnapshotId = @ctx
                AND c.tenantId = @tenantId
                AND c.workspaceId = @workspaceId
                AND c.projectId = @projectId
              ORDER BY c.createdUtc DESC
              """;

        QueryDefinition query = new QueryDefinition(sql).WithParameter("@ctx", ctx);

        if (scope.TenantId != Guid.Empty)
        {
            query = query
                .WithParameter("@tenantId", scope.TenantId.ToString("D"))
                .WithParameter("@workspaceId", scope.WorkspaceId.ToString("D"))
                .WithParameter("@projectId", scope.ProjectId.ToString("D"));
        }

        using FeedIterator<GraphSnapshotDocument> iterator = container.GetItemQueryIterator<GraphSnapshotDocument>(
            query,
            requestOptions: new QueryRequestOptions { MaxItemCount = 1 });

        if (!iterator.HasMoreResults)
            return null;

        FeedResponse<GraphSnapshotDocument> page = await iterator.ReadNextAsync(ct);
        GraphSnapshotDocument? doc = page.Resource.FirstOrDefault();

        return doc is null ? null : FromDocument(doc);
    }

    public async Task<IReadOnlyList<GraphSnapshotIndexedEdge>> ListIndexedEdgesAsync(Guid graphSnapshotId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        GraphSnapshot? snapshot = await GetByIdCoreAsync(scope, graphSnapshotId, ct);

        if (snapshot is null)
            return [];

        return GraphSnapshotEdgeIndexer
            .BuildRows(snapshot)
            .Select(r => new GraphSnapshotIndexedEdge(r.EdgeId, r.FromNodeId, r.ToNodeId, r.EdgeType, r.Weight))
            .ToList();
    }

    private static GraphSnapshotDocument ToDocument(GraphSnapshot snapshot, ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string gid = snapshot.GraphSnapshotId.ToString("D");

        return new GraphSnapshotDocument
        {
            Id = gid,
            GraphSnapshotId = gid,
            ContextSnapshotId = snapshot.ContextSnapshotId.ToString("D"),
            RunId = snapshot.RunId.ToString("D"),
            SchemaVersion = snapshot.SchemaVersion,
            CreatedUtc = snapshot.CreatedUtc.ToUniversalTime().ToString("o", CultureInfo.InvariantCulture),
            NodesJson = JsonEntitySerializer.Serialize(snapshot.Nodes),
            EdgesJson = JsonEntitySerializer.Serialize(snapshot.Edges),
            WarningsJson = JsonEntitySerializer.Serialize(snapshot.Warnings),
            TenantId = scope.TenantId.ToString("D"),
            WorkspaceId = scope.WorkspaceId.ToString("D"),
            ProjectId = scope.ProjectId.ToString("D")
        };
    }

    private static GraphSnapshot FromDocument(GraphSnapshotDocument d)
    {
        List<GraphNode> nodes = JsonEntitySerializer.Deserialize<List<GraphNode>>(d.NodesJson);
        List<GraphEdge> edges = JsonEntitySerializer.Deserialize<List<GraphEdge>>(d.EdgesJson);
        List<string> warnings = JsonEntitySerializer.Deserialize<List<string>>(d.WarningsJson);

        return new GraphSnapshot
        {
            SchemaVersion = d.SchemaVersion,
            GraphSnapshotId = Guid.Parse(d.GraphSnapshotId),
            ContextSnapshotId = Guid.Parse(d.ContextSnapshotId),
            RunId = Guid.Parse(d.RunId),
            CreatedUtc = DateTime.Parse(d.CreatedUtc, null, DateTimeStyles.RoundtripKind).ToUniversalTime(),
            Nodes = nodes,
            Edges = edges,
            Warnings = warnings
        };
    }
}
