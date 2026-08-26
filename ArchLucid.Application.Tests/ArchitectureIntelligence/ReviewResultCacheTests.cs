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
        cached!.RunId.Should().Be("run1");

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
        cached.PublishBlocked.Should().BeFalse();
        cached.CacheHit.Should().BeFalse();
        cached.ProductFindings.Should().BeEmpty();
    }

    [Fact]
    public void Set_skips_insert_when_sanitized_run_id_matches_tombstone()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest pinnedManifest = new() { ContentHash = "hash-tombstone-set-sanitize" };
        string storageKey = ReviewCacheKeyBuilder.Build(pinnedManifest);

        cache.Set(pinnedManifest, new ClosedLoopReasoningResult { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" });
        cache.PinStorageKey(storageKey);
        cache.InvalidateForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        ReviewCacheDependencyManifest blockedManifest = new() { ContentHash = "hash-tombstone-set-blocked" };
        cache.Set(
            blockedManifest,
            new ClosedLoopReasoningResult { RunId = " aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa " });

        cache.TryGet(blockedManifest, out ClosedLoopReasoningResult? blocked).Should().BeFalse();
        blocked.Should().BeNull();
    }

    [Fact]
    public void InvalidateForRun_without_entries_allows_subsequent_set()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-tombstone-no-entry" };

        cache.InvalidateForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        cache.Set(
            manifest,
            new ClosedLoopReasoningResult { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" });

        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();
        cached!.RunId.Should().Be("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    }

    [Fact]
    public void InvalidateForRun_without_pinned_entries_does_not_tombstone_run_id()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-no-tombstone" };

        cache.InvalidateForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        cache.Set(
            manifest,
            new ClosedLoopReasoningResult { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" });

        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();
        cached!.RunId.Should().Be("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    }

    [Fact]
    public void InvalidateForRun_tombstone_matches_hyphenated_run_id_on_set()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-tombstone-hyphen" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        cache.Set(
            manifest,
            new ClosedLoopReasoningResult { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" });
        cache.PinStorageKey(storageKey);

        cache.InvalidateForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        cache.TryGet(manifest, out ClosedLoopReasoningResult? tombstonedWhilePinned).Should().BeFalse();
        tombstonedWhilePinned.Should().BeNull();

        cache.Set(
            manifest,
            new ClosedLoopReasoningResult { RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" });

        cache.TryGet(manifest, out ClosedLoopReasoningResult? stillBlocked).Should().BeFalse();
        stillBlocked.Should().BeNull();

        cache.UnpinStorageKey(storageKey);

        cache.TryGet(manifest, out ClosedLoopReasoningResult? flushed).Should().BeFalse();
        flushed.Should().BeNull();
    }

    [Fact]
    public void TryGet_misses_when_run_id_is_tombstoned_even_if_entry_is_pinned()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-tombstone-tryget" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        cache.Set(
            manifest,
            new ClosedLoopReasoningResult { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" });
        cache.PinStorageKey(storageKey);

        cache.InvalidateForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeFalse();

        cache.UnpinStorageKey(storageKey);
    }

    [Fact]
    public void PinStorageKey_caps_refcount_per_key()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "pin-cap-key" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        for (int index = 0; index < 80; index++)
            cache.PinStorageKey(storageKey);

        cache.Set(manifest, new ClosedLoopReasoningResult { RunId = "pinned-run" });

        for (int index = 0; index < 150; index++)
        {
            cache.Set(
                new ReviewCacheDependencyManifest { ContentHash = $"overflow-{index}" },
                new ClosedLoopReasoningResult());
        }

        cache.TryGet(manifest, out ClosedLoopReasoningResult? stillPinned).Should().BeTrue();

        for (int index = 0; index < 79; index++)
            cache.UnpinStorageKey(storageKey);

        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeTrue();

        cache.UnpinStorageKey(storageKey);
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
    public async Task CoalesceAsync_does_not_pin_storage_key_without_outer_pin_scope()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-unpinned-coalesce" };

        cache.Set(manifest, new ClosedLoopReasoningResult { RunId = "pinned-run" });
        cache.TryGet(manifest, out ClosedLoopReasoningResult? pinned).Should().BeTrue();
        pinned!.RunId.Should().Be("pinnedrun");

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

        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeFalse();

        await inflight;
    }

    [Fact]
    public void PinStorageKey_refcounts_until_last_unpin()
    {
        ReviewResultCache cache = new();

        ReviewCacheDependencyManifest manifest = new() { ContentHash = "pin-key" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        cache.PinStorageKey(storageKey);
        cache.PinStorageKey(storageKey);

        cache.Set(manifest, new ClosedLoopReasoningResult { RunId = "pinned-run" });

        cache.UnpinStorageKey(storageKey);

        for (int index = 0; index < 150; index++)
        {
            cache.Set(
                new ReviewCacheDependencyManifest { ContentHash = $"overflow-{index}" },
                new ClosedLoopReasoningResult());
        }

        cache.TryGet(manifest, out ClosedLoopReasoningResult? stillPinned).Should().BeTrue();

        cache.UnpinStorageKey(storageKey);

        cache.Set(new ReviewCacheDependencyManifest { ContentHash = "overflow-final" }, new ClosedLoopReasoningResult());
        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeFalse();
    }

    [Fact]
    public async Task CoalesceAsync_concurrent_waiters_all_receive_cache_hit_metadata()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-coalesce-hit-broadcast" };
        ClosedLoopReasoningResult stored = new()
        {
            RunId = "stored-run",
            Model = new ArchitectureKnowledgeModel { RunId = "stored-run", ModelId = "stored-model" },
        };

        cache.Set(manifest, stored);
        TaskCompletionSource leaderCanFinish = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Task<ClosedLoopReasoningResult> leader = cache.CoalesceAsync(
            manifest,
            async cancellationToken =>
            {
                if (!cache.TryGet(manifest, out ClosedLoopReasoningResult? cached) || cached is null)
                    throw new InvalidOperationException("Expected cached review result.");

                cached.CacheHit = true;
                cached.CacheReuseReason = "dependency-manifest-match";

                await leaderCanFinish.Task.WaitAsync(cancellationToken);

                return cached;
            },
            CancellationToken.None);

        await Task.Delay(50);

        Task<ClosedLoopReasoningResult> waiter = cache.CoalesceAsync(
            manifest,
            _ => Task.FromException<ClosedLoopReasoningResult>(new InvalidOperationException("not leader")),
            CancellationToken.None);

        leaderCanFinish.SetResult();

        ClosedLoopReasoningResult leaderResult = await leader;
        ClosedLoopReasoningResult waiterResult = await waiter;

        leaderResult.CacheHit.Should().BeTrue();
        waiterResult.CacheHit.Should().BeTrue();
        waiterResult.CacheReuseReason.Should().Be("dependency-manifest-match");
        waiterResult.RunId.Should().Be("storedrun");
    }

    [Fact]
    public void TryGet_returns_pinned_expired_entry_and_refreshes_ttl()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 8, 25, 12, 0, 0, TimeSpan.Zero));
        ReviewResultCache cache = new(clock);
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-expired-pinned" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        cache.Set(manifest, new ClosedLoopReasoningResult { RunId = "expired-pinned-run" });
        cache.PinStorageKey(storageKey);

        clock.Advance(TimeSpan.FromHours(5));

        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();
        cached!.RunId.Should().Be("expiredpinnedrun");

        clock.Advance(TimeSpan.FromHours(3));
        cache.TryGet(manifest, out ClosedLoopReasoningResult? stillValid).Should().BeTrue();
        stillValid!.RunId.Should().Be("expiredpinnedrun");

        cache.UnpinStorageKey(storageKey);
    }

    [Fact]
    public void TryGet_misses_tombstoned_pinned_expired_entry_without_refreshing_ttl()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 8, 25, 12, 0, 0, TimeSpan.Zero));
        ReviewResultCache cache = new(clock);
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-expired-pinned-tombstone" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        cache.Set(manifest, new ClosedLoopReasoningResult { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" });
        cache.PinStorageKey(storageKey);
        cache.InvalidateForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        clock.Advance(TimeSpan.FromHours(5));

        cache.TryGet(manifest, out ClosedLoopReasoningResult? tombstoned).Should().BeFalse();
        tombstoned.Should().BeNull();
    }

    [Fact]
    public void InvalidateForRun_defers_removal_while_pinned_then_flushes_on_unpin()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-deferred-invalidated" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);
        ClosedLoopReasoningResult stored = new() { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };

        cache.Set(manifest, stored);
        cache.PinStorageKey(storageKey);

        cache.InvalidateForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        cache.TryGet(manifest, out ClosedLoopReasoningResult? tombstonedWhilePinned).Should().BeFalse();
        tombstonedWhilePinned.Should().BeNull();

        cache.UnpinStorageKey(storageKey);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeFalse();
    }

    [Fact]
    public void UnpinStorageKey_evicts_overflow_after_deferred_invalidations_flush()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest pinnedManifest = new() { ContentHash = "hash-overflow-evict" };
        string storageKey = ReviewCacheKeyBuilder.Build(pinnedManifest);

        cache.Set(pinnedManifest, new ClosedLoopReasoningResult { RunId = "overflow-run" });
        cache.PinStorageKey(storageKey);

        for (int index = 0; index < 150; index++)
        {
            cache.Set(
                new ReviewCacheDependencyManifest { ContentHash = $"overflow-{index}" },
                new ClosedLoopReasoningResult());
        }

        cache.InvalidateForRun("overflow-run");
        cache.UnpinStorageKey(storageKey);

        cache.TryGet(pinnedManifest, out ClosedLoopReasoningResult? _).Should().BeFalse();
    }

    [Fact]
    public void Set_inserts_when_cache_full_but_unpinned_entries_remain()
    {
        ReviewResultCache cache = new();

        for (int index = 0; index < 64; index++)
        {
            ReviewCacheDependencyManifest manifest = new() { ContentHash = $"pinned-fill-{index}" };
            cache.Set(manifest, new ClosedLoopReasoningResult { RunId = $"run{index}" });
            cache.PinStorageKey(ReviewCacheKeyBuilder.Build(manifest));
        }

        for (int index = 0; index < 64; index++)
        {
            cache.Set(
                new ReviewCacheDependencyManifest { ContentHash = $"unpinned-fill-{index}" },
                new ClosedLoopReasoningResult { RunId = $"unpinned{index}" });
        }

        ReviewCacheDependencyManifest overflowManifest = new() { ContentHash = "pinned-overflow-insert" };
        cache.Set(overflowManifest, new ClosedLoopReasoningResult { RunId = "overflowrun" });

        cache.TryGet(overflowManifest, out ClosedLoopReasoningResult? overflow).Should().BeTrue();
        overflow!.RunId.Should().Be("overflowrun");
    }

    [Fact]
    public void Set_overwrites_existing_key_when_cache_is_full()
    {
        ReviewResultCache cache = new();

        for (int index = 0; index < 128; index++)
        {
            cache.Set(
                new ReviewCacheDependencyManifest { ContentHash = $"fill-{index}" },
                new ClosedLoopReasoningResult { RunId = $"run-{index}" });
        }

        ReviewCacheDependencyManifest targetManifest = new() { ContentHash = "fill-0" };
        cache.Set(targetManifest, new ClosedLoopReasoningResult { RunId = "updated-run" });

        cache.TryGet(targetManifest, out ClosedLoopReasoningResult? updated).Should().BeTrue();
        updated!.RunId.Should().Be("updatedrun");
    }

    [Fact]
    public void PinStorageKey_refuses_new_distinct_keys_when_at_cap()
    {
        ReviewResultCache cache = new();

        for (int index = 0; index < 64; index++)
        {
            ReviewCacheDependencyManifest manifest = new() { ContentHash = $"distinct-pin-{index}" };
            string storageKey = ReviewCacheKeyBuilder.Build(manifest);

            cache.Set(manifest, new ClosedLoopReasoningResult { RunId = $"run-{index}" });
            cache.PinStorageKey(storageKey);
        }

        ReviewCacheDependencyManifest rejectedManifest = new() { ContentHash = "distinct-pin-overflow" };
        string rejectedKey = ReviewCacheKeyBuilder.Build(rejectedManifest);

        cache.PinStorageKey(rejectedKey).Should().BeFalse();
        cache.Set(rejectedManifest, new ClosedLoopReasoningResult { RunId = "overflow-run" });

        for (int index = 0; index < 150; index++)
        {
            cache.Set(
                new ReviewCacheDependencyManifest { ContentHash = $"overflow-evict-{index}" },
                new ClosedLoopReasoningResult());
        }

        cache.TryGet(rejectedManifest, out ClosedLoopReasoningResult? overflow).Should().BeFalse();
        overflow.Should().BeNull();
    }

    [Fact]
    public void PinStorageKey_retains_in_flight_reservation_when_another_key_unpins()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest reservedManifest = new() { ContentHash = "reserved-before-set" };
        string reservedKey = ReviewCacheKeyBuilder.Build(reservedManifest);
        ReviewCacheDependencyManifest trackedManifest = new() { ContentHash = "tracked-unpin-triggers-prune" };
        string trackedKey = ReviewCacheKeyBuilder.Build(trackedManifest);

        cache.PinStorageKey(reservedKey);
        cache.Set(trackedManifest, new ClosedLoopReasoningResult { RunId = "trackedrun" });
        cache.PinStorageKey(trackedKey);

        cache.UnpinStorageKey(trackedKey);

        cache.Set(reservedManifest, new ClosedLoopReasoningResult { RunId = "reservedrun" });

        for (int index = 0; index < 150; index++)
        {
            cache.Set(
                new ReviewCacheDependencyManifest { ContentHash = $"reservation-overflow-{index}" },
                new ClosedLoopReasoningResult());
        }

        cache.TryGet(reservedManifest, out ClosedLoopReasoningResult? stillPinned).Should().BeTrue();
        stillPinned!.RunId.Should().Be("reservedrun");

        cache.UnpinStorageKey(reservedKey);
    }
}
