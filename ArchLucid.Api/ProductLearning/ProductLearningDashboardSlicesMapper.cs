using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Api.ProductLearning;

/// <summary>Maps one <see cref="LearningDashboardSummary" /> into UI slice DTOs without recomputing rollups.</summary>
public static class ProductLearningDashboardSlicesMapper
{
    public static ProductLearningDashboardSummaryResponse MapSummary(LearningDashboardSummary full) =>
        new()
        {
            GeneratedUtc = full.GeneratedUtc,
            TenantId = full.TenantId,
            WorkspaceId = full.WorkspaceId,
            ProjectId = full.ProjectId,
            TotalSignalsInScope = full.TotalSignalsInScope,
            DistinctRunsTouched = full.DistinctRunsTouched,
            TopAggregateCount = full.TopAggregates.Count,
            ArtifactTrendCount = full.ArtifactTrends.Count,
            ImprovementOpportunityCount = full.Opportunities.Count,
            TriageQueueItemCount = full.TriageQueue.Count,
            SummaryNotes = full.SummaryNotes
        };

    public static ProductLearningImprovementOpportunitiesResponse MapOpportunities(LearningDashboardSummary full) =>
        new()
        {
            GeneratedUtc = full.GeneratedUtc,
            Opportunities = full.Opportunities
        };

    public static ProductLearningArtifactOutcomeTrendsResponse MapTrends(LearningDashboardSummary full) =>
        new()
        {
            GeneratedUtc = full.GeneratedUtc,
            Trends = full.ArtifactTrends
        };

    public static ProductLearningTriageQueueResponse MapTriage(LearningDashboardSummary full) =>
        new()
        {
            GeneratedUtc = full.GeneratedUtc,
            Items = full.TriageQueue
        };

    public static ProductLearningDashboardBundleResponse MapBundle(LearningDashboardSummary full) =>
        new()
        {
            Summary = MapSummary(full),
            Opportunities = MapOpportunities(full),
            Trends = MapTrends(full),
            Triage = MapTriage(full)
        };
}
