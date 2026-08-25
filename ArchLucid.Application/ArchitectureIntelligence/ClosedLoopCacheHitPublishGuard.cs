using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Cache hits must not publish product findings unless the original run already published after a live adversarial pass.
/// </summary>
public static class ClosedLoopCacheHitPublishGuard
{
    public const string SkipReason =
        "Cache hit does not publish product findings without a fresh adversarial pass.";

    public static void SuppressUnpublishedCacheHit(
        ClosedLoopReasoningRequest request,
        ClosedLoopReasoningResult cached)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(cached);

        if (!request.PublishToProduct || cached.PublishedToProduct)
            return;

        cached.PublishSkipReason = SkipReason;
    }
}
