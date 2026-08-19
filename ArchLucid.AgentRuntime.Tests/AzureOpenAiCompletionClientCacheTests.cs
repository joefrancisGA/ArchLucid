using ArchLucid.AgentRuntime;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class AzureOpenAiCompletionClientCacheTests
{
    [Fact]
    public void TryRemove_disposes_and_evicts_cached_client()
    {
        int factoryCalls = 0;
        AzureOpenAiCompletionClientCache cache = new(deploymentName =>
        {
            factoryCalls++;
            return new AzureOpenAiCompletionClient("https://example.invalid", "key", deploymentName, 1024);
        });

        AzureOpenAiCompletionClient first = cache.GetOrAdd("gpt-4o");
        factoryCalls.Should().Be(1);

        cache.TryRemove("gpt-4o").Should().BeTrue();

        AzureOpenAiCompletionClient second = cache.GetOrAdd("gpt-4o");
        factoryCalls.Should().Be(2);
        second.Should().NotBeSameAs(first);
    }
}
