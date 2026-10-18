using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathReportAssemblerTests
{
    private static readonly Guid SnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid ConfirmedPathId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid PossiblePathId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid NsgInsufficientPathId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid CapabilityPathId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    [Fact]
    public void Assemble_places_confirmed_privilege_path_in_vulnerable_list()
    {
        SecurityEvidencePathReportResponse report = AssembleSample();

        report.VulnerableAttackPaths.Should().ContainSingle(path => path.PathId == ConfirmedPathId);
        report.UnevaluatedGroups.Should().NotContain(group => group.PathIds.Contains(ConfirmedPathId));
    }

    [Fact]
    public void Assemble_places_possible_reachability_path_only_in_control_plane_group()
    {
        SecurityEvidencePathReportResponse report = AssembleSample();

        SecurityEvidencePathReportUnevaluatedGroupResponse? controlPlaneGroup = report.UnevaluatedGroups
            .FirstOrDefault(group =>
                group.ReasonCode == SecurityEvidencePathReportReasonCodes.ControlPlaneOnlyNoObservedTraffic);

        controlPlaneGroup.Should().NotBeNull();
        controlPlaneGroup!.PathIds.Should().Contain(PossiblePathId);
        report.VulnerableAttackPaths.Should().NotContain(path => path.PathId == PossiblePathId);
    }

    [Fact]
    public void Assemble_groups_insufficient_nsg_path_with_api_why_text()
    {
        SecurityEvidencePathReportResponse report = AssembleSample();

        SecurityEvidencePathReportUnevaluatedGroupResponse? nsgGroup = report.UnevaluatedGroups
            .FirstOrDefault(group => group.ReasonCode == SecurityEvidencePathReportReasonCodes.NsgNotCollected);

        nsgGroup.Should().NotBeNull();
        nsgGroup!.WhyText.Should().Be(
            SecurityEvidencePathReportReasonCatalog.GetWhyText(SecurityEvidencePathReportReasonCodes.NsgNotCollected));
        nsgGroup.PathIds.Should().Contain(NsgInsufficientPathId);
        report.VulnerableAttackPaths.Should().NotContain(path => path.PathId == NsgInsufficientPathId);
    }

    [Fact]
    public void Assemble_excludes_capability_to_flow_from_both_lists()
    {
        SecurityEvidencePathReportResponse report = AssembleSample();

        report.VulnerableAttackPaths.Should().NotContain(path => path.PathId == CapabilityPathId);
        report.UnevaluatedGroups.Should().NotContain(group => group.PathIds.Contains(CapabilityPathId));
    }

    [Fact]
    public void Assemble_includes_max_paths_search_stopped_group()
    {
        SecurityEvidencePathSearchCoverageRecord coverage = new()
        {
            SearchCoverageId = Guid.NewGuid(),
            TenantId = Guid.Empty,
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Empty,
            SnapshotId = SnapshotId,
            EngineName = SecurityEvidencePathSearchEngineNames.Privilege,
            LimitKind = SecurityEvidencePathSearchLimitKind.MaxPaths,
            LimitValue = 20,
            PathsEmitted = 20,
            CreatedUtc = DateTime.UtcNow,
        };

        SecurityEvidencePathReportResponse report = SecurityEvidencePathReportAssembler.Assemble(
            SnapshotId,
            [],
            [],
            [],
            [coverage]);

        SecurityEvidencePathReportUnevaluatedGroupResponse? searchStopped = report.UnevaluatedGroups
            .FirstOrDefault(group => group.ReasonCode == SecurityEvidencePathReportReasonCodes.SearchStoppedMaxPaths);

        searchStopped.Should().NotBeNull();
        searchStopped!.EngineName.Should().Be("Privilege");
        searchStopped.PathsEmitted.Should().Be(20);
        searchStopped.LimitValue.Should().Be(20);
        searchStopped.WhyText.Should().Contain("20");
    }

    private static SecurityEvidencePathReportResponse AssembleSample()
    {
        List<SecurityEvidencePathRecord> paths =
        [
            CreatePathRecord(ConfirmedPathId, PathKind.Privilege, PathConfidenceBand.Confirmed),
            CreatePathRecord(PossiblePathId, PathKind.IntendedReachability, PathConfidenceBand.Possible),
            CreatePathRecord(NsgInsufficientPathId, PathKind.Privilege, PathConfidenceBand.InsufficientEvidence),
            CreatePathRecord(CapabilityPathId, PathKind.CapabilityToFlow, PathConfidenceBand.Probable),
        ];

        List<SecurityEvidencePathHopEdgeTypeReadModel> hopEdgeTypes =
        [
            new() { PathId = PossiblePathId, EdgeType = SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType },
            new() { PathId = NsgInsufficientPathId, EdgeType = SecureNowArchitectConstants.InsufficientEvidenceNsgHopEdgeType },
        ];

        List<SecurityEvidencePathRankRecord> ranks =
        [
            CreateRank(ConfirmedPathId, 1),
            CreateRank(PossiblePathId, 2),
            CreateRank(NsgInsufficientPathId, 3),
            CreateRank(CapabilityPathId, 4),
        ];

        return SecurityEvidencePathReportAssembler.Assemble(SnapshotId, paths, hopEdgeTypes, ranks, []);
    }

    private static SecurityEvidencePathRecord CreatePathRecord(
        Guid pathId,
        PathKind kind,
        PathConfidenceBand band) =>
        new()
        {
            PathId = pathId,
            SnapshotId = SnapshotId,
            PathKind = kind,
            PathConfidenceBand = band,
            WeakestHopOrdinal = 1,
            WeakestHopReason = "test",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static SecurityEvidencePathRankRecord CreateRank(Guid pathId, int rankOrder) =>
        new()
        {
            PathId = pathId,
            TenantId = Guid.Empty,
            SnapshotId = SnapshotId,
            RuleVersion = SecurityEvidencePathRankConstants.RuleVersion,
            TechnicalExposureScore = 1m,
            PrivilegeDepthScore = 1m,
            BlastRadiusScore = 1m,
            BusinessConsequenceScore = null,
            ConfidenceBandScore = 1m,
            CompositeSortScore = 1m,
            RankOrder = rankOrder,
            ExplanationSummary = "summary",
            BreakdownJson = "[]",
            ComputedUtc = DateTime.UtcNow,
        };
}
