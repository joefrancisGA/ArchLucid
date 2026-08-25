using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ReviewCacheManifestBuilderTests
{
    [Fact]
    public void Build_changes_content_hash_when_source_text_changes()
    {
        ClosedLoopReasoningRequest baseline = CreateRequest("Public API without auth.");
        ClosedLoopReasoningRequest changed = CreateRequest("Public API without auth. Added billing worker.");

        ReviewCacheDependencyManifest hashA = ReviewCacheManifestBuilder.Build(baseline);
        ReviewCacheDependencyManifest hashB = ReviewCacheManifestBuilder.Build(changed);

        hashA.ContentHash.Should().NotBe(hashB.ContentHash);
        hashA.PromptVersion.Should().Be(hashB.PromptVersion);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_model_fingerprint_changes_for_supplied_run_id()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-with-model";

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-1",
            RunId = "run-with-model",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel changed = new()
        {
            ModelId = "model-1",
            RunId = "run-with-model",
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API" },
                new ArchitectureModelElement { ElementId = "el-2", Name = "Worker" },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, baseline).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, changed).ContentHash);
    }

    [Fact]
    public void Build_changes_hash_when_declared_priorities_change()
    {
        ClosedLoopReasoningRequest security = CreateRequest("Architecture note.");
        security.DeclaredPriorities = ["Security"];

        ClosedLoopReasoningRequest cost = CreateRequest("Architecture note.");
        cost.DeclaredPriorities = ["Cost"];

        ReviewCacheManifestBuilder.Build(security).DeclaredPrioritiesHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(cost).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_changes_hash_when_publish_intent_changes()
    {
        ClosedLoopReasoningRequest withoutPublish = CreateRequest("Architecture note.");
        withoutPublish.PublishToProduct = false;

        ClosedLoopReasoningRequest withPublish = CreateRequest("Architecture note.");
        withPublish.PublishToProduct = true;

        ReviewCacheManifestBuilder.Build(withoutPublish).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(withPublish).ContentHash);
    }

    private static ClosedLoopReasoningRequest CreateRequest(string content)
    {
        return new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-cache",
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "arch.md",
                    ContentType = "text/markdown",
                    Content = content,
                },
            ],
        };
    }
}
