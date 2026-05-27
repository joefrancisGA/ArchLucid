namespace ArchLucid.Contracts.Operations;

/// <summary>
///     Founder-facing trial funnel counts with estimated first-review LLM COGS bands (Batch B / item 20).
///     Dollar fields are estimates from token usage × configured rates — not invoiced Azure cost.
/// </summary>
public sealed class TrialFunnelOperationalSummaryResponse
{
    public long ActiveSelfServiceTrials
    {
        get;
        init;
    }

    public int SignupAttempts30Days
    {
        get;
        init;
    }

    public int SignupFailures30Days
    {
        get;
        init;
    }

    public int FirstCommittedReviews30Days
    {
        get;
        init;
    }

    public int TrialConversions30Days
    {
        get;
        init;
    }

    public int BillingCheckouts30Days
    {
        get;
        init;
    }

    /// <summary>Median signup→first-commit seconds for trial tenants in the trailing window (null when no samples).</summary>
    public double? MedianSignupToFirstCommitSeconds
    {
        get;
        init;
    }

    /// <summary>Estimated LLM USD per successful first committed review (low band).</summary>
    public decimal? EstimatedFirstReviewCogsUsdLow
    {
        get;
        init;
    }

    public decimal? EstimatedFirstReviewCogsUsdMid
    {
        get;
        init;
    }

    public decimal? EstimatedFirstReviewCogsUsdHigh
    {
        get;
        init;
    }

    /// <summary>Always <c>estimated</c> for sponsor-safe copy.</summary>
    public string CogsBasisLabel
    {
        get;
        init;
    } = "estimated";

    public int LlmBudgetCutoffEvents30Days
    {
        get;
        init;
    }
}
