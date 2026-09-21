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
