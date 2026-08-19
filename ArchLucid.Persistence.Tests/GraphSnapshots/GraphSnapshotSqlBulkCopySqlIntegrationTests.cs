using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.GraphSnapshots;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.GraphSnapshots;

/// <summary>
///     Direct coverage for <see cref="GraphSnapshotSqlBulkCopy" /> (SQL bulk inserts).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "Core")]
public sealed class GraphSnapshotSqlBulkCopySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Bulk_copy_writes_nodes_and_edges_correctly()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid scopeProjectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();

        await AuthorityRunChainTestSeed.SeedRunAndContextOnlyAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            runId,
            contextId,
            "proj-graph-bulk",
            CancellationToken.None);

        const string insertHeader = """
                                    INSERT INTO dbo.GraphSnapshots
                                    (
                                        GraphSnapshotId, ContextSnapshotId, RunId, TenantId, WorkspaceId, ScopeProjectId, CreatedUtc,
                                        NodesJson, EdgesJson, WarningsJson
                                    )
                                    VALUES
                                    (
                                        @GraphSnapshotId, @ContextSnapshotId, @RunId, @TenantId, @WorkspaceId, @ScopeProjectId, SYSUTCDATETIME(),
                                        '[]', '[]', '[]'
                                    );
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertHeader,
                new
                {
                    GraphSnapshotId = graphId,
                    ContextSnapshotId = contextId,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = scopeProjectId
                },
                cancellationToken: CancellationToken.None));

        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = graphId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "n-1",
                    NodeType = "Container",
                    Label = "App",
                    Category = "Compute",
                    SourceType = "Terraform",
                    SourceId = "app-id",
                    Properties = new Dictionary<string, string> { ["k1"] = "v1" }
                }
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e-1",
                    FromNodeId = "n-1",
                    ToNodeId = "n-2",
                    EdgeType = "CALLS",
                    Weight = 1.0,
                    Label = "HTTP",
                    Properties = new Dictionary<string, string> { ["k2"] = "v2" }
                }
            ],
            Warnings = ["warn-1", "warn-2"]
        };

        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = scopeProjectId };
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync();

        try
        {
            var plannedNodes = GraphSnapshotSqlBulkCopy.PlanNodeRows(snapshot);
            
            await GraphSnapshotSqlBulkCopy.CopyNodeRowsAsync(connection, tran, snapshot, scope, plannedNodes, CancellationToken.None);
            await GraphSnapshotSqlBulkCopy.CopyNodePropertyRowsAsync(connection, tran, scope, plannedNodes, CancellationToken.None);

            var edgeRows = snapshot.Edges.Select(e => new GraphSnapshotEdgeRow(
                snapshot.GraphSnapshotId,
                e.EdgeId,
                e.FromNodeId,
                e.ToNodeId,
                e.EdgeType,
                e.Weight
            )).ToList();

            await GraphSnapshotSqlBulkCopy.CopyIndexedEdgeRowsAsync(connection, tran, edgeRows, scope, CancellationToken.None);
            await GraphSnapshotSqlBulkCopy.CopyEdgePropertyRowsAsync(connection, tran, snapshot, scope, CancellationToken.None);
            
            await GraphSnapshotSqlBulkCopy.CopyWarningRowsAsync(connection, tran, graphId, snapshot.Warnings, scope, CancellationToken.None);

            await tran.CommitAsync();
        }
        catch
        {
            await tran.RollbackAsync();
            throw;
        }

        // Verify Nodes
        var nodes = (await connection.QueryAsync("SELECT * FROM dbo.GraphSnapshotNodes WHERE GraphSnapshotId = @graphId", new { graphId })).ToList();
        nodes.Should().ContainSingle();
        Assert.Equal("n-1", nodes[0].NodeId);
        Assert.Equal("Container", nodes[0].NodeType);

        // Verify Node Properties (scope to this snapshot — shared container DB retains rows from other tests)
        const string selectNodePropsForSnapshot = """
                                                  SELECT p.*
                                                  FROM dbo.GraphSnapshotNodeProperties AS p
                                                  INNER JOIN dbo.GraphSnapshotNodes AS n ON p.GraphNodeRowId = n.GraphNodeRowId
                                                  WHERE n.GraphSnapshotId = @graphId;
                                                  """;
        List<dynamic> nodeProps = (await connection.QueryAsync(selectNodePropsForSnapshot, new { graphId })).ToList();
        nodeProps.Should().ContainSingle();
        Assert.Equal("k1", nodeProps[0].PropertyKey);
        Assert.Equal("v1", nodeProps[0].PropertyValue);

        // Verify Edges
        var edges = (await connection.QueryAsync("SELECT * FROM dbo.GraphSnapshotEdges WHERE GraphSnapshotId = @graphId", new { graphId })).ToList();
        edges.Should().ContainSingle();
        Assert.Equal("e-1", edges[0].EdgeId);

        // Verify Edge Properties
        var edgeProps = (await connection.QueryAsync("SELECT * FROM dbo.GraphSnapshotEdgeProperties WHERE GraphSnapshotId = @graphId", new { graphId })).ToList();
        edgeProps.Should().HaveCount(2); // One for Label, one for k2

        // Verify Warnings
        var warnings = (await connection.QueryAsync("SELECT * FROM dbo.GraphSnapshotWarnings WHERE GraphSnapshotId = @graphId ORDER BY SortOrder", new { graphId })).ToList();
        warnings.Should().HaveCount(2);
        Assert.Equal("warn-1", warnings[0].WarningText);
        Assert.Equal("warn-2", warnings[1].WarningText);
    }
}