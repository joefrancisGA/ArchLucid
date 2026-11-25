using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathReportQueryServiceTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Only_authorized_reports_include_latest_inventory_provenance(bool foreignSnapshot)
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid snapshotId = Guid.NewGuid(), pathId = Guid.NewGuid(), legacyPathId = Guid.NewGuid(), unrankedPathId = Guid.NewGuid();
        var key = ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId);
        DateTime captured = new(2026, 11, 25, 1, 0, 0, DateTimeKind.Utc);
        var evidence = new PublicNetworkAccessVerificationEvidence(
            "azure-inventory-public-network-access/1", scope.TenantId, scope.WorkspaceId, scope.ProjectId,
            Guid.NewGuid(), "publicNetworkAccess", 24);
        var observation = new PublicNetworkAccessVerification(
            Guid.NewGuid(), PublicNetworkAccessVerificationOutcome.Contradicted, snapshotId, captured) { Evidence = evidence };
        var probe = new InventoryFalsificationProbe(
            InventoryFalsificationOutcome.Refuted, "The explicit Azure property only.", observation);
        var recorded = new SecurityEvidencePathVerificationRecord(pathId, Guid.NewGuid(), captured.AddMinutes(1), probe);

        Mock<IAzureInventorySnapshotRepository> snapshots = new(MockBehavior.Strict);
        Mock<ISecurityEvidencePathRepository> paths = new(MockBehavior.Strict);
        Mock<ISecurityEvidencePathRankRepository> ranks = new(MockBehavior.Strict);
        Mock<ISecurityEvidencePathSearchCoverageRepository> coverage = new(MockBehavior.Strict);
        Mock<ISecurityEvidencePathExplanationRepository> explanations = new(MockBehavior.Strict);
        snapshots.Setup(r => r.TryGetBySnapshotIdAsync(scope, snapshotId, CancellationToken.None))
            .ReturnsAsync(new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId, TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId,
                ProjectId = foreignSnapshot ? Guid.NewGuid() : scope.ProjectId,
            });
        paths.Setup(r => r.ListBySnapshotAsync(key, CancellationToken.None))
            .ReturnsAsync([CreatePath(pathId), CreatePath(legacyPathId), CreatePath(unrankedPathId)]);
        paths.Setup(r => r.ListHopEdgeTypesBySnapshotAsync(key, CancellationToken.None)).ReturnsAsync([]);
        ranks.Setup(r => r.ListBySnapshotAsync(key, CancellationToken.None))
            .ReturnsAsync([CreateRank(pathId, 1), CreateRank(legacyPathId, 2)]);
        coverage.Setup(r => r.ListBySnapshotAsync(scope, snapshotId, CancellationToken.None)).ReturnsAsync([]);
        explanations.Setup(r => r.ListLatestVerificationByPathsAsync(
                scope, snapshotId, It.Is<IReadOnlyList<Guid>>(ids => ids.SequenceEqual(new[] { pathId, legacyPathId })), CancellationToken.None))
            .ReturnsAsync([
                recorded,
                recorded with { PathId = unrankedPathId },
                recorded with
                {
                    PathId = legacyPathId,
                    Verification = probe with { Verification = observation with { SnapshotId = Guid.NewGuid() } },
                },
                recorded with
                {
                    PathId = legacyPathId,
                    Verification = probe with { Verification = observation with { Evidence = evidence with { ProjectId = Guid.NewGuid() } } },
                },
            ]);

        SecurityEvidencePathReportQueryService sut = new(snapshots.Object, paths.Object, ranks.Object, coverage.Object, explanations.Object);
        var report = await sut.TryGetReportAsync(scope, snapshotId);
        if (foreignSnapshot)
        {
            report.Should().BeNull();
            paths.VerifyNoOtherCalls();
            explanations.VerifyNoOtherCalls();
            return;
        }

        report.Should().NotBeNull();
        report!.VulnerableAttackPaths.Select(p => p.PathId).Should().Equal(pathId, legacyPathId);
        var actual = report.InventoryVerifications.Should().ContainSingle().Which;
        actual.PathId.Should().Be(pathId);
        actual.ExplanationId.Should().Be(recorded.ExplanationId);
        actual.RecordedUtc.Should().Be(recorded.RecordedUtc);
        actual.Verification.Should().Be(probe);
        explanations.Verify(r => r.ListLatestVerificationByPathsAsync(
            scope, snapshotId, It.IsAny<IReadOnlyList<Guid>>(), CancellationToken.None), Times.Once);

        SecurityEvidencePathRecord CreatePath(Guid id) => new()
        {
            PathId = id, SnapshotId = snapshotId, PathKind = PathKind.Privilege, PathConfidenceBand = PathConfidenceBand.Confirmed,
        };
        SecurityEvidencePathRankRecord CreateRank(Guid id, int order) => new()
        {
            PathId = id, SnapshotId = snapshotId, RankOrder = order,
        };
    }
}
