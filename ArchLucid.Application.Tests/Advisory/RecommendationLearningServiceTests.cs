using System.Text.Json;

using ArchLucid.Application.Advisory;
using ArchLucid.Contracts.Advisory.Learning;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Advisory.Learning;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Advisory;

[Trait("Category", "Unit")]
public sealed class RecommendationLearningServiceTests
{
    [Fact]
    public async Task RebuildProfileAsync_lists_analyzes_and_persists()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        RecommendationRecord[] rows = [new RecommendationRecord { RecommendationId = Guid.NewGuid(), Status = RecommendationStatus.Accepted }];
        RecommendationLearningProfile built = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };

        Mock<IRecommendationRepository> repo = new();
        repo.Setup(r => r.ListByScopeAsync(tenantId, workspaceId, projectId, null, 5000, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rows);

        Mock<IRecommendationLearningAnalyzer> analyzer = new();
        analyzer.Setup(a => a.BuildProfile(tenantId, workspaceId, projectId, It.IsAny<IReadOnlyList<RecommendationRecord>>())).Returns(built);

        Mock<IRecommendationLearningProfileRepository> profiles = new();
        RecommendationLearningService sut = new(repo.Object, analyzer.Object, profiles.Object, new RecommendationLearningBuildGate());

        RecommendationLearningProfile result = await sut.RebuildProfileAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.Should().BeSameAs(built);
        profiles.Verify(p => p.SaveAsync(built, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetLatestProfileAsync_delegates_to_repository()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        RecommendationLearningProfile? profile = new();

        Mock<IRecommendationLearningProfileRepository> profiles = new();
        profiles.Setup(p => p.GetLatestAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(profile);

        RecommendationLearningService sut = new(
            Mock.Of<IRecommendationRepository>(),
            Mock.Of<IRecommendationLearningAnalyzer>(),
            profiles.Object,
            new RecommendationLearningBuildGate());

        RecommendationLearningProfile? result = await sut.GetLatestProfileAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.Should().BeSameAs(profile);
    }
}
