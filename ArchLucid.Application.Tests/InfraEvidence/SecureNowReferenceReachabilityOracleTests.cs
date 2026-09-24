using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Application.Tests.InfraEvidence.ReferenceAssurance;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowReferenceReachabilityOracleTests
{
    [Fact]
    public void Production_reachability_matches_independent_brute_force_oracle_on_small_graph()
    {
        const string app = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app";
        const string sql = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql";
        const string vault = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv";

        Dictionary<string, List<PrivilegePathEdge>> productionOutgoing =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [SecureNowArchitectConstants.InternetPublicExposureNodeId] =
                [
                    Edge(
                        SecureNowArchitectConstants.InternetPublicExposureNodeId,
                        app,
                        GraphEdgeTypes.Exposes),
                ],
                [app] =
                [
                    Edge(app, sql, GraphEdgeTypes.ConnectsTo),
                    Edge(app, vault, GraphEdgeTypes.DependsOn),
                ],
            };

        InventoryReachabilityPathGraphSnapshot productionGraph = new()
        {
            OutgoingEdges = productionOutgoing,
            ResourcesByArmId = new Dictionary<string, AzureInventoryResourceRecord>(StringComparer.OrdinalIgnoreCase)
            {
                [app] = Resource(app, "Microsoft.Web/sites"),
                [sql] = Resource(sql, "Microsoft.Sql/servers"),
                [vault] = Resource(vault, "Microsoft.KeyVault/vaults"),
            },
        };

        IReadOnlyList<ReachabilityPathCandidate> production =
            IntendedReachabilityPathEnumerator.Enumerate(
                productionGraph,
                new PrivilegePathEngineOptions { MaxDepth = 5, MaxPaths = 20 });

        Dictionary<string, IReadOnlyList<(string ToNodeId, string EdgeType)>> oracleOutgoing =
            productionOutgoing.ToDictionary(
                pair => pair.Key,
                pair => (IReadOnlyList<(string ToNodeId, string EdgeType)>)pair.Value
                    .Select(static edge => (edge.ToNodeId, edge.EdgeType))
                    .ToList(),
                StringComparer.OrdinalIgnoreCase);

        HashSet<string> terminals = new(StringComparer.OrdinalIgnoreCase) { app, sql, vault };

        IReadOnlySet<string> expected = ReferenceReachabilityOracle.EnumeratePathSignatures(
            SecureNowArchitectConstants.InternetPublicExposureNodeId,
            oracleOutgoing,
            terminals,
            maxDepth: 5);

        HashSet<string> actual = production
            .Select(candidate => ReferenceReachabilityOracle.Signature(
                candidate.Hops.Select(static hop => (hop.FromNodeId, hop.EdgeType, hop.ToNodeId))))
            .ToHashSet(StringComparer.Ordinal);

        actual.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public void Production_reachability_matches_oracle_for_two_asset_branch()
    {
        const string app = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app";
        const string sql = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql";
        const string vault = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv";

        Dictionary<string, List<PrivilegePathEdge>> outgoing =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [SecureNowArchitectConstants.InternetPublicExposureNodeId] =
                [
                    Edge(SecureNowArchitectConstants.InternetPublicExposureNodeId, app, GraphEdgeTypes.Exposes),
                    Edge(SecureNowArchitectConstants.InternetPublicExposureNodeId, sql, GraphEdgeTypes.Exposes),
                ],
            };

        AssertMatchesOracle(
            outgoing,
            new Dictionary<string, AzureInventoryResourceRecord>(StringComparer.OrdinalIgnoreCase)
            {
                [app] = Resource(app, "Microsoft.Web/sites"),
                [sql] = Resource(sql, "Microsoft.Sql/servers"),
                [vault] = Resource(vault, "Microsoft.KeyVault/vaults"),
            },
            terminals: new HashSet<string>(StringComparer.OrdinalIgnoreCase) { app, sql });
    }

    [Fact]
    public void Production_reachability_and_oracle_stop_at_visited_nodes()
    {
        const string app = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app";
        const string sql = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql";

        Dictionary<string, List<PrivilegePathEdge>> outgoing =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [SecureNowArchitectConstants.InternetPublicExposureNodeId] =
                [
                    Edge(SecureNowArchitectConstants.InternetPublicExposureNodeId, app, GraphEdgeTypes.Exposes),
                ],
                [app] = [Edge(app, sql, GraphEdgeTypes.ConnectsTo)],
                [sql] = [Edge(sql, app, GraphEdgeTypes.ConnectsTo)],
            };

        AssertMatchesOracle(
            outgoing,
            new Dictionary<string, AzureInventoryResourceRecord>(StringComparer.OrdinalIgnoreCase)
            {
                [app] = Resource(app, "Microsoft.Web/sites"),
                [sql] = Resource(sql, "Microsoft.Sql/servers"),
            },
            terminals: new HashSet<string>(StringComparer.OrdinalIgnoreCase) { app, sql });
    }

    [Fact]
    public void Production_reachability_rejects_terminal_walk_without_exposure_edge()
    {
        const string app = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app";

        Dictionary<string, List<PrivilegePathEdge>> outgoing =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [SecureNowArchitectConstants.InternetPublicExposureNodeId] =
                [
                    Edge(SecureNowArchitectConstants.InternetPublicExposureNodeId, app, GraphEdgeTypes.ConnectsTo),
                ],
            };

        AssertMatchesOracle(
            outgoing,
            new Dictionary<string, AzureInventoryResourceRecord>(StringComparer.OrdinalIgnoreCase)
            {
                [app] = Resource(app, "Microsoft.Web/sites"),
            },
            terminals: new HashSet<string>(StringComparer.OrdinalIgnoreCase) { app },
            terminalPathPredicate: static path => path.Any(hop =>
                hop.EdgeType.Equals(GraphEdgeTypes.Exposes, StringComparison.OrdinalIgnoreCase)
                || hop.EdgeType.Equals(GraphEdgeTypes.RoutesTo, StringComparison.OrdinalIgnoreCase)
                || hop.EdgeType.Equals(
                    SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType,
                    StringComparison.OrdinalIgnoreCase)));
    }

    private static void AssertMatchesOracle(
        Dictionary<string, List<PrivilegePathEdge>> outgoing,
        Dictionary<string, AzureInventoryResourceRecord> resources,
        IReadOnlySet<string> terminals,
        Func<IReadOnlyList<(string FromNodeId, string EdgeType, string ToNodeId)>, bool>? terminalPathPredicate = null)
    {
        InventoryReachabilityPathGraphSnapshot productionGraph = new()
        {
            OutgoingEdges = outgoing,
            ResourcesByArmId = resources,
        };

        IReadOnlyList<ReachabilityPathCandidate> production =
            IntendedReachabilityPathEnumerator.Enumerate(
                productionGraph,
                new PrivilegePathEngineOptions { MaxDepth = 20, MaxPaths = 100 });

        Dictionary<string, IReadOnlyList<(string ToNodeId, string EdgeType)>> oracleOutgoing =
            outgoing.ToDictionary(
                pair => pair.Key,
                pair => (IReadOnlyList<(string ToNodeId, string EdgeType)>)pair.Value
                    .Select(static edge => (edge.ToNodeId, edge.EdgeType))
                    .ToList(),
                StringComparer.OrdinalIgnoreCase);

        IReadOnlySet<string> expected = ReferenceReachabilityOracle.EnumeratePathSignatures(
            SecureNowArchitectConstants.InternetPublicExposureNodeId,
            oracleOutgoing,
            terminals,
            maxDepth: 20,
            terminalPathPredicate: terminalPathPredicate);

        HashSet<string> actual = production
            .Select(candidate => ReferenceReachabilityOracle.Signature(
                candidate.Hops.Select(static hop => (hop.FromNodeId, hop.EdgeType, hop.ToNodeId))))
            .ToHashSet(StringComparer.Ordinal);

        actual.Should().BeEquivalentTo(expected);
    }

    private static PrivilegePathEdge Edge(string from, string to, string edgeType) =>
        new()
        {
            FromNodeId = from,
            ToNodeId = to,
            EdgeType = edgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };

    private static AzureInventoryResourceRecord Resource(string armId, string resourceType) =>
        new()
        {
            ResourceRowId = Guid.NewGuid(),
            AzureResourceId = armId,
            ResourceType = resourceType,
        };
}
