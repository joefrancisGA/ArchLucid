using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Application.Tests.InfraEvidence.ReferenceAssurance;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowReferencePrivilegePathOracleTests
{
    [Fact]
    public void Production_privilege_paths_match_oracle_for_one_write_path()
    {
        const string principal = "principal:/user";
        const string role = "role:/contributor";
        const string resource = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa";

        Dictionary<string, List<PrivilegePathEdge>> outgoing =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [principal] = [Edge(principal, role, GraphEdgeTypes.HasRole)],
                [role] = [Edge(role, resource, GraphEdgeTypes.CanWrite)],
            };

        AssertMatchesOracle(outgoing, resource);
    }

    [Fact]
    public void Production_privilege_paths_match_oracle_for_two_terminal_resources()
    {
        const string principal = "principal:/user";
        const string role = "role:/reader";
        const string firstResource = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa";
        const string secondResource = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv";

        Dictionary<string, List<PrivilegePathEdge>> outgoing =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [principal] = [Edge(principal, role, GraphEdgeTypes.HasRole)],
                [role] =
                [
                    Edge(role, firstResource, GraphEdgeTypes.CanRead),
                    Edge(role, secondResource, GraphEdgeTypes.CanRead),
                ],
            };

        AssertMatchesOracle(outgoing, firstResource, secondResource);
    }

    [Fact]
    public void Production_privilege_paths_and_oracle_stop_at_a_cycle()
    {
        const string principal = "principal:/user";
        const string role = "role:/reader";
        const string resource = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa";

        Dictionary<string, List<PrivilegePathEdge>> outgoing =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [principal] = [Edge(principal, role, GraphEdgeTypes.HasRole)],
                [role] =
                [
                    Edge(role, resource, GraphEdgeTypes.CanRead),
                    Edge(role, principal, GraphEdgeTypes.MemberOf),
                ],
            };

        AssertMatchesOracle(outgoing, resource);
    }

    [Fact]
    public void Production_privilege_paths_reject_action_without_identity_or_role()
    {
        const string principal = "principal:/user";
        const string resource = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa";

        Dictionary<string, List<PrivilegePathEdge>> outgoing =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [principal] = [Edge(principal, resource, GraphEdgeTypes.CanRead)],
            };

        AssertMatchesOracle(outgoing, resource);
    }

    private static void AssertMatchesOracle(
        Dictionary<string, List<PrivilegePathEdge>> outgoing,
        params string[] resources)
    {
        InventoryPrivilegePathGraphSnapshot productionGraph = new()
        {
            OutgoingEdges = outgoing,
            ResourcesByArmId = resources.ToDictionary(
                resource => resource,
                resource => Resource(resource),
                StringComparer.OrdinalIgnoreCase),
        };

        IReadOnlyList<PrivilegePathCandidate> production =
            PrivilegePathEnumerator.Enumerate(
                productionGraph,
                new PrivilegePathEngineOptions { MaxDepth = 20, MaxPaths = 100 });

        Dictionary<string, IReadOnlyList<(string ToNodeId, string EdgeType)>> oracleOutgoing =
            outgoing.ToDictionary(
                pair => pair.Key,
                pair => (IReadOnlyList<(string ToNodeId, string EdgeType)>)pair.Value
                    .Select(static edge => (edge.ToNodeId, edge.EdgeType))
                    .ToList(),
                StringComparer.OrdinalIgnoreCase);

        IReadOnlySet<string> expected = ReferencePrivilegePathOracle.EnumeratePathSignatures(
            "principal:/user",
            oracleOutgoing,
            maxDepth: 20);

        HashSet<string> actual = production
            .Select(candidate => ReferencePrivilegePathOracle.Signature(
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

    private static AzureInventoryResourceRecord Resource(string armId) =>
        new()
        {
            ResourceRowId = Guid.NewGuid(),
            AzureResourceId = armId,
            ResourceType = "Microsoft.Storage/storageAccounts",
        };
}
