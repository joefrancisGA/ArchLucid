using System.Security.Cryptography;

using ArchLucid.AgentRuntime.Caching;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Caching;

[Trait("Category", "Unit")]
public sealed class LlmCompletionResponseCacheTests
{
    private static string HashBytes(byte discriminator)
        => Convert.ToHexString(SHA256.HashData([discriminator]));

    [Fact]
    public void ToMemoryKey_includes_simulator_partition()
    {
        string promptHash = HashBytes(9);

        LlmCompletionCacheKey notSim =
            new("azure-openai", "gpt-test", promptHash, Simulator: false, ScopePartition: string.Empty);

        LlmCompletionCacheKey sim =
            new("azure-openai", "gpt-test", promptHash, Simulator: true, ScopePartition: string.Empty);

        LlmCompletionResponseCache.ToMemoryKey(notSim).Should().NotBe(LlmCompletionResponseCache.ToMemoryKey(sim));
    }

    [Fact]
    public async Task TryGetAsync_returns_cached_value_before_ttl_elapses()
    {
        MutableOptionsMonitor<LlmCompletionCacheOptions> optionsMonitor = new(new LlmCompletionCacheOptions
        {
            TTLSeconds = 30,
            MaxEntries = 8
        });

        using MemoryCache backing = new(new MemoryCacheOptions { SizeLimit = 8 });

        using LlmCompletionResponseCache sut = new(backing, optionsMonitor);

        LlmCompletionCacheKey key =
            new(AgentType: "t", ModelName: "m", PromptHashHex: HashBytes(1), Simulator: false, ScopePartition: string.Empty);

        await sut.SetAsync(key, new LlmCompletionResult("{\"x\":1}"), CancellationToken.None);

        LlmCompletionResult? hit = await sut.TryGetAsync(key, CancellationToken.None);

        hit.Should().NotBeNull();
        hit!.JsonBody.Should().Be("{\"x\":1}");
    }

    [Fact]
    public async Task TryGetAsync_returns_null_after_ttl_expiry()
    {
        MutableOptionsMonitor<LlmCompletionCacheOptions> optionsMonitor =
            new(new LlmCompletionCacheOptions { TTLSeconds = 1, MaxEntries = 8 });

        using MemoryCache backing = new(new MemoryCacheOptions { SizeLimit = 8 });

        using LlmCompletionResponseCache sut = new(backing, optionsMonitor);

        LlmCompletionCacheKey key =
            new(AgentType: "t", ModelName: "m", PromptHashHex: HashBytes(2), Simulator: false, ScopePartition: string.Empty);

        await sut.SetAsync(key, new LlmCompletionResult("{\"x\":1}"), CancellationToken.None);

        await Task.Delay(1200);

        LlmCompletionResult? miss = await sut.TryGetAsync(key, CancellationToken.None);

        miss.Should().BeNull();
    }

    [Fact]
    public void ResolveTtl_prefers_TTL_seconds_when_positive()
    {
        LlmCompletionCacheOptions options = new() { TTLSeconds = 42, TTLMinutes = 1 };

        LlmCompletionResponseCache.ResolveTtl(options).Should().Be(TimeSpan.FromSeconds(42));
    }

    [Fact]
    public void ResolveTtl_derives_from_TTLMinutes_when_TTL_seconds_unset()
    {
        LlmCompletionCacheOptions options = new() { TTLSeconds = 0, TTLMinutes = 30 };

        LlmCompletionResponseCache.ResolveTtl(options).Should().Be(TimeSpan.FromSeconds(1800));
    }

    [Fact]
    public void ResolveTtl_floor_is_one_second()
    {
        LlmCompletionCacheOptions options = new() { TTLSeconds = 0, TTLMinutes = 0 };

        LlmCompletionResponseCache.ResolveTtl(options).Should().Be(TimeSpan.FromSeconds(1));
    }
    [Fact]
    public async Task Concurrent_writes_and_reads_stay_consistent()
    {
        MutableOptionsMonitor<LlmCompletionCacheOptions> optionsMonitor =
            new(new LlmCompletionCacheOptions { TTLSeconds = 3600, MaxEntries = 256 });

        using MemoryCache backing = new(new MemoryCacheOptions { SizeLimit = 256 });

        using LlmCompletionResponseCache sut = new(backing, optionsMonitor);

        await Parallel.ForAsync(
            0,
            50,
            async (i, ct) =>
            {
                byte disc = unchecked((byte)i);
                LlmCompletionCacheKey key =
                    new(
                        AgentType: "t",
                        ModelName: "m",
                        PromptHashHex: HashBytes(disc),
                        Simulator: false,
                        ScopePartition: string.Empty);

                string expected = $"\"v{i}\"";

                await sut.SetAsync(key, new LlmCompletionResult(expected), ct);

                LlmCompletionResult? read = await sut.TryGetAsync(key, ct);

                read.Should().NotBeNull();

                read!.JsonBody.Should().Be(expected);
            });
    }

    /// <summary>Mutable backing field for unit tests (<see cref="IOptionsMonitor{T}" />).</summary>
    private sealed class MutableOptionsMonitor<T>(T initialValue) : IOptionsMonitor<T>
        where T : class
    {
        public T CurrentValue
        {
            get;
            set;
        } = initialValue ?? throw new ArgumentNullException(nameof(initialValue));

        public IDisposable OnChange(Action<T, string?> listener)
        {
            throw new NotSupportedException();
        }

        public T Get(string? name)
        {
            return CurrentValue;
        }
    }
}
