using ArchiForge.Decisioning.Advisory.Learning;
using ArchiForge.Decisioning.Advisory.Workflow;

using FluentAssertions;

namespace ArchiForge.Decisioning.Tests;

/// <summary>
/// Unit tests for <see cref="RecommendationLearningAnalyzer"/>: stat aggregation,
/// weight clamping, signal-type inference, and note generation.
/// </summary>
[Trait("Category", "Unit")]
public sealed class RecommendationLearningAnalyzerTests
{
    private readonly RecommendationLearningAnalyzer _sut = new();

    private static readonly Guid TenantId = Guid.NewGuid();
    private static readonly Guid WorkspaceId = Guid.NewGuid();
    private static readonly Guid ProjectId = Guid.NewGuid();

    // ──────────────────────────────────────────────────────────────────────────
    // Empty input
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void BuildProfile_EmptyList_ReturnsEmptyStatsAndWeights()
    {
        RecommendationLearningProfile profile = _sut.BuildProfile(TenantId, WorkspaceId, ProjectId, []);

        profile.CategoryStats.Should().BeEmpty();
        profile.UrgencyStats.Should().BeEmpty();
        profile.CategoryWeights.Should().BeEmpty();
        profile.Notes.Should().NotBeEmpty("notes are always written");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CategoryStats grouping
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void BuildProfile_TwoCategories_ProducesOneBucketEach()
    {
        IReadOnlyList<RecommendationRecord> records =
        [
            new() { Category = "Security", Urgency = "High", Status = RecommendationStatus.Accepted, Title = "s1", RecommendationId = Guid.NewGuid() },
            new() { Category = "Security", Urgency = "Low",  Status = RecommendationStatus.Rejected, Title = "s2", RecommendationId = Guid.NewGuid() },
            new() { Category = "Cost",     Urgency = "Low",  Status = RecommendationStatus.Proposed, Title = "c1", RecommendationId = Guid.NewGuid() }
        ];

        RecommendationLearningProfile profile = _sut.BuildProfile(TenantId, WorkspaceId, ProjectId, records);

        profile.CategoryStats.Should().HaveCount(2);

        RecommendationOutcomeStats? sec = profile.CategoryStats.FirstOrDefault(x => x.Key == "Security");
        sec.Should().NotBeNull();
        sec.ProposedCount.Should().Be(2);
        sec.AcceptedCount.Should().Be(1);
        sec.RejectedCount.Should().Be(1);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // UrgencyStats is independent of CategoryStats
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void BuildProfile_UrgencyStatsGroupedSeparately()
    {
        IReadOnlyList<RecommendationRecord> records =
        [
            new() { Category = "Security", Urgency = "High", Status = RecommendationStatus.Accepted, Title = "a", RecommendationId = Guid.NewGuid() },
            new() { Category = "Cost",     Urgency = "High", Status = RecommendationStatus.Proposed, Title = "b", RecommendationId = Guid.NewGuid() },
            new() { Category = "Security", Urgency = "Low",  Status = RecommendationStatus.Proposed, Title = "c", RecommendationId = Guid.NewGuid() }
        ];

        RecommendationLearningProfile profile = _sut.BuildProfile(TenantId, WorkspaceId, ProjectId, records);

        profile.UrgencyStats.Should().HaveCount(2, "two distinct urgency values");
        RecommendationOutcomeStats? high = profile.UrgencyStats.FirstOrDefault(x => x.Key == "High");
        high.Should().NotBeNull();
        high.ProposedCount.Should().Be(2);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Weight clamping
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void BuildProfile_AllAcceptedAndImplemented_WeightClampsToTwo()
    {
        // All accepted + implemented → high scores → weight capped at 2.0
        IReadOnlyList<RecommendationRecord> records =
        [
            new() { Category = "Security", Urgency = "High", Status = RecommendationStatus.Accepted,    Title = "a", RecommendationId = Guid.NewGuid() },
            new() { Category = "Security", Urgency = "High", Status = RecommendationStatus.Implemented, Title = "b", RecommendationId = Guid.NewGuid() }
        ];

        RecommendationLearningProfile profile = _sut.BuildProfile(TenantId, WorkspaceId, ProjectId, records);

        double weight = profile.CategoryWeights["Security"];
        weight.Should().BeLessThanOrEqualTo(2.0, "weight is clamped at 2.0");
        weight.Should().BeGreaterThanOrEqualTo(0.5);
    }

    [Fact]
    public void BuildProfile_AllRejected_WeightClampsToHalf()
    {
        // All rejected → heavy penalty → weight clamped at 0.5
        IReadOnlyList<RecommendationRecord> records =
        [
            new() { Category = "Cost", Urgency = "Low", Status = RecommendationStatus.Rejected, Title = "a", RecommendationId = Guid.NewGuid() },
            new() { Category = "Cost", Urgency = "Low", Status = RecommendationStatus.Rejected, Title = "b", RecommendationId = Guid.NewGuid() }
        ];

        RecommendationLearningProfile profile = _sut.BuildProfile(TenantId, WorkspaceId, ProjectId, records);

        double weight = profile.CategoryWeights["Cost"];
        weight.Should().BeGreaterThanOrEqualTo(0.5, "weight is clamped at 0.5 floor");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Signal-type inference
    // ──────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("Security",    "SecurityGap")]
    [InlineData("Compliance",  "ComplianceGap")]
    [InlineData("Requirement", "UncoveredRequirement")]
    [InlineData("Topology",    "TopologyGap")]
    [InlineData("Cost",        "CostRisk")]
    [InlineData("Unknown",     "General")]
    public void BuildProfile_SignalTypeInferred_CorrectlyByCategory(string category, string expectedSignalType)
    {
        IReadOnlyList<RecommendationRecord> records =
        [
            new()
            {
                Category = category,
                Urgency = "Medium",
                Status = RecommendationStatus.Proposed,
                Title = "rec",
                RecommendationId = Guid.NewGuid()
            }
        ];

        RecommendationLearningProfile profile = _sut.BuildProfile(TenantId, WorkspaceId, ProjectId, records);

        profile.SignalTypeStats.Should().ContainSingle(x => x.Key == expectedSignalType);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Notes are always populated
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void BuildProfile_NotesContainCountSummaries()
    {
        IReadOnlyList<RecommendationRecord> records =
        [
            new() { Category = "Security", Urgency = "High", Status = RecommendationStatus.Proposed, Title = "r", RecommendationId = Guid.NewGuid() }
        ];

        RecommendationLearningProfile profile = _sut.BuildProfile(TenantId, WorkspaceId, ProjectId, records);

        profile.Notes.Should().Contain(n => n.Contains("1 recommendation"));
        profile.Notes.Should().Contain(n => n.Contains("category weight"));
    }
}
