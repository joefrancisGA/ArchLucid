using System.Text.Json;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotRoleAssignmentEdgePolicyTests
{
    private const string Prefix = "/subscriptions/sub/resourcegroups/rg/providers/";
    private const string Workload = Prefix + "microsoft.compute/virtualmachines/vm";
    private const string Target = Prefix + "microsoft.storage/storageaccounts/storage";
    private const string Reader = "acdd72a7-3385-48ef-bd42-f60684581c14";
    private const string Owner = "8e3af657-a8ff-443c-a75c-2fe8c4bcb635";
    private const string Principal = "aaaaaaaa-1111-1111-1111-111111111111";
    private static readonly Guid Row = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public static IEnumerable<object[]> Scenarios => new[]
    {
        "exact", "ancestor", "unknown-scope", "subscription", "self", "redacted", "invalid-json", "blank-identity",
        "missing-identity", "user-assigned", "mixed-principal", "missing-principal", "blank-principal", "blank-scope",
        "unknown-role", "duplicate-identities", "reader-first", "owner-first", "duplicate-scopes", "two-principals",
    }.Select(mode => new object[] { mode });

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Role_edges_preserve_identity_scope_provenance_and_first_assignment(string mode)
    {
        GraphSnapshot graph = await ResolveScenarioAsync(mode);
        GraphEdge[] roles = graph.Edges.Where(edge => edge.EdgeType == GraphEdgeTypes.HasRole).ToArray();
        bool suppressed = mode is "redacted" or "invalid-json" or "blank-identity" or "missing-identity"
            or "missing-principal" or "blank-principal" or "blank-scope";
        Assert.Equal(suppressed ? 0 : 1, roles.Length);
        foreach (GraphEdge edge in roles)
        {
            Assert.Equal(Workload, graph.Nodes.Single(node => node.NodeId == edge.FromNodeId).SourceId);
            Assert.Equal(Scope(mode), edge.Properties["scope"]);
            Assert.Equal(mode == "owner-first" ? Owner : mode == "unknown-role" ? "custom-role" : Reader, edge.Properties["roleDefinitionId"]);
            if (mode == "unknown-role") Assert.False(edge.Properties.ContainsKey("roleName"));
            else Assert.Equal(mode == "owner-first" ? "Owner" : "Reader", edge.Properties["roleName"]);
            Assert.Equal(GraphEdgeTypes.HasRole, edge.Label);
            Assert.Equal(1d, edge.Weight);
            Assert.Equal(GraphEdgeInferenceSources.InventoryRbacAssignment, edge.InferenceSource);
            Assert.Equal(nameof(ProvenanceKind.ObservedFact), edge.ProvenanceKind);
            Assert.Equal($"edge-{edge.FromNodeId}|{edge.ToNodeId}|{GraphEdgeTypes.HasRole}", edge.EdgeId);
            Assert.Null(edge.DeclaredConnectionId);
            if (mode is "unknown-scope" or "subscription") Assert.StartsWith("role-scope-", edge.ToNodeId);
            else Assert.Equal(mode == "self" ? Workload : Target, graph.Nodes.Single(node => node.NodeId == edge.ToNodeId).SourceId);
        }
        if (mode is "reader-first" or "owner-first" or "duplicate-scopes" or "two-principals")
        {
            // Characterize existing loss of assignment detail; this refactor preserves the graph's policy.
            Assert.Equal(2, Snapshot(mode).RoleAssignments.Count);
            Assert.Single(roles);
        }
    }

    public static IEnumerable<object[]> ExistingCases => new string?[]
        { "ObservedFact", "HumanAssertion", "DerivedFact", "DeterministicInference", "unknown", null, " " }
        .SelectMany(provenance => new[] { false, true }.Select(keyPresent => new object[] { provenance!, keyPresent }));

    [Theory]
    [MemberData(nameof(ExistingCases))]
    public void Existing_edge_is_unchanged_and_only_key_set_controls_duplicates(string? provenance, bool keyPresent)
    {
        GraphEdge original = new()
        {
            EdgeId = "original", FromNodeId = "workload", ToNodeId = "target", EdgeType = GraphEdgeTypes.HasRole,
            Label = "custom", Weight = .4d, InferenceSource = "custom", ProvenanceKind = provenance,
            DeclaredConnectionId = "declaration", ReasoningTrace = "explanation",
        };
        original.Properties["scope"] = "original scope";
        List<GraphEdge> edges = [original];
        HashSet<string> keys = new(StringComparer.Ordinal);
        if (keyPresent) keys.Add($"workload|target|{GraphEdgeTypes.HasRole}");
        Hydrate(Snapshot("exact"), edges, keys);
        Assert.Equal(keyPresent ? 1 : 2, edges.Count);
        Assert.Same(original, edges[0]);
        Assert.Single(keys);
        Assert.Equal("original", original.EdgeId);
        Assert.Equal("custom", original.Label);
        Assert.Equal(.4d, original.Weight);
        Assert.Equal("custom", original.InferenceSource);
        Assert.Equal(provenance, original.ProvenanceKind);
        Assert.Equal("declaration", original.DeclaredConnectionId);
        Assert.Equal("explanation", original.ReasoningTrace);
        Assert.Equal("original scope", original.Properties["scope"]);
        Assert.Single(original.Properties);
        if (!keyPresent) Assert.Equal("Reader", edges[1].Properties["roleName"]);
    }

    [Fact]
    public void Key_without_edge_blocks_insertion()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal) { $"workload|target|{GraphEdgeTypes.HasRole}" };
        Hydrate(Snapshot("exact"), edges, keys);
        Assert.Empty(edges);
        Assert.Single(keys);
    }

    [Fact]
    public void Repeated_hydration_keeps_first_role_and_object()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate(Snapshot("exact"), edges, keys);
        GraphEdge original = Assert.Single(edges);
        Hydrate(Snapshot("owner-first"), edges, keys);
        Assert.Same(original, Assert.Single(edges));
        Assert.Equal("Reader", original.Properties["roleName"]);
        Assert.Single(keys);
    }

    [Fact]
    public void Invalid_role_reserves_key_without_inserting_edge_and_duplicate_retry_skips_lookup()
    {
        var snapshot = Snapshot("exact");
        snapshot = new() { Header = snapshot.Header, Resources = snapshot.Resources, Properties = snapshot.Properties,
            RoleAssignments = [new() { PrincipalId = Principal, Scope = Target, RoleDefinitionId = " " }] };
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Assert.Throws<ArgumentException>(() => Hydrate(snapshot, edges, keys));
        Assert.Empty(edges);
        Assert.Single(keys);
        Hydrate(snapshot, edges, keys);
        Assert.Empty(edges);
    }

    [Theory]
    [InlineData("reader-first")]
    [InlineData("owner-first")]
    public void Privilege_analysis_currently_rejects_multiple_roles_for_same_principal_and_scope(string mode)
    {
        // Separate security path: preserve and expose this known limitation during the diagram refactor.
        Assert.Throws<ArgumentException>(() => InventoryPrivilegePathGraph.Build(Snapshot(mode)));
    }

    internal static async Task<GraphSnapshot> ResolveScenarioAsync(string mode)
    {
        var snapshot = Snapshot(mode);
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(repo => repo.TryGetCanonicalSnapshotDetailAsync(It.IsAny<ScopeContext>(), snapshot.Header.SnapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(snapshot);
        var result = await new AzureInventorySnapshotGraphResolver(repository.Object).TryResolveGraphAsync(new ScopeContext
        {
            TenantId = snapshot.Header.TenantId, WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        }, snapshot.Header.SnapshotId);
        Assert.True(result.Succeeded);
        return result.Graph!;
    }

    private static void Hydrate(AzureInventorySnapshotDetailReadModel snapshot, List<GraphEdge> edges, HashSet<string> keys)
    {
        GraphNode node = new() { NodeId = "workload" };
        node.Properties["arm.id"] = Workload;
        AzureInventorySnapshotRoleAssignmentEdgeHydrator.AddMissingRoleAssignmentEdges(snapshot, [node],
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { [Workload] = "workload", [Target] = "target" }, edges, keys);
    }

    private static string Scope(string mode) => mode switch
    {
        "ancestor" or "duplicate-scopes" => Target + "/blobservices/default",
        "unknown-scope" => Prefix + "microsoft.keyvault/vaults/missing",
        "subscription" => "/subscriptions/sub", "self" => Workload, "blank-scope" => " ", _ => Target,
    };

    private static AzureInventorySnapshotDetailReadModel Snapshot(string mode)
    {
        string identity = mode == "user-assigned"
            ? JsonSerializer.Serialize(new { userAssignedIdentities = new Dictionary<string, object> { ["identity"] = new { principalId = Principal } } })
            : JsonSerializer.Serialize(new { principalId = Principal, userAssignedIdentities = mode == "two-principals"
                ? new Dictionary<string, object> { ["identity"] = new { principalId = "second-principal" } } : null });
        AzureInventoryResourcePropertyReadModel Property() => new()
        {
            ResourceRowId = Row, PropertyKey = "IDENTITY", IsRedacted = mode == "redacted",
            PropertyValue = mode == "invalid-json" ? "{" : mode == "blank-identity" ? " " : identity,
        };
        AzureInventoryRoleAssignmentReadModel Assignment(bool second = false) => new()
        {
            PrincipalId = mode == "blank-principal" ? " " : mode == "missing-principal" ? "missing" : second && mode == "two-principals"
                ? "second-principal" : mode == "mixed-principal" ? "  " + Principal.ToUpperInvariant() + "  " : Principal,
            Scope = second && mode == "duplicate-scopes" ? Target + "/fileservices/default" : "  " + Scope(mode).ToUpperInvariant() + "  ",
            RoleDefinitionId = mode == "unknown-role" ? "custom-role" : mode == "owner-first" ? second ? Reader : Owner : second ? Owner : Reader,
        };
        return new()
        {
            Header = new()
            {
                SnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                SubscriptionId = "sub", CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CreatedUtc = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc),
            },
            Resources = [new() { ResourceRowId = Row, AzureResourceId = Workload, ResourceType = "Microsoft.Compute/virtualMachines", ResourceGroup = "rg", SubscriptionId = "sub" },
                new() { ResourceRowId = Guid.Parse("00000000-0000-0000-0000-000000000002"), AzureResourceId = Target, ResourceType = "Microsoft.Storage/storageAccounts", ResourceGroup = "rg", SubscriptionId = "sub" }],
            Properties = mode == "missing-identity" ? [] : mode == "duplicate-identities" ? [Property(), Property()] : [Property()],
            RoleAssignments = mode is "reader-first" or "owner-first" or "duplicate-scopes" or "two-principals" ? [Assignment(), Assignment(true)] : [Assignment()],
        };
    }
}
