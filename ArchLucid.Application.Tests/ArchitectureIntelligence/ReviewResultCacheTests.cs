using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ReviewResultCacheTests
{
    [Fact]
    public void TryGet_returns_false_when_prompt_version_differs()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifestV1 = CreateManifest("prompt-v1");
        ReviewCacheDependencyManifest manifestV2 = CreateManifest("prompt-v2");
        ClosedLoopReasoningResult cachedResult = new()
        {
            Model = new ArchitectureKnowledgeModel { ModelId = "model-1", TenantId = "tenant-1" },
        };

        cache.Set(manifestV1, cachedResult);

        bool hit = cache.TryGet(manifestV2, out ClosedLoopReasoningResult? result);

        hit.Should().BeFalse();
        result.Should().BeNull();
    }

    private static ReviewCacheDependencyManifest CreateManifest(string promptVersion)
    {
        return new ReviewCacheDependencyManifest
        {
            ContentHash = "hash-1",
            PromptVersion = promptVersion,
            ModelVersion = "model-v1",
            PolicyPackVersion = "policy-v1",
            RubricVersion = "rubric-v1",
            TenantConfigurationHash = "tenant-config",
            DeclaredPrioritiesHash = "priorities",
            SchemaVersion = 1,
        };
    }
}
