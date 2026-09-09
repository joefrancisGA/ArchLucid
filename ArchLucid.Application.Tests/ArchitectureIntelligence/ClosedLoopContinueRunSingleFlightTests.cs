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
