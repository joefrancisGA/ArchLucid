using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class RiskExceptionDispositionGuardTests
{
    [Fact]
    public async Task EnsureWaiverAllowedForFindingAsync_rejects_remediated_latest_disposition()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(tenantId, "f-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = tenantId,
                    FindingId = "f-1",
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = Disposition.Remediated,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        Func<Task> act = () => RiskExceptionDispositionGuard.EnsureWaiverAllowedForFindingAsync(
            trail.Object,
            tenantId,
            "f-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*Remediated*");
    }
}
