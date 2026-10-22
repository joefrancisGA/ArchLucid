using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CloudResourceAuditLineageResolverTests
{
    [Fact]
    public async Task ResolveAsync_uses_query_params_when_all_three_ids_present()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid assessmentId = Guid.NewGuid();
        Guid auditEvidenceSnapshotId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();

        Mock<IAuditEvidenceSnapshotRepository> snapshotRepository = new();

        CloudResourceAuditLineageResolver resolver = new(snapshotRepository.Object);

        CloudResourceAuditLineageLink link = await resolver.ResolveAsync(
            scope,
            Guid.NewGuid(),
            new CloudResourceEvidenceHubQuery
            {
                AssessmentId = assessmentId,
                AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                ControlId = controlId,
            },
            CancellationToken.None);

        link.Available.Should().BeTrue();
        link.AssessmentId.Should().Be(assessmentId);
        link.AuditEvidenceSnapshotId.Should().Be(auditEvidenceSnapshotId);
        link.ControlId.Should().Be(controlId);
        link.RelativePath.Should().Contain(controlId.ToString("D"));
        snapshotRepository.Verify(
            repo => repo.ListLineageContextsByCloudResourceIdAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ResolveAsync_looks_up_latest_control_match_when_query_params_absent()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid cloudResourceId = Guid.NewGuid();
        Guid assessmentId = Guid.NewGuid();
        Guid auditEvidenceSnapshotId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        DateTime createdUtc = DateTime.UtcNow;

        Mock<IAuditEvidenceSnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repo => repo.ListLineageContextsByCloudResourceIdAsync(
                scope.TenantId,
                cloudResourceId,
                25,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new AuditEvidenceSnapshotLineageContextRecord
                {
                    AssessmentId = assessmentId,
                    AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                    ControlId = controlId,
                    ControlNumber = "AC-2",
                    ControlTitle = "Account management",
                    SnapshotCreatedUtc = createdUtc,
                },
            ]);

        CloudResourceAuditLineageResolver resolver = new(snapshotRepository.Object);

        CloudResourceAuditLineageLink link = await resolver.ResolveAsync(
            scope,
            cloudResourceId,
            new CloudResourceEvidenceHubQuery(),
            CancellationToken.None);

        link.Available.Should().BeTrue();
        link.ControlNumber.Should().Be("AC-2");
        link.ControlTitle.Should().Be("Account management");
        link.Matches.Should().ContainSingle();
        link.Matches[0].AuditEvidenceSnapshotId.Should().Be(auditEvidenceSnapshotId);
    }

    [Fact]
    public async Task ResolveAsync_returns_degraded_copy_when_no_snapshot_rows_reference_resource()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };

        Mock<IAuditEvidenceSnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repo => repo.ListLineageContextsByCloudResourceIdAsync(
                scope.TenantId,
                It.IsAny<Guid>(),
                25,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        CloudResourceAuditLineageResolver resolver = new(snapshotRepository.Object);

        CloudResourceAuditLineageLink link = await resolver.ResolveAsync(
            scope,
            Guid.NewGuid(),
            new CloudResourceEvidenceHubQuery(),
            CancellationToken.None);

        link.Available.Should().BeFalse();
        link.DegradedReason.Should().Contain("No audit evidence snapshot rows");
    }
}
