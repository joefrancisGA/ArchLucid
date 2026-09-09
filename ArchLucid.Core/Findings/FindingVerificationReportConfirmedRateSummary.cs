namespace ArchLucid.Core.Findings;

/// <summary>ADR 0062 aggregate counts for verification report exports (TB-2035).</summary>
public sealed class FindingVerificationReportConfirmedRateSummary
{
    public int TotalResults
    {
        get;
        init;
    }

    public int MaterializedCount
    {
        get;
        init;
    }

    public int MitigatedCount
    {
        get;
        init;
    }

    public int NotObservedCount
    {
        get;
        init;
    }

    public int NotVerifiableCount
    {
        get;
        init;
    }

    public int VerifiableDenominator
    {
        get;
        init;
    }

    public int ConfirmedNumerator
    {
        get;
        init;
    }

    /// <summary>(Materialized + Mitigated) / verifiable findings; null when denominator is zero.</summary>
    public double? ConfirmedRate
    {
        get;
        init;
    }
}
