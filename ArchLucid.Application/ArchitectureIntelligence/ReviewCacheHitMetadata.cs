namespace ArchLucid.Application.ArchitectureIntelligence;

internal readonly struct ReviewCacheHitMetadata
{
    public ReviewCacheHitMetadata(bool isReviewCacheHit, string? reuseReason)
    {
        IsReviewCacheHit = isReviewCacheHit;
        ReuseReason = reuseReason;
    }

    public bool IsReviewCacheHit
    {
        get;
    }

    public string? ReuseReason
    {
        get;
    }
}
