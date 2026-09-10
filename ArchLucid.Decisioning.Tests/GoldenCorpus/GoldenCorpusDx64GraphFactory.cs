using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

internal static class GoldenCorpusDx64GraphFactory
{
    internal static readonly Guid RunId = Guid.Parse("20000000-0000-4000-8000-000000000064");
    internal static readonly Guid ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000064");
    internal static readonly Guid CurrentGraphSnapshotId = Guid.Parse("00000064-0000-4000-8000-000000000064");
    internal static readonly Guid PriorRunId = Guid.Parse("20000000-0000-4000-8000-000000000065");
    internal static readonly Guid PriorGraphSnapshotId = Guid.Parse("00000065-0000-4000-8000-000000000064");

    internal static GraphSnapshot CreateCurrentGraph(bool includeReplica)
    {
        return BuildGraph(
            RunId,
            ContextSnapshotId,
            CurrentGraphSnapshotId,
            includeReplica,
            "ctx-golden-64",
            "sql-prod-64");
    }

    internal static GraphSnapshot CreatePriorGraph(bool includeReplica)
    {
        return BuildGraph(
            PriorRunId,
            ContextSnapshotId,
            PriorGraphSnapshotId,
            includeReplica,
            "ctx-golden-64-prior",
            "sql-prod-64");
    }

    internal static GoldenCorpusPriorGraphFixtureDocument CreatePriorFixture()
    {
        return new GoldenCorpusPriorGraphFixtureDocument
        {
            PriorRunId = PriorRunId,
            PriorGraphSnapshotId = PriorGraphSnapshotId,
            PriorGraphSnapshot = CreatePriorGraph(includeReplica: true),
        };
    }

    private static GraphSnapshot BuildGraph(
        Guid runId,
        Guid contextSnapshotId,
        Guid graphSnapshotId,
        bool includeReplica,
        string contextNodeId,
        string sqlNodeId)
    {
        Dictionary<string, string> sqlProperties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["terraformType"] = "azurerm_mssql_database",
        };

        if (includeReplica)
        {
            sqlProperties["geo_redundant"] = "enabled";
        }

        return new GraphSnapshot
        {
            SchemaVersion = 1,
            GraphSnapshotId = graphSnapshotId,
            ContextSnapshotId = contextSnapshotId,
            RunId = runId,
            CreatedUtc = new DateTime(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = contextNodeId,
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                },
                new GraphNode
                {
                    NodeId = sqlNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "prod-sql",
                    Category = "datastore",
                    Properties = sqlProperties,
                },
            ],
            Edges = [],
            Warnings = [],
        };
    }
}
