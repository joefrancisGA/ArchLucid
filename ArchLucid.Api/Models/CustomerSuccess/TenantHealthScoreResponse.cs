namespace ArchLucid.Api.Models.CustomerSuccess;

/// <summary>Materialized tenant health dimensions for operator dashboards.</summary>
public sealed class TenantHealthScoreResponse
{
    public bool IsCalculated
    {
        get; init;
    }

    public decimal? EngagementScore
    {
        get; init;
    }

    public decimal? BreadthScore
    {
        get; init;
    }

    public decimal? QualityScore
    {
        get; init;
    }

    public decimal? GovernanceScore
    {
        get; init;
    }

    public decimal? SupportScore
    {
        get; init;
    }

    public decimal? CompositeScore
    {
        get; init;
    }

    public DateTimeOffset? UpdatedUtc
    {
        get; init;
    }
}
