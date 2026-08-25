using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopCacheHitPublishGuardTests
{
    [Fact]
    public void SuppressUnpublishedCacheHit_sets_skip_reason_when_publish_requested_and_cached_result_was_not_published()
    {
        ClosedLoopReasoningRequest request = new() { PublishToProduct = true };
        ClosedLoopReasoningResult cached = new() { PublishedToProduct = false };

        ClosedLoopCacheHitPublishGuard.SuppressUnpublishedCacheHit(request, cached);

        cached.PublishedToProduct.Should().BeFalse();
        cached.PublishSkipReason.Should().Be(ClosedLoopCacheHitPublishGuard.SkipReason);
    }

    [Fact]
    public void SuppressUnpublishedCacheHit_leaves_already_published_cache_entry_unchanged()
    {
        ClosedLoopReasoningRequest request = new() { PublishToProduct = true };
        ClosedLoopReasoningResult cached = new()
        {
            PublishedToProduct = true,
            PublishSkipReason = null,
        };

        ClosedLoopCacheHitPublishGuard.SuppressUnpublishedCacheHit(request, cached);

        cached.PublishedToProduct.Should().BeTrue();
        cached.PublishSkipReason.Should().BeNull();
    }

    [Fact]
    public void SuppressUnpublishedCacheHit_is_noop_when_publish_was_not_requested()
    {
        ClosedLoopReasoningRequest request = new() { PublishToProduct = false };
        ClosedLoopReasoningResult cached = new() { PublishedToProduct = false };

        ClosedLoopCacheHitPublishGuard.SuppressUnpublishedCacheHit(request, cached);

        cached.PublishSkipReason.Should().BeNull();
    }
}
