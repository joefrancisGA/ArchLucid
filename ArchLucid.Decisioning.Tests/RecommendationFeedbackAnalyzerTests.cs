using ArchiForge.Decisioning.Advisory.Workflow;
using ArchiForge.Persistence.Advisory;

using FluentAssertions;

using Moq;

namespace ArchiForge.Decisioning.Tests;

/// <summary>
/// Unit tests for <see cref="RecommendationFeedbackAnalyzer.GetStatusCountsByCategoryAsync"/>:
/// empty list, single bucket, multi-bucket aggregation, and the batch-cap boundary.
/// </summary>
[Trait("Category", "Unit")]
public sealed class RecommendationFeedbackAnalyzerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _workspaceId = Guid.NewGuid();
    private readonly Guid _projectId = Guid.NewGuid();

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private (RecommendationFeedbackAnalyzer Sut, Mock<IRecommendationRepository> Repo)
        Build(IReadOnlyList<RecommendationRecord> rows)
    {
        Mock<IRecommendationRepository> repo = new();

        repo.Setup(x => x.ListByScopeAsync(
                _tenantId, _workspaceId, _projectId,
                It.IsAny<string?>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(rows);

        RecommendationFeedbackAnalyzer sut = new(repo.Object);
        return (sut, repo);
    }

    private static RecommendationRecord Rec(string category, string status) => new()
    {
        RecommendationId = Guid.NewGuid(),
        Title = "rec",
        Category = category,
        Status = status
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Empty list
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStatusCountsByCategoryAsync_EmptyList_ReturnsEmptyDictionary()
    {
        (RecommendationFeedbackAnalyzer sut, _) = Build([]);

        IReadOnlyDictionary<string, int> result = await sut.GetStatusCountsByCategoryAsync(
            _tenantId, _workspaceId, _projectId, CancellationToken.None);

        result.Should().BeEmpty();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Single bucket: one category × one status
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStatusCountsByCategoryAsync_SingleBucket_CorrectKey()
    {
        (RecommendationFeedbackAnalyzer sut, _) = Build(
        [
            Rec("Security", RecommendationStatus.Proposed),
            Rec("Security", RecommendationStatus.Proposed)
        ]);

        IReadOnlyDictionary<string, int> result = await sut.GetStatusCountsByCategoryAsync(
            _tenantId, _workspaceId, _projectId, CancellationToken.None);

        result.Should().ContainSingle();
        result["Security:Proposed"].Should().Be(2);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Multi-bucket: two categories × two statuses
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStatusCountsByCategoryAsync_MultipleBuckets_AllCounted()
    {
        (RecommendationFeedbackAnalyzer sut, _) = Build(
        [
            Rec("Security", RecommendationStatus.Proposed),
            Rec("Security", RecommendationStatus.Accepted),
            Rec("Security", RecommendationStatus.Accepted),
            Rec("Cost", RecommendationStatus.Rejected)
        ]);

        IReadOnlyDictionary<string, int> result = await sut.GetStatusCountsByCategoryAsync(
            _tenantId, _workspaceId, _projectId, CancellationToken.None);

        result.Should().HaveCount(3);
        result["Security:Proposed"].Should().Be(1);
        result["Security:Accepted"].Should().Be(2);
        result["Cost:Rejected"].Should().Be(1);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Repository is called with the AnalyticsBatchCap (1 000)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStatusCountsByCategoryAsync_PassesBatchCapToRepository()
    {
        (RecommendationFeedbackAnalyzer sut, Mock<IRecommendationRepository> repo) = Build([]);

        await sut.GetStatusCountsByCategoryAsync(
            _tenantId, _workspaceId, _projectId, CancellationToken.None);

        repo.Verify(
            x => x.ListByScopeAsync(
                _tenantId, _workspaceId, _projectId,
                null, 1000, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Key format is "Category:Status" (case-sensitive — no normalisation)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStatusCountsByCategoryAsync_KeyFormat_CategoryColonStatus()
    {
        (RecommendationFeedbackAnalyzer sut, _) = Build([Rec("Topology", RecommendationStatus.Deferred)]);

        IReadOnlyDictionary<string, int> result = await sut.GetStatusCountsByCategoryAsync(
            _tenantId, _workspaceId, _projectId, CancellationToken.None);

        result.Should().ContainKey("Topology:Deferred");
    }
}
