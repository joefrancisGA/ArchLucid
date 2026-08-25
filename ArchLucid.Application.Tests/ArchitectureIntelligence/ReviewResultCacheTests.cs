using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ReviewResultCacheTests
{
    [Fact]
    public void TryGet_returns_false_after_entry_expires()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 8, 25, 12, 0, 0, TimeSpan.Zero));
        ReviewResultCache cache = new(clock);
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-1" };
        ClosedLoopReasoningResult result = new() { RunId = "run-1" };

        cache.Set(manifest, result);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();
        cached!.RunId.Should().Be("run-1");

        clock.Advance(TimeSpan.FromHours(5));
        cache.TryGet(manifest, out ClosedLoopReasoningResult? expired).Should().BeFalse();
        expired.Should().BeNull();
    }

    [Fact]
    public void TryGet_returns_snapshot_isolated_from_stored_entry()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-isolated" };
        ClosedLoopReasoningResult stored = new()
        {
            RunId = "run-isolated",
            Model = new ArchitectureKnowledgeModel
            {
                ModelId = "model-isolated",
                Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
            },
        };

        cache.Set(manifest, stored);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();

        cached!.CacheHit = true;
        cached.Model.Elements[0].Name = "mutated";

        cache.TryGet(manifest, out ClosedLoopReasoningResult? again).Should().BeTrue();
        again!.CacheHit.Should().BeFalse();
        again.Model.Elements[0].Name.Should().Be("API");
    }
}
