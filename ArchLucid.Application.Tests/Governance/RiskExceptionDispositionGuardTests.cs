using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = global::ArchLucid.Contracts.Findings.FindingDisposition;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class RiskExceptionDispositionGuardTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task EnsureWaiverAllowedForFindingAsync_rejects_remediated_latest_disposition()
    {
        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, "f-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                    FindingId = "f-1",
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = Disposition.Remediated,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        Func<Task> act = () => RiskExceptionDispositionGuard.EnsureWaiverAllowedForFindingAsync(
            trail.Object,
            Scope,
            "f-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*Remediated*");
    }

    [Fact]
    public async Task EnsureWaiverAllowedForFindingAsync_allows_waiver_when_remediated_disposition_is_foreign_project()
    {
        Guid foreignProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, "f-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = foreignProjectId,
                    FindingId = "f-1",
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = Disposition.Remediated,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        Func<Task> act = () => RiskExceptionDispositionGuard.EnsureWaiverAllowedForFindingAsync(
            trail.Object,
            Scope,
            "f-1",
            CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}
