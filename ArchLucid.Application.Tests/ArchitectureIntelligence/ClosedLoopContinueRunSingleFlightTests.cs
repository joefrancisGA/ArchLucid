using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopContinueRunSingleFlightTests
{
    [Fact]
    public void BuildCoalesceKey_matches_across_workspace_when_continue_content_matches()
    {
        ClosedLoopReasoningRequest workspaceA = CreateContinueRequest();
        workspaceA.WorkspaceId = "11111111-1111-1111-1111-111111111111";

        ClosedLoopReasoningRequest workspaceB = CreateContinueRequest();
        workspaceB.WorkspaceId = "22222222-2222-2222-2222-222222222222";

        ReviewCacheDependencyManifest manifestA =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                workspaceA,
                "tenant-continue-flight",
                "run-continue-flight");

        ReviewCacheDependencyManifest manifestB =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                workspaceB,
                "tenant-continue-flight",
                "run-continue-flight");

        manifestA.TenantConfigurationHash.Should().NotBe(manifestB.TenantConfigurationHash);

        string keyA = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            "tenant-continue-flight",
            "run-continue-flight",
            manifestA,
            publishToProduct: false);

        string keyB = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            "tenant-continue-flight",
            "run-continue-flight",
            manifestB,
            publishToProduct: false);

        keyA.Should().Be(keyB, "continue in-flight dedupe keys tenant+runId+content hash, not workspace partition");
    }

    [Fact]
    public void BuildCoalesceKey_differs_from_review_cache_storage_key_for_same_manifest()
    {
        ClosedLoopReasoningRequest request = CreateContinueRequest();

        ReviewCacheDependencyManifest manifest =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-continue-flight",
                "run-continue-flight");

        string inFlightKey = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            "tenant-continue-flight",
            "run-continue-flight",
            manifest,
            publishToProduct: false);

        string storageKey = ReviewCacheKeyBuilder.Build(manifest);

        inFlightKey.Should().NotBe(storageKey);
        inFlightKey.Should().StartWith("continue|");
    }

    [Fact]
    public void BuildCoalesceKey_matches_when_run_id_differs_only_by_backslash_vs_forward_slash_in_path()
    {
        ClosedLoopReasoningRequest request = CreateContinueRequest();
        request.RunId = "tenants/acme/runs/42";

        ReviewCacheDependencyManifest manifest =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-continue-flight",
                "tenants/acme/runs/42");

        string forwardSlash = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            "tenant-continue-flight",
            "tenants/acme/runs/42",
            manifest,
            publishToProduct: false);

        string backslash = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            "tenant-continue-flight",
            "tenants\\acme\\runs\\42",
            manifest,
            publishToProduct: false);

        forwardSlash.Should().Be(backslash);
    }

    [Fact]
    public void BuildCoalesceKey_matches_when_run_id_differs_only_by_hyphenated_guid_format()
    {
        const string hyphenated = "cccccccc-cccc-cccc-cccc-cccccccccccc";
        const string compact = "cccccccccccccccccccccccccccccccc";

        ClosedLoopReasoningRequest request = CreateContinueRequest();
        request.RunId = hyphenated;

        ReviewCacheDependencyManifest manifest =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-continue-flight",
                hyphenated);

        string keyHyphenated = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            "tenant-continue-flight",
            hyphenated,
            manifest,
            publishToProduct: false);

        string keyCompact = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            "tenant-continue-flight",
            compact,
            manifest,
            publishToProduct: false);

        keyHyphenated.Should().Be(keyCompact);
    }

    [Fact]
    public void BuildCoalesceKey_matches_when_tenant_differs_only_by_guid_hex_letter_casing()
    {
        const string runId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
        const string tenantLower = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string tenantUpper = "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA";

        ClosedLoopReasoningRequest request = CreateContinueRequest();
        request.TenantId = tenantLower;
        request.RunId = runId;

        ReviewCacheDependencyManifest manifestLower =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                tenantLower,
                runId);

        ReviewCacheDependencyManifest manifestUpper =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                tenantUpper,
                runId);

        manifestLower.ContentHash.Should().Be(manifestUpper.ContentHash);

        string keyLower = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            tenantLower,
            runId,
            manifestLower,
            publishToProduct: false);

        string keyUpper = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            tenantUpper,
            runId,
            manifestUpper,
            publishToProduct: false);

        keyLower.Should().Be(keyUpper);
    }

    [Fact]
    public void BuildCoalesceKey_differs_when_tenant_id_changes()
    {
        ClosedLoopReasoningRequest request = CreateContinueRequest();

        ReviewCacheDependencyManifest manifest =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-continue-a",
                "run-continue-flight");

        string tenantA = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            "tenant-continue-a",
            "run-continue-flight",
            manifest,
            publishToProduct: false);

        string tenantB = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            "tenant-continue-b",
            "run-continue-flight",
            manifest,
            publishToProduct: false);

        tenantA.Should().NotBe(tenantB);
    }

    [Fact]
    public void BuildCoalesceKey_partitions_publish_intent()
    {
        ClosedLoopReasoningRequest request = CreateContinueRequest();

        ReviewCacheDependencyManifest manifest =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-continue-flight",
                "run-continue-flight");

        string analysisKey = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            "tenant-continue-flight",
            "run-continue-flight",
            manifest,
            publishToProduct: false);

        string publishKey = ClosedLoopContinueRunSingleFlight.BuildCoalesceKey(
            "tenant-continue-flight",
            "run-continue-flight",
            manifest,
            publishToProduct: true);

        analysisKey.Should().NotBe(publishKey);
    }

    [Fact]
    public async Task CoalesceAsync_runs_in_parallel_with_review_cache_coalesce_for_same_continue_manifest()
    {
        ClosedLoopReasoningRequest request = CreateContinueRequest();

        ReviewCacheDependencyManifest manifest =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-continue-flight",
                "run-continue-flight");

        ReviewResultCache cache = new();
        ClosedLoopContinueRunSingleFlight continueFlight = new();
        int reviewCalls = 0;
        int continueCalls = 0;
        TaskCompletionSource startGate = new(TaskCreationOptions.RunContinuationsAsynchronously);

        Task<ClosedLoopReasoningResult> review = Task.Run(async () =>
        {
            await startGate.Task;

            return await cache.CoalesceAsync(
                manifest,
                async cancellationToken =>
                {
                    Interlocked.Increment(ref reviewCalls);

                    await Task.Delay(80, cancellationToken);

                    return new ClosedLoopReasoningResult { RunId = "review-leader" };
                },
                CancellationToken.None);
        });

        Task<ClosedLoopReasoningResult> continueRun = Task.Run(async () =>
        {
            await startGate.Task;

            return await continueFlight.CoalesceAsync(
                "tenant-continue-flight",
                "run-continue-flight",
                manifest,
                publishToProduct: false,
                async cancellationToken =>
                {
                    Interlocked.Increment(ref continueCalls);

                    await Task.Delay(80, cancellationToken);

                    return new ClosedLoopReasoningResult { RunId = "continue-leader" };
                },
                CancellationToken.None);
        });

        startGate.SetResult();

        await Task.WhenAll(review, continueRun);

        reviewCalls.Should().Be(1);
        continueCalls.Should().Be(1);
    }

    private static ClosedLoopReasoningRequest CreateContinueRequest()
    {
        return new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-continue-flight",
            RunId = "run-continue-flight",
            ContinueFromExistingRun = true,
            DeclaredPriorities = ["Security"],
            FramingAnswers = new Dictionary<string, string>
            {
                ["business-outcome"] = "Secure claims intake",
            },
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "arch.md",
                    ContentType = "text/markdown",
                    Content = "Public API without authentication.",
                },
            ],
        };
    }
}
