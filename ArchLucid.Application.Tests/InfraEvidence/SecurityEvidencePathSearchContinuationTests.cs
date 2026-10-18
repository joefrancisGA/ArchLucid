using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathSearchContinuationTests
{
    private static readonly Guid TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid SnapshotId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");

    [Fact]
    public void ApplyIfNeeded_merges_continuation_paths_when_first_page_hits_max_paths()
    {
        InventoryPrivilegePathGraphSnapshot graph = BuildManyPrivilegePaths(25);
        PrivilegePathEngineOptions firstPageOptions = new()
        {
            MaxPaths = PrivilegePathEngineOptions.DefaultMaxPaths,
            MaxDepth = PrivilegePathEngineOptions.DefaultMaxDepth,
            MaxFanOutPerNode = PrivilegePathEngineOptions.DefaultMaxFanOutPerNode,
        };

        PrivilegePathEnumerationResult firstPage = PrivilegePathEnumerator.EnumerateWithLimits(graph, firstPageOptions);
        firstPage.LimitHits.Should().ContainSingle(hit => hit.Kind == SecurityEvidencePathSearchLimitKind.MaxPaths);
        firstPage.Candidates.Should().HaveCount(PrivilegePathEngineOptions.DefaultMaxPaths);

        PrivilegePathEnumerationResult merged = SecurityEvidencePathSearchContinuation.ApplyIfNeeded(
            graph,
            firstPage,
            continuationEnabled: true,
            runScope: null,
            TenantId,
            SnapshotId);

        merged.Candidates.Should().HaveCount(25);
        merged.LimitHits.Should().BeEmpty();
    }

    [Fact]
    public void ApplyIfNeeded_does_not_continue_when_explicit_options_are_used()
    {
        InventoryPrivilegePathGraphSnapshot graph = BuildManyPrivilegePaths(25);
        PrivilegePathEngineOptions capped = new() { MaxPaths = 5 };

        PrivilegePathEnumerationResult firstPage = PrivilegePathEnumerator.EnumerateWithLimits(graph, capped);
        PrivilegePathEnumerationResult merged = SecurityEvidencePathSearchContinuation.ApplyIfNeeded(
            graph,
            firstPage,
            continuationEnabled: false,
            runScope: null,
            TenantId,
            SnapshotId);

        merged.Should().BeSameAs(firstPage);
        merged.Candidates.Should().HaveCount(5);
    }

    private static InventoryPrivilegePathGraphSnapshot BuildManyPrivilegePaths(int pathCount)
    {
        Dictionary<string, List<PrivilegePathEdge>> edges = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, AzureInventoryResourceRecord> resources = new(StringComparer.OrdinalIgnoreCase);

        for (int index = 0; index < pathCount; index++)
        {
            string principal = $"principal:/p{index}";
            string role = $"role:/r{index}";
            AzureInventoryResourceRecord resource = new()
            {
                AzureResourceId = $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa{index}",
                ResourceType = "Microsoft.Storage/storageAccounts",
                CloudResourceId = Guid.NewGuid(),
            };
            resources[resource.AzureResourceId] = resource;
            edges[principal] = [Edge(principal, role, GraphEdgeTypes.HasRole)];
            edges[role] = [Edge(role, resource.AzureResourceId, GraphEdgeTypes.CanRead)];
        }

        return new InventoryPrivilegePathGraphSnapshot
        {
            OutgoingEdges = edges,
            ResourcesByArmId = resources,
        };
    }

    private static PrivilegePathEdge Edge(string from, string to, string edgeType) =>
        new()
        {
            FromNodeId = from,
            ToNodeId = to,
            EdgeType = edgeType,
            ProvenanceKind = ProvenanceKind.DerivedFact,
        };
}
