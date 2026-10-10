using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventoryMultiRoleTests
{
    private const string Principal = "aaaaaaaa-1111-1111-1111-111111111111";
    private const string Target = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.storage/storageaccounts/storage";
    private const string Workload = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.compute/virtualmachines/vm";
    private const string Owner = "8e3af657-a8ff-443c-a75c-2fe8c4bcb635";
    private const string Contributor = "b24988ac-6180-42a0-ab88-20f7382dd24c";
    private static readonly Guid Row = Guid.Parse("00000000-0000-0000-0000-000000000001");

    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public void Roles_with_identical_actions_have_distinct_paths_and_persisted_hashes(bool reverse, bool relationshipPresent)
    {
        var snapshot = Snapshot(reverse ? [Contributor, Owner] : [Owner, Contributor], relationshipPresent);
        var graph = InventoryPrivilegePathGraph.Build(snapshot);
        var paths = PrivilegePathEnumerator.Enumerate(graph, new());
        Assert.Equal(2, paths.Count);
        Assert.All(paths, path => Assert.Equal(GraphEdgeTypes.CanWrite, path.Hops[^1].EdgeType));
        Assert.Equal(new[] { "Contributor", "Owner" }, paths.Select(path => path.EffectiveRoleName).OrderBy(name => name).ToArray());
        var records = paths.Select(path => PrivilegePathMaterializer.BuildHopRecords(Guid.NewGuid(), Guid.NewGuid(), Guid.Empty, path.Hops)).ToArray();
        Assert.Equal(2, records.Select(hops => Convert.ToHexString(SecurityEvidencePathCanonicalHash.ComputeSha256(hops))).Distinct().Count());
        Assert.All(records, hops => Assert.Contains(":role-definition:", Assert.Single(hops, hop => hop.EdgeType == GraphEdgeTypes.HasRole).EvidenceReference));
    }

    [Fact]
    public void Case_and_whitespace_duplicate_assignments_and_relationships_do_not_duplicate_paths()
    {
        var snapshot = Snapshot([Owner, "  " + Owner.ToUpperInvariant() + "  "], true);
        snapshot = new() { Resources = snapshot.Resources, Properties = snapshot.Properties,
            RoleAssignments = [snapshot.RoleAssignments[0], new() { PrincipalId = " " + Principal.ToUpperInvariant() + " ", Scope = " " + Target.ToUpperInvariant() + " ", RoleDefinitionId = snapshot.RoleAssignments[1].RoleDefinitionId }],
            Relationships = [snapshot.Relationships[0], snapshot.Relationships[0]] };
        var graph = InventoryPrivilegePathGraph.Build(snapshot);
        Assert.Single(graph.OutgoingEdges.Values.SelectMany(edges => edges), edge => edge.EdgeType == GraphEdgeTypes.HasRole);
        Assert.Single(PrivilegePathEnumerator.Enumerate(graph, new()));
        Assert.Single(Hydrate(snapshot));
    }

    [Fact]
    public void Different_unknown_roles_are_retained_as_insufficient_evidence_without_guessed_actions()
    {
        var graph = InventoryPrivilegePathGraph.Build(Snapshot(["custom-one", "custom-two"], true));
        var paths = PrivilegePathEnumerator.Enumerate(graph, new());
        Assert.Equal(2, paths.Count);
        Assert.All(paths, path =>
        {
            Assert.True(path.HasInsufficientEvidenceHop);
            Assert.Null(path.EffectiveRoleName);
            Assert.Equal("unknown-role-actions", path.Hops[^1].EdgeType);
            Assert.DoesNotContain(path.Hops, hop => hop.EdgeType is GraphEdgeTypes.CanRead or GraphEdgeTypes.CanWrite);
        });
    }

    [Fact]
    public void Pim_unknown_relationship_provenance_is_retained_for_every_role()
    {
        var snapshot = Snapshot([Owner, Contributor], true);
        snapshot = new() { Resources = snapshot.Resources, RoleAssignments = snapshot.RoleAssignments,
            Relationships = [new() { FromAzureResourceId = AzureInventoryPrincipalNodeId.Format(Principal), ToAzureResourceId = Target,
                RelationshipType = GraphEdgeTypes.HasRole, ProvenanceKind = ProvenanceKind.DerivedFact,
                InferenceSource = GraphEdgeInferenceSources.PimEligibilityUnknown }] };
        var graph = InventoryPrivilegePathGraph.Build(snapshot);
        var edges = graph.OutgoingEdges.Values.SelectMany(edges => edges).ToArray();
        Assert.Equal(2, edges.Length);
        Assert.All(edges, edge =>
        {
            Assert.Equal(ProvenanceKind.DerivedFact, edge.ProvenanceKind);
            Assert.Equal(GraphEdgeInferenceSources.PimEligibilityUnknown, edge.InferenceSource);
        });
        Assert.All(PrivilegePathEnumerator.Enumerate(graph, new()), path => Assert.True(path.HasInsufficientEvidenceHop));
    }

    [Fact]
    public void Same_role_on_different_scopes_and_principals_survives_workload_endpoint_projection()
    {
        var snapshot = Snapshot([Owner], false);
        snapshot = new() { Resources = snapshot.Resources, Properties = snapshot.Properties,
            RoleAssignments = [Assignment(Owner, Target + "/blobservices/default"), Assignment(Owner, Target + "/fileservices/default"),
                new() { PrincipalId = "second", Scope = Target + "/blobservices/default", RoleDefinitionId = Owner }] };
        var edges = Hydrate(snapshot);
        Assert.Equal(3, edges.Count);
        Assert.Equal(3, edges.Select(edge => edge.EdgeId).Distinct().Count());
        Assert.All(edges, edge => { Assert.Equal("workload", edge.FromNodeId); Assert.Equal("target", edge.ToNodeId); });
        Assert.Contains(edges, edge => edge.Properties["principalId"] == "second");
        Assert.Equal(2, edges.Select(edge => edge.Properties["scope"]).Distinct().Count());
    }

    [Fact]
    public void Graph_assignment_edge_ids_are_independent_of_capture_order()
    {
        var first = Hydrate(Snapshot([Owner, Contributor], false));
        var second = Hydrate(Snapshot([Contributor, Owner], false));
        Assert.Equal(first.Select(edge => edge.EdgeId).Order(), second.Select(edge => edge.EdgeId).Order());
    }

    [Fact]
    public void Provenance_promotion_only_replaces_the_matching_assignment_identity()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        var first = AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "from", "to", GraphEdgeTypes.HasRole,
            "source", provenanceKind: nameof(ProvenanceKind.DerivedFact), identityKey: "reader");
        var other = AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "from", "to", GraphEdgeTypes.HasRole,
            "source", identityKey: "owner");
        var promoted = AzureInventorySnapshotGraphEdgeAppender.TryAdd(edges, keys, "from", "to", GraphEdgeTypes.HasRole,
            "source", provenanceKind: nameof(ProvenanceKind.ObservedFact), identityKey: "reader");
        Assert.Equal(2, edges.Count);
        Assert.NotSame(first, promoted);
        Assert.Same(promoted, edges[0]);
        Assert.Same(other, edges[1]);
        Assert.Equal(2, keys.Count);
    }

    private static List<GraphEdge> Hydrate(AzureInventorySnapshotDetailReadModel snapshot)
    {
        GraphNode node = new() { NodeId = "workload", Properties = new() { ["arm.id"] = Workload } };
        List<GraphEdge> edges = [];
        AzureInventorySnapshotRoleAssignmentEdgeHydrator.AddMissingRoleAssignmentEdges(snapshot, [node],
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { [Workload] = "workload", [Target] = "target" }, edges, new(StringComparer.Ordinal));
        return edges;
    }

    private static AzureInventoryRoleAssignmentReadModel Assignment(string role, string scope = Target) =>
        new() { PrincipalId = Principal, Scope = scope, RoleDefinitionId = role };

    private static AzureInventorySnapshotDetailReadModel Snapshot(string[] roles, bool relationshipPresent) => new()
    {
        Resources = [new() { ResourceRowId = Row, AzureResourceId = Workload, ResourceType = "Microsoft.Compute/virtualMachines" },
            new() { AzureResourceId = Target, ResourceType = "Microsoft.Storage/storageAccounts" }],
        Properties = [new() { ResourceRowId = Row, PropertyKey = "identity", PropertyValue = "{\"principalId\":\"" + Principal + "\",\"userAssignedIdentities\":{\"identity\":{\"principalId\":\"second\"}}}" }],
        RoleAssignments = roles.Select(role => Assignment(role)).ToList(),
        Relationships = relationshipPresent ? [new() { FromAzureResourceId = AzureInventoryPrincipalNodeId.Format(Principal),
            ToAzureResourceId = Target, RelationshipType = GraphEdgeTypes.HasRole, ProvenanceKind = ProvenanceKind.ObservedFact }] : [],
    };
}
