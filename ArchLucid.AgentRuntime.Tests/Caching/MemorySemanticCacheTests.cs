using ArchLucid.AgentRuntime.Caching;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Caching;

[Trait("Category", "Unit")]
public sealed class MemorySemanticCacheTests
{
    [SkippableFact]
    public async Task Get_returns_null_when_missing()
    {
        MutableOptionsMonitor<LlmCompletionCacheOptions> optionsMonitor =
            new(new LlmCompletionCacheOptions { TTLSeconds = 60, MaxEntries = 16 });

        MemoryCache backing = new(new MemoryCacheOptions { SizeLimit = 16 });
        using MemorySemanticCache sut = new(backing, optionsMonitor);

        string? hit = await sut.GetCachedResponseAsync(Convert.ToHexString([1, 2, 3]), CancellationToken.None);

        hit.Should().BeNull();
    }

    [SkippableFact]
    public async Task Set_then_Get_round_trips_response()
    {
        MutableOptionsMonitor<LlmCompletionCacheOptions> optionsMonitor =
            new(new LlmCompletionCacheOptions { TTLSeconds = 600, MaxEntries = 16 });

        MemoryCache backing = new(new MemoryCacheOptions { SizeLimit = 16 });
        using MemorySemanticCache sut = new(backing, optionsMonitor);

        const string keyHex = "ABCD01";
        const string body = "{\"ok\":true}";

        await sut.SetCachedResponseAsync(keyHex, body, CancellationToken.None);

        string? hit = await sut.GetCachedResponseAsync(keyHex, CancellationToken.None);

        hit.Should().Be(body);
    }

    /// <summary>Mutable backing field for unit tests (<see cref="IOptionsMonitor{T}" />).</summary>
    private sealed class MutableOptionsMonitor<T>(T initialValue) : IOptionsMonitor<T>
        where T : class
    {
        public T CurrentValue
        {
            get;
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
