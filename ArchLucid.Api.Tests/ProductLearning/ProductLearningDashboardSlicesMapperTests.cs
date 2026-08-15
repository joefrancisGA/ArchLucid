using ArchLucid.Api.ProductLearning;
using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Api.Tests.ProductLearning;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProductLearningDashboardSlicesMapperTests
{
    [SkippableFact]
    public void MapBundle_preserves_slice_fields_from_one_summary()
    {
        DateTime generatedUtc = new(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);
        Guid tenantId = Guid.NewGuid();

        LearningDashboardSummary full = new()
        {
            GeneratedUtc = generatedUtc,
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            TotalSignalsInScope = 3,
            DistinctRunsTouched = 2,
            TopAggregates = [new FeedbackAggregate { AggregateKey = "a" }],
            ArtifactTrends = [new ArtifactOutcomeTrend { TrendKey = "trend" }],
            Opportunities = [new ImprovementOpportunity { Title = "opp" }],
            TriageQueue = [new TriageQueueItem { Title = "triage" }],
            SummaryNotes = ["notes"]
        };

        ProductLearningDashboardBundleResponse bundle = ProductLearningDashboardSlicesMapper.MapBundle(full);

        bundle.Summary.GeneratedUtc.Should().Be(generatedUtc);
        bundle.Summary.TenantId.Should().Be(tenantId);
        bundle.Summary.TopAggregateCount.Should().Be(1);
        bundle.Opportunities.Opportunities.Should().HaveCount(1);
        bundle.Trends.Trends.Should().HaveCount(1);
        bundle.Triage.Items.Should().HaveCount(1);
    }
}
