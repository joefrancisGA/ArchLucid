using System.Text.Json;

using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

using Microsoft.Extensions.Caching.Distributed;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch4Tests
{
    [Fact]
    public async Task DistributedLlmCompletionResponseStore_round_trips_cached_value()
    {
        Dictionary<string, byte[]> store = new();
        Mock<IDistributedCache> cache = CreateCacheMock(store);
        DistributedLlmCompletionResponseStore sut = new(cache.Object);

        await sut.SetAsync("cache-key", "completion-json", TimeSpan.FromMinutes(5), CancellationToken.None);

        string? cached = await sut.TryGetAsync("cache-key", CancellationToken.None);

        cached.Should().Be("completion-json");
    }

    [Fact]
    public async Task DistributedLlmCompletionResponseStore_returns_null_for_missing_key()
    {
        Mock<IDistributedCache> cache = CreateCacheMock(new Dictionary<string, byte[]>());
        DistributedLlmCompletionResponseStore sut = new(cache.Object);

        string? cached = await sut.TryGetAsync("missing", CancellationToken.None);

        cached.Should().BeNull();
    }

    [Fact]
    public async Task DistributedLlmCompletionResponseStore_removes_corrupt_cache_entries()
    {
        Dictionary<string, byte[]> store = new() { ["bad"] = "not-json"u8.ToArray() };
        Mock<IDistributedCache> cache = CreateCacheMock(store);
        DistributedLlmCompletionResponseStore sut = new(cache.Object);

        string? cached = await sut.TryGetAsync("bad", CancellationToken.None);

        cached.Should().BeNull();
        store.ContainsKey("bad").Should().BeFalse();
    }

    [Fact]
    public async Task DistributedLlmCompletionResponseStore_rejects_non_positive_expiration()
    {
        Mock<IDistributedCache> cache = CreateCacheMock(new Dictionary<string, byte[]>());
        DistributedLlmCompletionResponseStore sut = new(cache.Object);

        Func<Task> act = () => sut.SetAsync("k", "v", TimeSpan.Zero, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void CostAgentHandler_build_user_prompt_includes_ledger_context()
    {
        ArchitectureRequest request = new() { SystemName = "Payments", Environment = "prod" };
        AgentEvidencePackage evidence = new()
        {
            SystemName = "Payments",
            Environment = "prod",
            CloudProvider = "Azure",
            Request = new RequestEvidence { Description = "desc" },
        };
        AgentTask task = new() { TaskId = "task-1", AgentType = AgentType.Cost };
        CostRetailGroundingResult grounding = new(string.Empty, [], false, SkippedRetailGrounding: true, GroundedProvider: null);

        string prompt = CostAgentHandler.BuildUserPrompt(
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            request,
            evidence,
            task,
            CloudProvider.Azure,
            grounding,
            []);

        prompt.Should().Contain("Payments");
    }

    [Fact]
    public void DistributedLlmCompletionResponseStore_rejects_null_cache()
    {
        Action act = () => _ = new DistributedLlmCompletionResponseStore(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    private static Mock<IDistributedCache> CreateCacheMock(Dictionary<string, byte[]> store)
    {
        Mock<IDistributedCache> cache = new();
        cache.Setup(c => c.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string key, CancellationToken _) => store.TryGetValue(key, out byte[]? value) ? value : null);
        cache.Setup(c => c.SetAsync(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<DistributedCacheEntryOptions>(), It.IsAny<CancellationToken>()))
            .Callback<string, byte[], DistributedCacheEntryOptions, CancellationToken>((key, value, _, _) => store[key] = value)
            .Returns(Task.CompletedTask);
        cache.Setup(c => c.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback<string, CancellationToken>((key, _) => store.Remove(key))
            .Returns(Task.CompletedTask);

        return cache;
    }
}
