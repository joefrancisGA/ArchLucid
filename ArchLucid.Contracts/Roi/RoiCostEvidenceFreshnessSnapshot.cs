namespace ArchLucid.Contracts.Roi;

/// <summary>Operator-facing cost evidence freshness metadata for ROI surfaces.</summary>
public sealed record RoiCostEvidenceFreshnessSnapshot
{
    public required string Status
    {
        get;
        init;
    }

    /// <summary>Latest extractor package collection timestamp in scope when present.</summary>
    public DateTime? LatestCollectionTimestampUtc
    {
        get;
        init;
    }

    public required int StaleAfterDays
    {
        get;
        init;
    }
}
