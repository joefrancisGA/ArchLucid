namespace ArchLucid.Persistence.Caching;

/// <summary>Reference-type cache slot for <c>GET /api/auth/me</c> committed-review UX flag (TB-2162 hot path).</summary>
public sealed class CommittedArchitectureReviewFlagCacheEntry
{
    public bool HasCommitted
    {
        get;
        init;
    }
}
