using ArchLucid.AgentRuntime.Caching;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Caching;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CompletionCacheGenerationOptionsTests
{
    [Theory]
    [InlineData("typed")]
    [InlineData("legacy-sync")]
    [InlineData("legacy-stream")]
    public async Task Cache_separates_token_and_temperature_overrides_from_defaults(string path)
    {
        CountingClient inner = new();
        ScopeProvider scope = new();
        FixedOptions<LlmCompletionCacheOptions> opts = new(new() { Enabled = true, TTLSeconds = 60 });
        using MemorySemanticCache semantic = new(new MemoryCache(new MemoryCacheOptions { SizeLimit = 16 }), opts);
        CachingLlmCompletionClient typed = new(inner, new LlmCompletionResponseCache(semantic), false,
            scope, opts, new FixedOptions<LlmTelemetryLabelOptions>(new()),
            NullLogger<CachingLlmCompletionClient>.Instance);
        using MemoryLlmCompletionResponseStore store = new(16);
        CachingAgentCompletionClient legacy = new(inner, store, "test", true, true, TimeSpan.FromMinutes(1),
            scope, NullLogger<CachingAgentCompletionClient>.Instance);

        async Task<string> Call(int? maxTokens = null, float? temperature = null)
        {
            if (path == "typed")
                return await typed.CompleteJsonAsync("system", "user", maxTokens, temperature);

            if (path == "legacy-sync")
                return await legacy.CompleteJsonAsync("system", "user", maxTokens, temperature);

            System.Text.StringBuilder answer = new();
            await foreach (string chunk in legacy.StreamJsonAsync("system", "user", maxTokens, temperature))
                answer.Append(chunk);
            return answer.ToString();
        }

        string defaultReply = await Call();
        string explicitLength = await Call(64);
        string explicitZeroTemperature = await Call(64, 0f);
        string changedTemperature = await Call(64, 0.5f);

        Assert.Equal(4, new[] { defaultReply, explicitLength, explicitZeroTemperature, changedTemperature }.Distinct().Count());
        Assert.Equal(defaultReply, await Call());
        Assert.Equal(explicitZeroTemperature, await Call(64, 0f));
        Assert.Equal(4, inner.Calls);
    }

    private sealed class CountingClient : IAgentCompletionClient
    {
        public int Calls { get; private set; }
        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("stub", "stub");

        public Task<string> CompleteJsonAsync(string systemPrompt, string userPrompt, int? maxTokens = null,
            float? temperature = null, CancellationToken cancellationToken = default)
        {
            Calls++;
            return Task.FromResult($$"""{"call":{{Calls}} }""");
        }
    }

    private sealed class ScopeProvider : IScopeContextProvider
    {
        private readonly ScopeContext _scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        public ScopeContext GetCurrentScope() => _scope;
    }

    private sealed class FixedOptions<T>(T value) : IOptionsMonitor<T>
    {
        public T CurrentValue => value;
        public T Get(string? name) => value;
        public IDisposable? OnChange(Action<T, string?> listener) => null;
    }
}
