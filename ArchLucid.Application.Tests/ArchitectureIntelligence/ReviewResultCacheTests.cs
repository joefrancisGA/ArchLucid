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

    [Fact]
    public void Set_strips_product_payloads_from_stored_entry()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-payload-stripped" };
        ClosedLoopReasoningResult stored = new()
        {
            RunId = "run-payload",
            MustNotFailViolations =
            [
                new MustNotFailViolation
                {
                    Class = MustNotFailClass.FabricatedCitation,
                    Message = "Blocked",
                    Blocked = true,
                    FindingId = "finding-1",
                },
            ],
            ProductFindings =
            [
                new ArchLucid.Contracts.Findings.Finding
                {
                    FindingId = "product-finding-1",
                    Title = "Gap",
                    FindingType = "gap",
                    Category = "security",
                    EngineType = "specialist",
                    Severity = ArchLucid.Contracts.Findings.FindingSeverity.Error,
                    Rationale = "Rationale.",
                },
            ],
        };

        cache.Set(manifest, stored);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();

        cached!.ProductFindings.Should().BeEmpty();
        cached.MustNotFailViolations[0].Blocked = false;

        cache.TryGet(manifest, out ClosedLoopReasoningResult? again).Should().BeTrue();
        again!.MustNotFailViolations[0].Blocked.Should().BeTrue();
    }

    [Fact]
    public void TryGet_isolates_model_diff_after_model_and_entries_from_stored_entry()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-model-diff" };
        ClosedLoopReasoningResult stored = new()
        {
            ModelDiffs =
            [
                new ArchitectureModelDiff
                {
                    RecommendationId = "rec-1",
                    Entries =
                    [
                        new ArchitectureModelDiffEntry
                        {
                            ElementId = "el-1",
                            ChangeKind = "Added",
                            ElementKind = ArchitectureElementKind.Component,
                            Description = "Added API",
                        },
                    ],
                    BeforeModel = new ArchitectureKnowledgeModel
                    {
                        Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
                    },
                    AfterModel = new ArchitectureKnowledgeModel
                    {
                        Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
                    },
                },
            ],
        };

        cache.Set(manifest, stored);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();

        cached!.ModelDiffs[0].Entries[0].Description = "mutated";
        cached.ModelDiffs[0].AfterModel.Elements[0].Name = "mutated";

        cache.TryGet(manifest, out ClosedLoopReasoningResult? again).Should().BeTrue();
        again!.ModelDiffs[0].Entries[0].Description.Should().Be("Added API");
        again.ModelDiffs[0].AfterModel.Elements[0].Name.Should().Be("API");
    }

    [Fact]
    public void Set_stores_result_without_publish_side_effects()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-publish-sanitized" };
        ClosedLoopReasoningResult stored = new()
        {
            RunId = "run-published",
            PublishedToProduct = true,
            PublishedFindingsSnapshotId = Guid.NewGuid(),
            PublishedRecommendationCount = 5,
            PublishSkipReason = "published",
            ProductFindings =
            [
                new ArchLucid.Contracts.Findings.Finding
                {
                    FindingId = "product-finding-1",
                    Title = "Gap",
                    FindingType = "gap",
                    Category = "security",
                    EngineType = "specialist",
                    Severity = ArchLucid.Contracts.Findings.FindingSeverity.Error,
                    Rationale = "Rationale.",
                },
            ],
        };

        cache.Set(manifest, stored);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();

        cached!.PublishedToProduct.Should().BeFalse();
        cached.PublishedFindingsSnapshotId.Should().BeNull();
        cached.PublishedRecommendationCount.Should().Be(0);
        cached.PublishSkipReason.Should().BeNull();
        cached.ProductFindings.Should().BeEmpty();
    }

    [Fact]
    public void InvalidateForRun_removes_entries_for_matching_run_id_regardless_of_guid_format()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-run-invalidated" };
        ClosedLoopReasoningResult stored = new() { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };

        cache.Set(manifest, stored);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeTrue();

        cache.InvalidateForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeFalse();
    }

    [Fact]
    public async Task CoalesceAsync_pins_storage_key_until_leader_completes()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-pinned" };

        cache.Set(manifest, new ClosedLoopReasoningResult { RunId = "pinned-run" });
        cache.TryGet(manifest, out ClosedLoopReasoningResult? pinned).Should().BeTrue();
        pinned!.RunId.Should().Be("pinned-run");

        Task<ClosedLoopReasoningResult> inflight = cache.CoalesceAsync(
            manifest,
            async cancellationToken =>
            {
                await Task.Delay(300, cancellationToken);
                return new ClosedLoopReasoningResult { RunId = "leader-run" };
            },
            CancellationToken.None);

        for (int index = 0; index < 150; index++)
        {
            cache.Set(
                new ReviewCacheDependencyManifest { ContentHash = $"overflow-{index}" },
                new ClosedLoopReasoningResult());
        }

        cache.TryGet(manifest, out ClosedLoopReasoningResult? stillPinned).Should().BeTrue();
        stillPinned!.RunId.Should().Be("pinned-run");

        await inflight;
    }
}
