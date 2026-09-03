using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

using FluentAssertions;

using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class RiskExceptionServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CreateAsync_rejects_when_finding_latest_disposition_is_remediated()
    {
        const string findingId = "finding-remediated";

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListByFindingAsync(Scope.TenantId, findingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = Scope.TenantId,
                    FindingId = findingId,
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = Disposition.Remediated,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        Mock<IRiskExceptionRepository> repository = new(MockBehavior.Strict);

        RiskExceptionService sut = new(
            repository.Object,
            trail.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<ILogger<RiskExceptionService>>());

        CreateRiskExceptionRequest request = new()
        {
            FindingId = findingId,
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            OwnerUserId = "owner@contoso.com",
            Rationale = "attempt waiver on remediated finding",
            EvidenceRef = "artifact://evidence/1",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
        };

        Func<Task> act = () => sut.CreateAsync(request, Scope, "reviewer@test", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*Remediated*");
    }
}
