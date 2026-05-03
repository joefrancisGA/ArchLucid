namespace ArchLucid.Core.CustomerSuccess;

/// <summary>
///     Deterministic 1–5 dimension scores for materialized <c>dbo.TenantHealthScores</c> (stickiness-weighted worker).
/// </summary>
public static class TenantHealthScoringCalculator
{
    /// <summary>Maps weekly run volume, commits, and distinct audit actors into engagement (1–5).</summary>
    public static decimal EngagementScore(int runsLast7Days, int commitsLast7Days, int distinctActorsLast7Days)
    {
        decimal baseScore = runsLast7Days switch
        {
            0 => 1.0M,
            <= 2 => 2.0M,
            <= 5 => 3.0M,
            <= 9 => 4.0M,
            _ => 5.0M
        };

        decimal boost = 0.0M;

        if (commitsLast7Days > 0)
            boost += 0.4M;

        if (distinctActorsLast7Days >= 2)
            boost += 0.4M;

        if (distinctActorsLast7Days >= 4)
            boost += 0.2M;

        return ClampDimension(baseScore + boost);
    }

    /// <summary>Breadth from durable audit signals (exports, compare, replay, graph/provenance reads).</summary>
    public static decimal BreadthScore(int breadthEventsLast30Days) => breadthEventsLast30Days switch
    {
        0 => 1.0M,
        <= 3 => 2.5M,
        <= 10 => 3.5M,
        <= 30 => 4.2M,
        _ => 5.0M
    };

    /// <summary>
    ///     Quality from product-learning disposition mix (90d). Returns neutral (3) when no signals yet — not a penalty.
    /// </summary>
    public static decimal QualityScore(int totalSignalsLast90Days, int trustedSignalsLast90Days)
    {
        if (totalSignalsLast90Days <= 0)
            return 3.0M;

        double ratio = trustedSignalsLast90Days / (double)Math.Max(1, totalSignalsLast90Days);

        return ratio switch
        {
            >= 0.75 => 5.0M,
            >= 0.50 => 4.0M,
            >= 0.35 => 3.0M,
            >= 0.10 => 2.0M,
            _ => 1.0M
        };
    }

    /// <summary>Governance depth from approved requests in the trailing 30 days.</summary>
    public static decimal GovernanceScore(int approvedRequestsLast30Days) => approvedRequestsLast30Days switch
    {
        0 => 2.0M,
        <= 2 => 3.0M,
        <= 5 => 4.0M,
        _ => 5.0M
    };

    /// <summary>Support remains neutral until a ticketing integration exists; callers pass static 3.</summary>
    public static decimal NeutralSupportScore() => 3.0M;

    public static decimal CompositeScore(
        decimal engagement,
        decimal breadth,
        decimal quality,
        decimal governance,
        decimal support)
        => Math.Round(
            0.30M * engagement
            + 0.20M * breadth
            + 0.15M * quality
            + 0.20M * governance
            + 0.15M * support,
            2,
            MidpointRounding.AwayFromZero);

    private static decimal ClampDimension(decimal value)
    {
        if (value < 1.0M)
            return 1.0M;

        return value > 5.0M ? 5.0M : Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }
}
