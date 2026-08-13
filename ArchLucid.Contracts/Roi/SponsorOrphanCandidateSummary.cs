namespace ArchLucid.Contracts.Roi;

/// <summary>
///     Server-authoritative orphan-candidate rollup for the sponsor dashboard (TB-103).
/// </summary>
public sealed class SponsorOrphanCandidateSummary
{
    /// <summary>Count of <c>OrphanedAzureResource</c> findings on the evidence run.</summary>
    public int CandidateCount
    {
        get;
        set;
    }

    /// <summary>
    ///     Annualized USD opportunity when computable from finding payloads; null when not estimated.
    /// </summary>
    public decimal? AnnualSavingsUsd
    {
        get;
        set;
    }

    /// <summary>Committed run id (hex) used for the count.</summary>
    public string? EvidenceRunId
    {
        get;
        set;
    }
}
