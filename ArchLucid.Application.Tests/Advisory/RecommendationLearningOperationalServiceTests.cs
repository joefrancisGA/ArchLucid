using ArchLucid.Application.Advisory;
using ArchLucid.Contracts.Advisory.Learning;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Persistence.Advisory;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Advisory;

[Trait("Category", "Unit")]
public sealed class RecommendationLearningOperationalSupportTests
{
    [Fact]
    public void ResolveBlockingReason_returns_null_when_threshold_met()
    {
        RecommendationLearningOperationalSupport.ResolveBlockingReason(10, 1).Should().BeNull();
    }

    [Fact]
    public void ResolveBlockingReason_describes_shortfall()
    {
        RecommendationLearningOperationalSupport.ResolveBlockingReason(3, 10)
            .Should()
            .Be("Profile build is unavailable because 3 eligible outcomes exist and the minimum threshold is 10.");
    }

    [Fact]
    public void PartitionOutcomes_excludes_proposed_and_truncates_to_batch_cap()
    {
        List<RecommendationRecord> records =
        [
            new() { Status = RecommendationStatus.Proposed, LastUpdatedUtc = DateTime.UtcNow },
            new() { Status = RecommendationStatus.Accepted, LastUpdatedUtc = DateTime.UtcNow.AddMinutes(-1) },
            new() { Status = RecommendationStatus.Rejected, LastUpdatedUtc = DateTime.UtcNow.AddMinutes(-2) },
        ];

        (IReadOnlyList<RecommendationRecord> eligible, RecommendationLearningOutcomeEligibilityBreakdown eligibility) =
            RecommendationLearningOperationalSupport.PartitionOutcomes(records, batchCap: 1);

        eligible.Should().HaveCount(1);
        eligibility.ProposedExcluded.Should().Be(1);
        eligibility.TruncatedByBatchCap.Should().Be(1);
    }
}

[Trait("Category", "Unit")]
public sealed class RecommendationLearningOperationalServiceTests
{
    [Fact]
    public async Task PreviewRebuildAsync_returns_deltas_without_persisting()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        RecommendationRecord[] rows =
        [
            new() { Status = RecommendationStatus.Accepted, Category = "Security", Urgency = "High", LastUpdatedUtc = DateTime.UtcNow },
        ];

        Mock<IRecommendationRepository> repo = new();
        repo.Setup(r => r.ListByScopeAsync(tenantId, workspaceId, projectId, null, 5000, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rows);

        Mock<IRecommendationLearningProfileRepository> profiles = new();
        profiles.Setup(p => p.GetLatestAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RecommendationLearningProfile?)null);

        Mock<IRecommendationLearningAnalyzer> analyzer = new();
        RecommendationLearningProfile built = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            CategoryWeights = new Dictionary<string, double> { ["Security"] = 1.2 },
        };
        analyzer.Setup(a => a.BuildProfile(tenantId, workspaceId, projectId, It.IsAny<IReadOnlyList<RecommendationRecord>>()))
            .Returns(built);

        RecommendationLearningOperationalService sut = new(
            repo.Object,
            profiles.Object,
            analyzer.Object,
            new RecommendationLearningBuildGate());

        RecommendationLearningPreviewResponse preview = await sut.PreviewRebuildAsync(
            tenantId,
            workspaceId,
            projectId,
            "corr-1",
            CancellationToken.None);

        preview.ProposedProfile.Should().BeSameAs(built);
        preview.WeightDeltas.Should().NotBeEmpty();
        profiles.Verify(p => p.SaveAsync(It.IsAny<RecommendationLearningProfile>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RollbackAsync_clones_selected_profile_and_persists_new_row()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid profileId = Guid.NewGuid();
        RecommendationLearningProfile sourceProfile = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            CategoryWeights = new Dictionary<string, double> { ["Security"] = 1.1 },
        };

        Mock<IRecommendationLearningProfileRepository> profiles = new();
        profiles.Setup(p => p.GetByProfileIdAsync(tenantId, workspaceId, projectId, profileId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RecommendationLearningProfileRecord { ProfileId = profileId, Profile = sourceProfile });

        RecommendationLearningOperationalService sut = new(
            Mock.Of<IRecommendationRepository>(),
            profiles.Object,
            Mock.Of<IRecommendationLearningAnalyzer>(),
            new RecommendationLearningBuildGate());

        RecommendationLearningProfile rolledBack = await sut.RollbackAsync(
            tenantId,
            workspaceId,
            projectId,
            profileId,
            CancellationToken.None);

        rolledBack.CategoryWeights["Security"].Should().Be(1.1);
        profiles.Verify(p => p.SaveAsync(It.IsAny<RecommendationLearningProfile>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
