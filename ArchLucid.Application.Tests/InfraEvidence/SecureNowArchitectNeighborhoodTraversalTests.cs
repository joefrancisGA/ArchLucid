using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowArchitectNeighborhoodTraversalTests
{
    [Fact]
    public void Privilege_neighborhood_retains_incoming_identity_chain_and_does_not_spend_limit_on_unrelated_paths()
    {
        AzureInventoryResourceRecord unrelated = Resource("a-unrelated");
        AzureInventoryResourceRecord changed = Resource("z-changed");
        Dictionary<string, List<PrivilegePathEdge>> edges = new(StringComparer.OrdinalIgnoreCase)
        {
            ["principal:/a"] = [Edge("principal:/a", "role:/a", GraphEdgeTypes.HasRole)],
            ["role:/a"] = [Edge("role:/a", unrelated.AzureResourceId, GraphEdgeTypes.CanRead)],
            ["principal:/z"] = [Edge("principal:/z", "zz-group:/z", GraphEdgeTypes.MemberOf)],
            ["zz-group:/z"] = [Edge("zz-group:/z", "role:/z", GraphEdgeTypes.HasRole)],
            ["role:/z"] = [Edge("role:/z", changed.AzureResourceId, GraphEdgeTypes.CanRead)],
        };
        InventoryPrivilegePathGraphSnapshot graph = new()
        {
            OutgoingEdges = edges,
            ResourcesByArmId = Resources(unrelated, changed),
        };
        SecureNowArchitectEngineRunScope scope = SecureNowArchitectEngineRunScope.Neighborhood(
            new HashSet<Guid> { changed.CloudResourceId!.Value });
        PrivilegePathEngineOptions oneResult = new() { MaxPaths = 1 };

        PrivilegePathEnumerator.Enumerate(graph, oneResult).Single().TerminalCloudResourceId
            .Should().Be(unrelated.CloudResourceId);
        IReadOnlyList<PrivilegePathCandidate> actual = PrivilegePathEnumerator.Enumerate(graph, oneResult, scope);
        actual.Should().ContainSingle();
        actual[0].TerminalCloudResourceId.Should().Be(changed.CloudResourceId);

        PrivilegePathEngineOptions complete = new() { MaxPaths = 100, MaxFanOutPerNode = 100 };
        IReadOnlyDictionary<string, Guid> ids = Resources(unrelated, changed)
            .ToDictionary(pair => pair.Key, pair => pair.Value.CloudResourceId!.Value);
        IEnumerable<string> expected = PrivilegePathEnumerator.Enumerate(graph, complete)
            .Where(path => SecureNowArchitectNeighborhoodFilter.CandidateTouchesSeeds(path, scope.SeedCloudResourceIds, ids))
            .Select(path => Signature(path.Hops));
        PrivilegePathEnumerator.Enumerate(graph, complete, scope).Select(path => Signature(path.Hops))
            .Should().BeEquivalentTo(expected);
    }

    [Fact]
    public void Reachability_neighborhood_preserves_paths_after_the_seed_and_matches_full_search_subset()
    {
        AzureInventoryResourceRecord unrelated = Resource("a-unrelated");
        AzureInventoryResourceRecord changed = Resource("z-changed");
        AzureInventoryResourceRecord downstream = Resource("zz-downstream");
        string internet = SecureNowArchitectConstants.InternetPublicExposureNodeId;
        InventoryReachabilityPathGraphSnapshot graph = new()
        {
            OutgoingEdges = new Dictionary<string, List<PrivilegePathEdge>>(StringComparer.OrdinalIgnoreCase)
            {
                [internet] = [Edge(internet, unrelated.AzureResourceId, GraphEdgeTypes.Exposes),
                    Edge(internet, "gateway:/entry", GraphEdgeTypes.Exposes)],
                ["gateway:/entry"] = [Edge("gateway:/entry", changed.AzureResourceId, GraphEdgeTypes.RoutesTo)],
                [changed.AzureResourceId] = [Edge(changed.AzureResourceId, downstream.AzureResourceId, GraphEdgeTypes.CanRead)],
                [downstream.AzureResourceId] = [Edge(downstream.AzureResourceId, changed.AzureResourceId, GraphEdgeTypes.RoutesTo)],
            },
            ResourcesByArmId = Resources(unrelated, changed, downstream),
        };
        SecureNowArchitectEngineRunScope scope = SecureNowArchitectEngineRunScope.Neighborhood(
            new HashSet<Guid> { changed.CloudResourceId!.Value });
        // An unrelated first branch must not exhaust either the relevant fan-out or result limit.
        IReadOnlyList<ReachabilityPathCandidate> limited = IntendedReachabilityPathEnumerator.Enumerate(
            graph, new() { MaxPaths = 1, MaxFanOutPerNode = 1 }, scope);
        limited.Should().ContainSingle();
        limited[0].TerminalCloudResourceId.Should().Be(changed.CloudResourceId);

        PrivilegePathEngineOptions complete = new() { MaxPaths = 100, MaxFanOutPerNode = 100 };
        IReadOnlyDictionary<string, Guid> ids = graph.ResourcesByArmId
            .ToDictionary(pair => pair.Key, pair => pair.Value.CloudResourceId!.Value);
        IEnumerable<string> expected = IntendedReachabilityPathEnumerator.Enumerate(graph, complete)
            .Where(path => SecureNowArchitectNeighborhoodFilter.CandidateTouchesSeeds(path, scope.SeedCloudResourceIds, ids))
            .Select(path => Signature(path.Hops));
        IReadOnlyList<ReachabilityPathCandidate> actual = IntendedReachabilityPathEnumerator.Enumerate(graph, complete, scope);
        actual.Select(path => Signature(path.Hops)).Should().BeEquivalentTo(expected);
        actual.Should().Contain(path => path.TerminalCloudResourceId == downstream.CloudResourceId);
        IntendedReachabilityPathEnumerator.Enumerate(graph, complete,
            SecureNowArchitectEngineRunScope.Neighborhood(new HashSet<Guid>())).Should().BeEmpty();
    }

    [Fact]
    public void Neighborhood_retains_inherited_role_scopes_for_synthetic_data_plane_hops()
    {
        AzureInventoryResourceRecord changed = Resource("changed");
        const string subscription = "/subscriptions/sub";
        Dictionary<string, List<PrivilegePathEdge>> edges = new(StringComparer.OrdinalIgnoreCase)
        {
            ["principal:/owner"] =
            [
                new PrivilegePathEdge
                {
                    FromNodeId = "principal:/owner", ToNodeId = subscription, EdgeType = GraphEdgeTypes.CanGrantRole,
                    ProvenanceKind = ProvenanceKind.DerivedFact,
                    InferenceSource = GraphEdgeInferenceSources.WithQualifier(GraphEdgeInferenceSources.InventoryGrantRole,
                        AzureInventoryGrantRoleInferenceQualifiers.GlobalAdminElevation),
                },
            ],
        };
        SecureNowArchitectTraversalNeighborhood neighborhood = new(edges, Resources(changed),
            new HashSet<Guid> { changed.CloudResourceId!.Value }, 8);
        neighborhood.CanReachSeed(subscription).Should().BeTrue();
        neighborhood.CanReachSeed("principal:/owner").Should().BeTrue();
        neighborhood.TouchesSeed(subscription).Should().BeFalse();
        InventoryPrivilegePathGraphSnapshot graph = new()
        {
            OutgoingEdges = edges, ResourcesByArmId = Resources(changed),
        };
        IReadOnlyList<PrivilegePathCandidate> actual = PrivilegePathEnumerator.Enumerate(graph, new(),
            SecureNowArchitectEngineRunScope.Neighborhood(new HashSet<Guid> { changed.CloudResourceId.Value }));
        actual.Should().ContainSingle();
        actual[0].TerminalCloudResourceId.Should().Be(changed.CloudResourceId);
        actual[0].Hops.Should().Contain(hop => hop.EdgeType == GraphEdgeTypes.CanWrite);
    }

    private static string Signature(IReadOnlyList<PrivilegePathEdge> hops) =>
        string.Join(">", hops.Select(hop => $"{hop.FromNodeId}|{hop.EdgeType}|{hop.ToNodeId}"));

    private static PrivilegePathEdge Edge(string from, string to, string type) => new()
    {
        FromNodeId = from, ToNodeId = to, EdgeType = type, ProvenanceKind = ProvenanceKind.ObservedFact,
    };

    private static AzureInventoryResourceRecord Resource(string name) => new()
    {
        ResourceRowId = Guid.NewGuid(), CloudResourceId = Guid.NewGuid(),
        AzureResourceId = $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/{name}",
        ResourceType = "Microsoft.Storage/storageAccounts",
    };

    private static Dictionary<string, AzureInventoryResourceRecord> Resources(params AzureInventoryResourceRecord[] resources) =>
        resources.ToDictionary(resource => resource.AzureResourceId, StringComparer.OrdinalIgnoreCase);

    [Fact]
    public void Legacy_seed_suffix_index_matches_prefixed_nodes_without_scanning_every_seed()
    {
        AzureInventoryResourceRecord changed = Resource("z-changed");
        string seedArmId = changed.AzureResourceId;
        SecureNowArchitectLegacySeedSuffixIndex index = new([seedArmId]);

        index.MatchesLegacyPrefixedNode($"legacy-prefix:{seedArmId}").Should().BeTrue();
        index.MatchesLegacyPrefixedNode("storageAccounts/z-changed").Should().BeTrue();
        index.MatchesLegacyPrefixedNode("unrelated-node").Should().BeFalse();
    }
}
