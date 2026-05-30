using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.GraphSnapshots;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.GraphSnapshots;

/// <summary>
///     Direct coverage for <see cref="GraphSnapshotRelationalRead.HydrateAsync" /> when edge metadata is fully relational
///     (<c>dbo.GraphSnapshotEdgeProperties</c> populated, no JSON merge path).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "Core")]
public sealed class GraphSnapshotRelationalReadDirectSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task HydrateAsync_loads_edge_label_and_properties_from_relational_tables()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid scopeProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid nodeRowId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 4, 14, 15, 30, 0, DateTimeKind.Utc);

        await AuthorityRunChainTestSeed.SeedRunAndContextOnlyAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            runId,
            contextId,
            "proj-graph-rel-read",
            CancellationToken.None);

        string emptyListEdges = JsonEntitySerializer.Serialize(new List<GraphEdge>());

        const string insertHeader = """
                                    INSERT INTO dbo.GraphSnapshots
                                    (
                                        GraphSnapshotId, ContextSnapshotId, RunId, TenantId, WorkspaceId, ScopeProjectId, CreatedUtc,
                                        NodesJson, EdgesJson, WarningsJson
                                    )
                                    VALUES
                                    (
                                        @GraphSnapshotId, @ContextSnapshotId, @RunId, @TenantId, @WorkspaceId, @ScopeProjectId, @CreatedUtc,
                                        @NodesJson, @EdgesJson, @WarningsJson
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
                    ScopeProjectId = scopeProjectId,
                    CreatedUtc = createdUtc,
                    NodesJson = JsonEntitySerializer.Serialize(new List<GraphNode>()),
                    EdgesJson = emptyListEdges,
                    WarningsJson = JsonEntitySerializer.Serialize(new List<string>())
                },
                cancellationToken: CancellationToken.None));

        await GraphSnapshotRelationalTestInsertSupport.InsertNodeAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            nodeRowId,
            graphId,
            0,
            "n-rel",
            "Service",
            "NodeLabel",
            "cat",
            "src",
            "id1",
            CancellationToken.None);

        await GraphSnapshotRelationalTestInsertSupport.InsertNodePropertyAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            nodeRowId,
            0,
            "nk",
            "nv",
            CancellationToken.None);

        await GraphSnapshotRelationalTestInsertSupport.InsertEdgeAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            graphId,
            "e-rel",
            "n-rel",
            "n-other",
            "USES",
            1.5d,
            CancellationToken.None);

        await GraphSnapshotRelationalTestInsertSupport.InsertEdgePropertyAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            graphId,
            "e-rel",
            0,
            GraphSnapshotEdgeRelationalConstants.StoredLabelPropertyKey,
            "edge-label-relational",
            CancellationToken.None);

        await GraphSnapshotRelationalTestInsertSupport.InsertEdgePropertyAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            graphId,
            "e-rel",
            1,
            "epk",
            "epv",
            CancellationToken.None);

        const string selectRow = """
                                 SELECT
                                     GraphSnapshotId, ContextSnapshotId, RunId, CreatedUtc,
                                     NodesJson, EdgesJson, WarningsJson
                                 FROM dbo.GraphSnapshots
                                 WHERE GraphSnapshotId = @GraphSnapshotId;
                                 """;

        GraphSnapshotStorageRow? row = await connection.QuerySingleOrDefaultAsync<GraphSnapshotStorageRow>(
            new CommandDefinition(selectRow, new { GraphSnapshotId = graphId },
                cancellationToken: CancellationToken.None));

        row.Should().NotBeNull();

        GraphSnapshot snapshot =
            await GraphSnapshotRelationalRead.HydrateAsync(connection, null, row, CancellationToken.None);

        snapshot.Nodes.Should().ContainSingle();
        snapshot.Nodes[0].NodeId.Should().Be("n-rel");
        snapshot.Nodes[0].Properties.Should().ContainKey("nk").WhoseValue.Should().Be("nv");

        snapshot.Edges.Should().ContainSingle();
        GraphEdge edge = snapshot.Edges[0];
        edge.EdgeId.Should().Be("e-rel");
        edge.Label.Should().Be("edge-label-relational");
        edge.Properties.Should().ContainKey("epk").WhoseValue.Should().Be("epv");
        edge.Weight.Should().Be(1.5d);
    }

    [SkippableFact]
    public async Task HydrateAsync_prefers_relational_warnings_over_WarningsJson()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid scopeProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 4, 15, 12, 0, 0, DateTimeKind.Utc);

        await AuthorityRunChainTestSeed.SeedRunAndContextOnlyAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            runId,
            contextId,
            "proj-graph-warnings-rel",
            CancellationToken.None);

        List<string> jsonWarnings = ["json-warning-should-lose"];
        string emptyNodes = JsonEntitySerializer.Serialize(new List<GraphNode>());
        string emptyEdges = JsonEntitySerializer.Serialize(new List<GraphEdge>());

        const string insertHeader = """
                                    INSERT INTO dbo.GraphSnapshots
                                    (
                                        GraphSnapshotId, ContextSnapshotId, RunId, TenantId, WorkspaceId, ScopeProjectId, CreatedUtc,
                                        NodesJson, EdgesJson, WarningsJson
                                    )
                                    VALUES
                                    (
                                        @GraphSnapshotId, @ContextSnapshotId, @RunId, @TenantId, @WorkspaceId, @ScopeProjectId, @CreatedUtc,
                                        @NodesJson, @EdgesJson, @WarningsJson
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
                    ScopeProjectId = scopeProjectId,
                    CreatedUtc = createdUtc,
                    NodesJson = emptyNodes,
                    EdgesJson = emptyEdges,
                    WarningsJson = JsonEntitySerializer.Serialize(jsonWarnings)
                },
                cancellationToken: CancellationToken.None));

        await GraphSnapshotRelationalTestInsertSupport.InsertWarningAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            graphId,
            0,
            "relational-graph-warning",
            CancellationToken.None);

        const string selectRow = """
                                 SELECT
                                     GraphSnapshotId, ContextSnapshotId, RunId, CreatedUtc,
                                     NodesJson, EdgesJson, WarningsJson
                                 FROM dbo.GraphSnapshots
                                 WHERE GraphSnapshotId = @GraphSnapshotId;
                                 """;

        GraphSnapshotStorageRow? row = await connection.QuerySingleOrDefaultAsync<GraphSnapshotStorageRow>(
            new CommandDefinition(selectRow, new { GraphSnapshotId = graphId },
                cancellationToken: CancellationToken.None));

        row.Should().NotBeNull();

        GraphSnapshot snapshot =
            await GraphSnapshotRelationalRead.HydrateAsync(connection, null, row, CancellationToken.None);

        snapshot.Warnings.Should().Equal("relational-graph-warning");
    }

    [SkippableFact]
    public async Task HydrateAsync_merges_edge_label_and_properties_from_EdgesJson_when_edge_properties_table_empty()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        await using SqlConnection connection = await factory.CreateOpenConnectionAsync(CancellationToken.None);

        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid scopeProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 4, 15, 13, 0, 0, DateTimeKind.Utc);

        await AuthorityRunChainTestSeed.SeedRunAndContextOnlyAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            runId,
            contextId,
            "proj-graph-json-merge",
            CancellationToken.None);

        List<GraphEdge> jsonEdges =
        [
            new()
            {
                EdgeId = "e-merge",
                FromNodeId = "a",
                ToNodeId = "b",
                EdgeType = "REL",
                Weight = 2d,
                Label = "label-from-json",
                Properties = new Dictionary<string, string>(StringComparer.Ordinal) { ["jk"] = "jv" }
            }
        ];

        string edgesJson = JsonEntitySerializer.Serialize(jsonEdges);
        string emptyNodes = JsonEntitySerializer.Serialize(new List<GraphNode>());
        string emptyWarnings = JsonEntitySerializer.Serialize(new List<string>());

        const string insertHeader = """
                                    INSERT INTO dbo.GraphSnapshots
                                    (
                                        GraphSnapshotId, ContextSnapshotId, RunId, TenantId, WorkspaceId, ScopeProjectId, CreatedUtc,
                                        NodesJson, EdgesJson, WarningsJson
                                    )
                                    VALUES
                                    (
                                        @GraphSnapshotId, @ContextSnapshotId, @RunId, @TenantId, @WorkspaceId, @ScopeProjectId, @CreatedUtc,
                                        @NodesJson, @EdgesJson, @WarningsJson
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
                    ScopeProjectId = scopeProjectId,
                    CreatedUtc = createdUtc,
                    NodesJson = emptyNodes,
                    EdgesJson = edgesJson,
                    WarningsJson = emptyWarnings
                },
                cancellationToken: CancellationToken.None));

        await GraphSnapshotRelationalTestInsertSupport.InsertEdgeAsync(
            connection,
            tenantId,
            workspaceId,
            scopeProjectId,
            graphId,
            "e-merge",
            "a",
            "b",
            "REL",
            2d,
            CancellationToken.None);

        const string selectRow = """
                                 SELECT
                                     GraphSnapshotId, ContextSnapshotId, RunId, CreatedUtc,
                                     NodesJson, EdgesJson, WarningsJson
                                 FROM dbo.GraphSnapshots
                                 WHERE GraphSnapshotId = @GraphSnapshotId;
                                 """;

        GraphSnapshotStorageRow? row = await connection.QuerySingleOrDefaultAsync<GraphSnapshotStorageRow>(
            new CommandDefinition(selectRow, new { GraphSnapshotId = graphId },
                cancellationToken: CancellationToken.None));

        row.Should().NotBeNull();

        GraphSnapshot snapshot =
            await GraphSnapshotRelationalRead.HydrateAsync(connection, null, row, CancellationToken.None);

        snapshot.Edges.Should().ContainSingle();
        GraphEdge edge = snapshot.Edges[0];
        edge.EdgeId.Should().Be("e-merge");
        edge.Label.Should().Be("label-from-json");
        edge.Properties.Should().ContainKey("jk").WhoseValue.Should().Be("jv");
        edge.Weight.Should().Be(2d);
    }
}
