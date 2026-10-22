using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Advisory;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Advisory;

[Trait("Category", "Unit")]
public sealed class RecommendationFeedbackAnalyzerTests
{
    [Fact]
    public async Task GetStatusCountsByCategoryAsync_groups_rows_by_category_and_status()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        Mock<IRecommendationRepository> repository = new();
        repository
            .Setup(r => r.ListByScopeAsync(tenantId, workspaceId, projectId, null, 1000, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RecommendationRecord
                {
                    RecommendationId = Guid.NewGuid(),
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    RunId = Guid.NewGuid(),
                    Title = "a",
                    Category = "Security",
                    Status = RecommendationStatus.Proposed,
                },
                new RecommendationRecord
                {
                    RecommendationId = Guid.NewGuid(),
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    RunId = Guid.NewGuid(),
                    Title = "b",
                    Category = "Security",
                    Status = RecommendationStatus.Proposed,
                },
                new RecommendationRecord
                {
                    RecommendationId = Guid.NewGuid(),
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    RunId = Guid.NewGuid(),
                    Title = "c",
                    Category = "Cost",
                    Status = RecommendationStatus.Accepted,
                },
            ]);

        RecommendationFeedbackAnalyzer sut = new(repository.Object);

        IReadOnlyDictionary<string, int> counts =
            await sut.GetStatusCountsByCategoryAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        counts.Should().HaveCount(2);
        counts["Security:Proposed"].Should().Be(2);
        counts["Cost:Accepted"].Should().Be(1);
    }
}
