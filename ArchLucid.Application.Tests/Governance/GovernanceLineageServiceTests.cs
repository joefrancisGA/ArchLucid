using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GovernanceLineageServiceTests
{
    [Fact]
    public async Task GetApprovalRequestLineageAsync_When_missing_Returns_null()
    {
        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals
            .Setup(r => r.GetByIdAsync("nope", It.IsAny<CancellationToken>()))
            .ReturnsAsync((GovernanceApprovalRequest?)null);

        GovernanceLineageService sut = new(
            approvals.Object,
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IScopeContextProvider>());

        GovernanceLineageResult? result = await sut.GetApprovalRequestLineageAsync("nope");

        result.Should().BeNull();
    }
}
