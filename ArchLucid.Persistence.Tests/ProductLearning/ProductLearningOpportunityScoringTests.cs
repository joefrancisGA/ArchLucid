using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Persistence.Tests.ProductLearning;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
[Trait("ChangeSet", "58R")]
public sealed class ProductLearningOpportunityScoringTests
{
    [SkippableFact]
    public void ComputeAggregateBadScore_weights_reject_followup_revise_and_no_trusted_bonus()
    {
        FeedbackAggregate agg = new()
        {
            AggregateKey = "k",
            SubjectTypeOrWorkflowArea = "RunOutput",
            TotalSignalCount = 3,
            TrustedCount = 0,
            RejectedCount = 1,
            NeedsFollowUpCount = 1,
            RevisedCount = 1,
            FirstSignalRecordedUtc = TimeProvider.System.UtcNowDateTime(),
            LastSignalRecordedUtc = TimeProvider.System.UtcNowDateTime()
        };

        int score = ProductLearningOpportunityScoring.ComputeAggregateBadScore(agg);

        // 1*4 + 1*3 + 1*2 + 2 (no-trusted multi-signal bonus) = 11
        score.Should().Be(11);
    }

    [SkippableFact]
    public void SeverityFromBadScore_maps_to_high_medium_low_bands()
    {
        ProductLearningOpportunityScoring.SeverityFromBadScore(11).Should().Be("Medium");
        ProductLearningOpportunityScoring.SeverityFromBadScore(12).Should().Be("High");
        ProductLearningOpportunityScoring.SeverityFromBadScore(5).Should().Be("Low");
    }

    [SkippableFact]
    public void ComputeTrendNegativeMass_sums_reject_revise_followup()
    {
        ArtifactOutcomeTrend trend = new()
        {
            TrendKey = "t",
            ArtifactTypeOrHint = "x",
            AcceptedOrTrustedCount = 5,
            RejectionCount = 1,
            RevisionCount = 2,
            NeedsFollowUpCount = 1,
            DistinctRunCount = 2,
            FirstSeenUtc = TimeProvider.System.UtcNowDateTime(),
            LastSeenUtc = TimeProvider.System.UtcNowDateTime()
        };

        ProductLearningOpportunityScoring.ComputeTrendNegativeMass(trend).Should().Be(4);
        ProductLearningOpportunityScoring.TotalTrendSignals(trend).Should().Be(9);
    }

    [SkippableFact]
    public void ComputePlanPriorityScore_orders_by_severity_rank_and_evidence()
    {
        ImprovementOpportunity high = new()
        {
            Severity = "High",
            PriorityRank = 1,
            EvidenceSignalCount = 10,
        };
        ImprovementOpportunity medium = new()
        {
            Severity = "Medium",
            PriorityRank = 1,
            EvidenceSignalCount = 10,
        };
        ImprovementOpportunity low = new()
        {
            Severity = "Low",
            PriorityRank = 1,
            EvidenceSignalCount = 10,
        };

        int highScore = ProductLearningOpportunityScoring.ComputePlanPriorityScore(high);
        int mediumScore = ProductLearningOpportunityScoring.ComputePlanPriorityScore(medium);
        int lowScore = ProductLearningOpportunityScoring.ComputePlanPriorityScore(low);

        highScore.Should().BeGreaterThan(mediumScore);
        mediumScore.Should().BeGreaterThan(lowScore);
    }

    [SkippableFact]
    public void BuildPlanPriorityExplanation_includes_severity_rank_and_evidence()
    {
        ImprovementOpportunity opportunity = new()
        {
            Severity = "Medium",
            PriorityRank = 3,
            EvidenceSignalCount = 7,
        };

        string explanation = ProductLearningOpportunityScoring.BuildPlanPriorityExplanation(opportunity);

        explanation.Should().Contain("severity=Medium");
        explanation.Should().Contain("opportunityRank=3");
        explanation.Should().Contain("evidenceSignals=7");
    }

    [SkippableFact]
    public void MapAggregateToOpportunity_uses_pattern_key_title_when_present()
    {
        FeedbackAggregate aggregate = new()
        {
            AggregateKey = "agg-1",
            PatternKey = "retry-storm",
            SubjectTypeOrWorkflowArea = "RunOutput",
            TotalSignalCount = 2,
            DistinctRunCount = 1,
            TrustedCount = 0,
            RejectedCount = 1,
            FirstSignalRecordedUtc = TimeProvider.System.UtcNowDateTime(),
            LastSignalRecordedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        ImprovementOpportunity opportunity =
            ProductLearningOpportunityScoring.MapAggregateToOpportunity(aggregate, badScore: 8, priorityRank: 2);

        opportunity.Title.Should().StartWith("Feedback pattern:");
        opportunity.Title.Should().Contain("retry-storm");
        opportunity.Severity.Should().Be("Medium");
        opportunity.EvidenceSignalCount.Should().Be(2);
    }

    [SkippableFact]
    public void MapAggregateToOpportunity_uses_workflow_area_title_when_pattern_key_missing()
    {
        FeedbackAggregate aggregate = new()
        {
            AggregateKey = "agg-2",
            PatternKey = null,
            SubjectTypeOrWorkflowArea = "CommitReview",
            TotalSignalCount = 1,
            DistinctRunCount = 1,
            FirstSignalRecordedUtc = TimeProvider.System.UtcNowDateTime(),
            LastSignalRecordedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        ImprovementOpportunity opportunity =
            ProductLearningOpportunityScoring.MapAggregateToOpportunity(aggregate, badScore: 5, priorityRank: 4);

        opportunity.Title.Should().StartWith("Workflow friction:");
        opportunity.Title.Should().Contain("CommitReview");
    }

    [SkippableFact]
    public void MapTrendToOpportunity_builds_workflow_friction_title()
    {
        ArtifactOutcomeTrend trend = new()
        {
            TrendKey = "trend-1",
            ArtifactTypeOrHint = "ArchitectureReview",
            RejectionCount = 2,
            DistinctRunCount = 3,
            FirstSeenUtc = TimeProvider.System.UtcNowDateTime(),
            LastSeenUtc = TimeProvider.System.UtcNowDateTime(),
        };

        ImprovementOpportunity opportunity =
            ProductLearningOpportunityScoring.MapTrendToOpportunity(trend, badScore: 12, priorityRank: 1);

        opportunity.Title.Should().Contain("ArchitectureReview");
        opportunity.Severity.Should().Be("High");
        opportunity.SuggestedOwnerRole.Should().Be("Architecture");
        opportunity.SourceAggregateKey.Should().Be("trend:trend-1");
    }

    [SkippableFact]
    public void ComputePlanPriorityScore_throws_when_opportunity_null()
    {
        Action act = () => ProductLearningOpportunityScoring.ComputePlanPriorityScore(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
