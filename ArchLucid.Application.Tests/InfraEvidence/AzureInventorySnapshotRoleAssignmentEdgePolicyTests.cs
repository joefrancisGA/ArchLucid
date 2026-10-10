using System.Text.Json;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
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
    public async Task Role_edges_preserve_each_identity_scope_and_role_with_observed_provenance(string mode)
    {
        GraphSnapshot graph = await ResolveScenarioAsync(mode);
        GraphEdge[] roles = graph.Edges.Where(edge => edge.EdgeType == GraphEdgeTypes.HasRole).ToArray();
        bool suppressed = mode is "redacted" or "invalid-json" or "blank-identity" or "missing-identity"
            or "missing-principal" or "blank-principal" or "blank-scope";
        bool multiple = mode is "reader-first" or "owner-first" or "duplicate-scopes" or "two-principals";
        Assert.Equal(suppressed ? 0 : multiple ? 2 : 1, roles.Length);
        foreach (GraphEdge edge in roles)
        {
            Assert.Equal(Workload, graph.Nodes.Single(node => node.NodeId == edge.FromNodeId).SourceId);
            var assignment = Assert.Single(Snapshot(mode).RoleAssignments, assignment =>
                assignment.PrincipalId.Trim() == edge.Properties["principalId"]
                && ArmResourceIdNormalizer.Normalize(assignment.Scope) == edge.Properties["scope"]
                && assignment.RoleDefinitionId == edge.Properties["roleDefinitionId"]);
            Assert.Equal(assignment.RoleDefinitionId, edge.Properties["roleDefinitionId"]);
            if (mode == "unknown-role") Assert.False(edge.Properties.ContainsKey("roleName"));
            else Assert.Equal(edge.Properties["roleDefinitionId"] == Owner ? "Owner" : "Reader", edge.Properties["roleName"]);
            Assert.Equal(GraphEdgeTypes.HasRole, edge.Label);
            Assert.Equal(1d, edge.Weight);
            Assert.Equal(GraphEdgeInferenceSources.InventoryRbacAssignment, edge.InferenceSource);
            Assert.Equal(nameof(ProvenanceKind.ObservedFact), edge.ProvenanceKind);
            Assert.Equal($"edge-{edge.FromNodeId}|{edge.ToNodeId}|{GraphEdgeTypes.HasRole}|"
                + AzureInventoryRoleAssignmentIdentity.Create(assignment.PrincipalId, assignment.Scope, assignment.RoleDefinitionId), edge.EdgeId);
            Assert.Null(edge.DeclaredConnectionId);
            if (mode is "unknown-scope" or "subscription") Assert.StartsWith("role-scope-", edge.ToNodeId);
            else Assert.Equal(mode == "self" ? Workload : Target, graph.Nodes.Single(node => node.NodeId == edge.ToNodeId).SourceId);
        }
        if (mode is "reader-first" or "owner-first" or "duplicate-scopes" or "two-principals")
        {
            Assert.Equal(2, Snapshot(mode).RoleAssignments.Count);
            Assert.Equal(2, roles.Select(edge => edge.EdgeId).Distinct().Count());
            var diagram = new DiagramAstFromGraphCompiler().Compile(graph, DiagramMode.FullSubscription);
            var access = Assert.Single(diagram.Edges, edge => edge.InferenceSource == GraphEdgeInferenceSources.InventoryRbacAssignment);
            Assert.Equal("Has access", access.Label);
        }
    }

    public static IEnumerable<object[]> ExistingCases => new string?[]
        { "ObservedFact", "HumanAssertion", "DerivedFact", "DeterministicInference", "unknown", null, " " }
        .SelectMany(provenance => new[] { false, true }.Select(keyPresent => new object[] { provenance!, keyPresent }));

    [Theory]
    [MemberData(nameof(ExistingCases))]
    public void Endpoint_only_edge_does_not_suppress_assignment_evidence(string? provenance, bool keyPresent)
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
        Assert.Equal(2, edges.Count);
        Assert.Same(original, edges[0]);
        Assert.Equal(keyPresent ? 2 : 1, keys.Count);
        Assert.Equal("original", original.EdgeId);
        Assert.Equal("custom", original.Label);
        Assert.Equal(.4d, original.Weight);
        Assert.Equal("custom", original.InferenceSource);
        Assert.Equal(provenance, original.ProvenanceKind);
        Assert.Equal("declaration", original.DeclaredConnectionId);
        Assert.Equal("explanation", original.ReasoningTrace);
        Assert.Equal("original scope", original.Properties["scope"]);
        Assert.Single(original.Properties);
        Assert.Equal("Reader", edges[1].Properties["roleName"]);
    }

    [Fact]
    public void Endpoint_only_key_does_not_block_assignment_insertion()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal) { $"workload|target|{GraphEdgeTypes.HasRole}" };
        Hydrate(Snapshot("exact"), edges, keys);
        Assert.Single(edges);
        Assert.Equal(2, keys.Count);
    }

    [Fact]
    public void Repeated_hydration_retains_distinct_roles_without_reinserting_existing_assignments()
    {
        List<GraphEdge> edges = [];
        HashSet<string> keys = new(StringComparer.Ordinal);
        Hydrate(Snapshot("exact"), edges, keys);
        GraphEdge original = Assert.Single(edges);
        Hydrate(Snapshot("owner-first"), edges, keys);
        Assert.Equal(2, edges.Count);
        Assert.Same(original, edges.Single(edge => edge.Properties["roleName"] == "Reader"));
        Assert.Equal(2, keys.Count);
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
    public void Privilege_analysis_retains_multiple_roles_for_same_principal_and_scope(string mode)
    {
        var graph = InventoryPrivilegePathGraph.Build(Snapshot(mode));
        var roles = graph.OutgoingEdges.Values.SelectMany(edges => edges).Where(edge => edge.EdgeType == GraphEdgeTypes.HasRole).ToList();
        Assert.Equal(new[] { "Owner", "Reader" }, roles.Select(edge => edge.RoleName).OrderBy(name => name).ToArray());
        var paths = PrivilegePathEnumerator.Enumerate(graph, new());
        Assert.Equal(2, paths.Count);
        Assert.Contains(paths, path => path.Hops[^1].EdgeType == GraphEdgeTypes.CanRead);
        Assert.Contains(paths, path => path.Hops[^1].EdgeType == GraphEdgeTypes.CanWrite);
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
