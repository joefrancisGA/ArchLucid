using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Application.Tests.InfraEvidence.ReferenceAssurance;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowReferenceCutPointOracleTests
{
    private static readonly Guid TenantId = Guid.Parse("61000000-0000-4000-8000-000000000001");
    private static readonly Guid SnapshotId = Guid.Parse("61000000-0000-4000-8000-000000000002");

    [Fact]
    public void Production_cut_point_path_collapse_counts_match_brute_force_oracle()
    {
        const string sharedIdentity =
            "identity:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/shared";

        Guid path1 = Guid.Parse("61000000-0000-4000-8000-000000000011");
        Guid path2 = Guid.Parse("61000000-0000-4000-8000-000000000012");
        Guid path3 = Guid.Parse("61000000-0000-4000-8000-000000000013");

        List<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> productionPaths =
        [
            Build(path1, sharedIdentity, "resource:/kv"),
            Build(path2, sharedIdentity, "resource:/sql"),
            Build(path3, sharedIdentity, "resource:/storage"),
        ];

        Dictionary<Guid, IReadOnlyList<(string FromNodeId, string EdgeType, string ToNodeId)>> neutralPaths =
            productionPaths.ToDictionary(
                item => item.Path.PathId,
                item => (IReadOnlyList<(string FromNodeId, string EdgeType, string ToNodeId)>)item.Hops
                    .Select(static hop => (hop.FromNodeId, hop.EdgeType, hop.ToNodeId))
                    .ToList());

        IReadOnlyDictionary<string, int> reference =
            ReferenceCutPointOracle.CountCollapsedPaths(neutralPaths);

        IReadOnlyList<SecurityEvidenceCutPointCandidate> production =
            SecurityEvidenceCutPointAnalyzer.Analyze(
                productionPaths,
                new Dictionary<Guid, string?>());

        foreach (SecurityEvidenceCutPointCandidate candidate in production)
        {
            reference.Should().ContainKey(candidate.CutKey);
            candidate.CollapsedPathIds.Count.Should().Be(reference[candidate.CutKey]);
        }

        production.Single(candidate => candidate.CutKey == $"node:{sharedIdentity}")
            .CollapsedPathIds.Should().HaveCount(3);
    }

    private static (SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops) Build(
        Guid pathId,
        string from,
        string to)
    {
        SecurityEvidencePathRecord path = new()
        {
            PathId = pathId,
            TenantId = TenantId,
            SnapshotId = SnapshotId,
            PathKind = PathKind.Privilege,
            PathConfidenceBand = PathConfidenceBand.Confirmed,
            CreatedUtc = new DateTime(2026, 9, 20, 12, 0, 0, DateTimeKind.Utc),
            UpdatedUtc = new DateTime(2026, 9, 20, 12, 0, 0, DateTimeKind.Utc),
        };

        SecurityEvidencePathHopRecord hop = new()
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = TenantId,
            HopOrdinal = 1,
            FromNodeId = from,
            ToNodeId = to,
            EdgeType = GraphEdgeTypes.CanWrite,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            HopConfidenceBand = PathConfidenceBand.Confirmed,
            EvidenceReference = $"synthetic:{pathId:N}",
        };

        SecurityEvidencePathGuard.ValidatedPath validated =
            SecurityEvidencePathGuard.ValidateAndMaterialize(path, [hop]);

        return (validated.Path, validated.Hops.ToList());
    }
}
