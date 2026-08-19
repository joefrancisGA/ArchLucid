using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.FineTuning;
using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Registry;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests.FineTuning;

[Trait("Category", "Unit")]
public sealed class CacheInvalidatingFineTunedModelRegistryTests
{
    [Fact]
    public async Task RollbackActiveAsync_removes_cached_completion_client_for_promoted_deployment()
    {
        InMemoryFineTunedModelRegistry inner = new();
        AzureOpenAiCompletionClientCache cache = new(static deploymentName =>
            new AzureOpenAiCompletionClient("https://example.invalid", "key", deploymentName, 1024));
        CacheInvalidatingFineTunedModelRegistry registry = new(inner, cache);
        Guid tenantId = Guid.NewGuid();

        await registry.SaveAsync(
            new FineTunedModelRegistryEntry
            {
                TenantId = tenantId,
                FineTunedModelDeploymentName = "ft-governance-v1",
                IsActive = true,
                PromotedUtc = DateTime.UtcNow,
                Status = FineTuningJobStatus.Succeeded,
            },
            CancellationToken.None);

        AzureOpenAiCompletionClient cached = cache.GetOrAdd("ft-governance-v1");

        await registry.RollbackActiveAsync(tenantId, CancellationToken.None);

        FineTunedModelRegistryEntry? active = await registry.TryGetActiveAsync(tenantId, CancellationToken.None);
        active.Should().BeNull();

        AzureOpenAiCompletionClient refreshed = cache.GetOrAdd("ft-governance-v1");
        refreshed.Should().NotBeSameAs(cached);
    }
}
