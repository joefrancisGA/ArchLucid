using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ToxicCombinationPathComposerTests
{
    [Fact]
    public void Compose_pairs_only_privilege_paths_that_share_an_asset()
    {
        string sharedAsset = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/shared";
        ToxicCombinationPathSnapshot reachability = Snapshot(
            Guid.NewGuid(),
            PathKind.IntendedReachability,
            [Hop("internet", sharedAsset, GraphEdgeTypes.Exposes)],
            sharedAsset,
            Guid.NewGuid());
        ToxicCombinationPathSnapshot matchingPrivilege = Snapshot(
            Guid.NewGuid(),
            PathKind.Privilege,
            [Hop("principal:/a", sharedAsset, GraphEdgeTypes.HasRole)],
            sharedAsset,
            Guid.NewGuid());
        ToxicCombinationPathSnapshot unrelatedPrivilege = Snapshot(
            Guid.NewGuid(),
            PathKind.Privilege,
            [Hop("principal:/b", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/other", GraphEdgeTypes.HasRole)],
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/other",
            Guid.NewGuid());

        IReadOnlyList<ToxicCombinationCandidate> results = ToxicCombinationPathComposer.Compose(
            [reachability],
            [matchingPrivilege, unrelatedPrivilege],
            new Dictionary<string, PrivilegePathEdge>(StringComparer.OrdinalIgnoreCase));

        results.Should().ContainSingle();
        results[0].PrivilegePathId.Should().Be(matchingPrivilege.Path.PathId);
    }

    private static ToxicCombinationPathSnapshot Snapshot(
        Guid pathId,
        PathKind pathKind,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        string terminalNodeId,
        Guid terminalCloudResourceId) =>
        new()
        {
            Path = new SecurityEvidencePathRecord
            {
                PathId = pathId,
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                SnapshotId = Guid.NewGuid(),
                PathKind = pathKind,
                PathConfidenceBand = PathConfidenceBand.Confirmed,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            Hops = hops,
            NodeIds = hops
                .SelectMany(hop => new[] { hop.FromNodeId, hop.ToNodeId })
                .ToHashSet(StringComparer.OrdinalIgnoreCase),
            TerminalNodeId = terminalNodeId,
            TerminalCloudResourceId = terminalCloudResourceId,
            TerminalResourceType = "Microsoft.Storage/storageAccounts",
        };

    private static SecurityEvidencePathHopRecord Hop(string from, string to, string edgeType) =>
        new()
        {
            HopRowId = Guid.NewGuid(),
            PathId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            HopOrdinal = 1,
            FromNodeId = from,
            ToNodeId = to,
            EdgeType = edgeType,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
        };
}
