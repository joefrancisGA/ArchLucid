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
            Model = new ArchitectureKnowledgeModel
            {
                ModelId = "model-payload",
                Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
            },
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
        cached.MustNotFailViolations.Should().BeEmpty();
        cached.RunId.Should().Be("runpayload");

        cached.Model.Elements[0].Name = "mutated";

        cache.TryGet(manifest, out ClosedLoopReasoningResult? again).Should().BeTrue();
        again!.Model.Elements[0].Name.Should().Be("API");
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
    public void TryGet_misses_tombstone_when_cached_run_id_is_compact_and_invalidation_used_hyphenated_form()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-tombstone-tryget-casing" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        cache.Set(
            manifest,
            new ClosedLoopReasoningResult { RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" });
        cache.PinStorageKey(storageKey);

        cache.InvalidateForRun("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        cache.TryGet(manifest, out ClosedLoopReasoningResult? miss).Should().BeFalse();
        miss.Should().BeNull();

        cache.UnpinStorageKey(storageKey);
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
    public void InvalidateForRun_removes_entries_when_invalidate_run_id_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-run-path-invalidated" };

        cache.Set(
            manifest,
            new ClosedLoopReasoningResult { RunId = "tenants/acme/runs/42" });
        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeTrue();

        cache.InvalidateForRun("tenants\\acme\\runs\\42");

        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeFalse();
    }

    [Fact]
    public void InvalidateForRun_removes_entries_when_invalidate_run_id_differs_only_by_percent_encoded_slash_in_path()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-run-percent-invalidated" };

        cache.Set(
            manifest,
            new ClosedLoopReasoningResult { RunId = "tenants/acme/runs/42" });
        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeTrue();

        cache.InvalidateForRun("tenants%2Facme%2Fruns%2F42");

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
    public async Task CoalesceAsync_with_pinned_storage_key_retains_entry_under_cache_pressure_during_leader()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-pinned-coalesce-survival" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        cache.Set(manifest, new ClosedLoopReasoningResult { RunId = "pinned-run" });
        cache.PinStorageKey(storageKey);

        Task<ClosedLoopReasoningResult> inflight = cache.CoalesceAsync(
            manifest,
            async cancellationToken =>
            {
                for (int index = 0; index < 150; index++)
                {
                    cache.Set(
                        new ReviewCacheDependencyManifest { ContentHash = $"overflow-pinned-{index}" },
                        new ClosedLoopReasoningResult());
                }

                await Task.Delay(50, cancellationToken);

                return new ClosedLoopReasoningResult { RunId = "leader-run" };
            },
            CancellationToken.None);

        ClosedLoopReasoningResult leaderResult = await inflight;

        leaderResult.RunId.Should().Be("leader-run");
        cache.TryGet(manifest, out ClosedLoopReasoningResult? stillPinned).Should().BeTrue();
        stillPinned!.RunId.Should().Be("pinnedrun");

        cache.UnpinStorageKey(storageKey);
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
    public void BuildInFlight_appends_publish_suffix_to_storage_key_without_ambiguity()
    {
        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-inflight-key",
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "architecture.md",
                    ContentType = "text/markdown",
                    Content = "Public API without authentication.",
                },
            ],
        };

        ReviewCacheDependencyManifest manifest = ReviewCacheManifestBuilder.Build(request);

        manifest.ContentHash.Should().MatchRegex("^[a-f0-9]{64}$");

        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        ReviewCacheKeyBuilder.BuildInFlight(manifest, publishToProduct: false)
            .Should()
            .Be($"{storageKey}|publish=0");

        ReviewCacheKeyBuilder.BuildInFlight(manifest, publishToProduct: true)
            .Should()
            .Be($"{storageKey}|publish=1");
    }

    [Fact]
    public async Task CoalesceAsync_waiters_receive_leader_result_when_invalidate_tombstones_pinned_run_during_flight()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "coalesce-invalidate-tombstone" };
        const string runId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        cache.Set(manifest, new ClosedLoopReasoningResult { RunId = runId });
        cache.PinStorageKey(storageKey);

        TaskCompletionSource leaderEntered = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Task<ClosedLoopReasoningResult> leader = cache.CoalesceAsync(
            manifest,
            async cancellationToken =>
            {
                leaderEntered.TrySetResult();

                await Task.Delay(30, cancellationToken);

                cache.InvalidateForRun(runId);

                return new ClosedLoopReasoningResult { RunId = runId, Model = new ArchitectureKnowledgeModel { RunId = runId } };
            },
            CancellationToken.None);

        await leaderEntered.Task;

        Task<ClosedLoopReasoningResult> waiter = cache.CoalesceAsync(
            manifest,
            _ => Task.FromException<ClosedLoopReasoningResult>(new InvalidOperationException("not leader")),
            CancellationToken.None);

        ClosedLoopReasoningResult leaderResult = await leader;
        ClosedLoopReasoningResult waiterResult = await waiter;

        waiterResult.RunId.Should().Be(leaderResult.RunId);

        cache.UnpinStorageKey(storageKey);
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

        cache.TryGet(manifest, out ClosedLoopReasoningResult? cachedEntry).Should().BeTrue();
        cachedEntry!.CacheHit.Should().BeFalse();
        cachedEntry.CacheReuseReason.Should().BeNull();
    }

    [Fact]
    public void Set_skips_insert_for_tombstoned_run_id_while_pin_holds_storage_key()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-tombstone-set-skip" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);
        const string runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        cache.Set(manifest, new ClosedLoopReasoningResult { RunId = runId });
        cache.PinStorageKey(storageKey);
        cache.InvalidateForRun(runId);

        cache.Set(manifest, new ClosedLoopReasoningResult { RunId = runId, Model = new ArchitectureKnowledgeModel { RunId = runId } });

        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeFalse();

        cache.UnpinStorageKey(storageKey);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? _).Should().BeFalse();
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
    public void Set_reinserts_after_deferred_invalidation_unpin_clears_tombstone()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-reinsert-after-unpin" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        cache.Set(
            manifest,
            new ClosedLoopReasoningResult { RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" });
        cache.PinStorageKey(storageKey);

        cache.InvalidateForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        cache.UnpinStorageKey(storageKey);

        cache.Set(
            manifest,
            new ClosedLoopReasoningResult { RunId = "reinsert-run" });

        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();
        cached!.RunId.Should().Be("reinsertrun");
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
    public void Set_inserts_when_cache_at_max_entries_because_all_pinned_state_is_unreachable()
    {
        ReviewResultCache cache = new();

        for (int index = 0; index < 64; index++)
        {
            ReviewCacheDependencyManifest manifest = new() { ContentHash = $"pin-cap-{index}" };
            cache.Set(manifest, new ClosedLoopReasoningResult { RunId = $"run-{index}" });
            cache.PinStorageKey(ReviewCacheKeyBuilder.Build(manifest));
        }

        for (int index = 0; index < 64; index++)
        {
            cache.Set(
                new ReviewCacheDependencyManifest { ContentHash = $"unpinned-at-cap-{index}" },
                new ClosedLoopReasoningResult { RunId = $"unpinned-{index}" });
        }

        ReviewCacheDependencyManifest overflowManifest = new() { ContentHash = "all-pinned-unreachable-overflow" };
        cache.Set(overflowManifest, new ClosedLoopReasoningResult { RunId = "overflow-at-cap" });

        cache.TryGet(overflowManifest, out ClosedLoopReasoningResult? overflow).Should().BeTrue();
        overflow!.RunId.Should().Be("overflowatcap");
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
    public void Set_inserts_when_cache_full_because_distinct_pin_cap_prevents_pinning_every_entry()
    {
        ReviewResultCache cache = new();

        for (int index = 0; index < 128; index++)
        {
            ReviewCacheDependencyManifest manifest = new() { ContentHash = $"pin-cap-vs-max-{index}" };
            cache.Set(manifest, new ClosedLoopReasoningResult { RunId = $"run-{index}" });
            cache.PinStorageKey(ReviewCacheKeyBuilder.Build(manifest));
        }

        ReviewCacheDependencyManifest overflowManifest = new() { ContentHash = "pin-cap-vs-max-overflow" };
        cache.Set(overflowManifest, new ClosedLoopReasoningResult { RunId = "overflow-run" });

        cache.TryGet(overflowManifest, out ClosedLoopReasoningResult? overflow).Should().BeTrue();
        overflow!.RunId.Should().Be("overflowrun");
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

    [Fact]
    public void PinScope_deduplicates_identical_keys_in_composite_pin()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "composite-dedupe" };
        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        using (cache.PinScope(manifest, manifest))
        {
            cache.Set(manifest, new ClosedLoopReasoningResult { RunId = "deduperun" });
        }

        for (int index = 0; index < 150; index++)
        {
            cache.Set(
                new ReviewCacheDependencyManifest { ContentHash = $"dedupe-overflow-{index}" },
                new ClosedLoopReasoningResult());
        }

        cache.TryGet(manifest, out ClosedLoopReasoningResult? evicted).Should().BeFalse();
        evicted.Should().BeNull();
    }

    [Fact]
    public void AddTombstonedRunId_skips_fifo_drop_when_tombstone_has_pinned_entries()
    {
        ReviewResultCache cache = new();
        List<ReviewCacheDependencyManifest> manifests = [];
        List<string> storageKeys = [];

        for (int index = 0; index < 64; index++)
        {
            ReviewCacheDependencyManifest manifest = new() { ContentHash = $"tombstone-cap-{index}" };
            string storageKey = ReviewCacheKeyBuilder.Build(manifest);

            manifests.Add(manifest);
            storageKeys.Add(storageKey);

            cache.Set(manifest, new ClosedLoopReasoningResult { RunId = $"run-{index}" });
            cache.PinStorageKey(storageKey);
            cache.InvalidateForRun($"run-{index}");
        }

        cache.UnpinStorageKey(storageKeys[0]);

        ReviewCacheDependencyManifest newManifest = new() { ContentHash = "tombstone-cap-new" };
        string newKey = ReviewCacheKeyBuilder.Build(newManifest);

        cache.Set(newManifest, new ClosedLoopReasoningResult { RunId = "run-new" });
        cache.PinStorageKey(newKey);
        cache.InvalidateForRun("run-new");

        cache.TryGet(manifests[1], out ClosedLoopReasoningResult? stillTombstoned).Should().BeFalse();
        stillTombstoned.Should().BeNull();
        cache.TryGet(newManifest, out ClosedLoopReasoningResult? newBlocked).Should().BeFalse();
        newBlocked.Should().BeNull();
    }

    [Fact]
    public void PinScope_dual_manifest_reports_not_pinned_when_distinct_key_cap_reached()
    {
        ReviewResultCache cache = new();
        List<IReviewResultCachePinScope> scopes = [];

        for (int index = 0; index < 64; index++)
        {
            ReviewCacheDependencyManifest manifest = new() { ContentHash = $"dual-pin-cap-{index}" };

            cache.Set(manifest, new ClosedLoopReasoningResult { RunId = $"run-{index}" });
            scopes.Add(cache.PinScope(manifest));
        }

        ReviewCacheDependencyManifest primary = new() { ContentHash = "dual-pin-primary" };
        ReviewCacheDependencyManifest secondary = new() { ContentHash = "dual-pin-secondary" };

        using IReviewResultCachePinScope dualScope = cache.PinScope(primary, secondary);

        dualScope.IsPinned.Should().BeFalse();

        string runId = Guid.NewGuid().ToString("N");
        cache.Set(primary, new ClosedLoopReasoningResult { RunId = runId });
        cache.TryGet(primary, out ClosedLoopReasoningResult? cached).Should().BeTrue();
        cached!.RunId.Should().Be(runId);

        foreach (IReviewResultCachePinScope scope in scopes)
            scope.Dispose();
    }

    [Fact]
    public void InvalidateForRun_does_not_remove_entries_with_blank_stored_run_id()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-blank-runid-invalidate" };

        ClosedLoopReasoningResult stored = new() { RunId = "   " };
        ClosedLoopCacheHitPublishGuard.SanitizeForStorage(stored);
        stored.RunId.Should().BeNull();

        cache.Set(manifest, stored);
        cache.InvalidateForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();
        cached!.RunId.Should().BeNull();
    }

    [Fact]
    public void TryGet_misses_when_manifest_schema_version_differs_from_stored_entry()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest stored = new()
        {
            ContentHash = "hash-schema-version",
            SchemaVersion = 1,
        };

        cache.Set(stored, new ClosedLoopReasoningResult { RunId = "run-schema" });

        ReviewCacheDependencyManifest lookup = new()
        {
            ContentHash = stored.ContentHash,
            PromptVersion = stored.PromptVersion,
            ModelVersion = stored.ModelVersion,
            PolicyPackVersion = stored.PolicyPackVersion,
            RubricVersion = stored.RubricVersion,
            TenantConfigurationHash = stored.TenantConfigurationHash,
            DeclaredPrioritiesHash = stored.DeclaredPrioritiesHash,
            SchemaVersion = 2,
        };

        cache.TryGet(lookup, out ClosedLoopReasoningResult? _).Should().BeFalse();
    }

    [Fact]
    public void PinScope_reports_not_pinned_when_distinct_key_cap_reached()
    {
        ReviewResultCache cache = new();
        List<IReviewResultCachePinScope> scopes = [];

        for (int index = 0; index < 64; index++)
        {
            ReviewCacheDependencyManifest manifest = new() { ContentHash = $"pin-report-{index}" };

            cache.Set(manifest, new ClosedLoopReasoningResult { RunId = $"run-{index}" });

            IReviewResultCachePinScope scope = cache.PinScope(manifest);

            scope.IsPinned.Should().BeTrue();
            scopes.Add(scope);
        }

        ReviewCacheDependencyManifest rejected = new() { ContentHash = "pin-report-overflow" };

        using IReviewResultCachePinScope rejectedScope = cache.PinScope(rejected);

        rejectedScope.IsPinned.Should().BeFalse();

        foreach (IReviewResultCachePinScope scope in scopes)
            scope.Dispose();
    }
}
