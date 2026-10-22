using ArchLucid.AgentRuntime.Caching;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Caching;

[Trait("Category", "Unit")]
public sealed class LlmCompletionCacheAdmissionTests
{
    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("   ", false)]
    [InlineData("not-json", false)]
    [InlineData("{\"ok\":true}", true)]
    [InlineData("[1,2]", true)]
    public void WireAdmission_filters_empty_and_non_json(string? body, bool expected)
    {
        LlmCompletionCacheWireAdmission.IsAdmissible(body).Should().Be(expected);
    }

    [Fact]
    public async Task Schema_gate_AsyncLocal_survives_yield()
    {
        using (LlmCompletionCacheDeferredAdmission.EnterSchemaAdmissionGate())
        {
            LlmCompletionCacheDeferredAdmission.IsSchemaAdmissionRequired.Should().BeTrue();
            await Task.Yield();
            LlmCompletionCacheDeferredAdmission.IsSchemaAdmissionRequired.Should().BeTrue();
        }
    }

    [Fact]
    public async Task Schema_gate_defers_set_until_commit()
    {
        CountingCompletionClient inner = new("{\"ok\":true}");
        (CachingLlmCompletionClient sut, ILlmCompletionResponseCache cache) = CreateSut(inner);
        LlmCompletionCacheKey versionedKey = RebuildKey("tpl-1", "agent-result-json-v1");

        using (LlmCompletionCacheDeferredAdmission.EnterSchemaAdmissionGate())
        using (LlmCompletionCacheKeyAmbient.Push("tpl-1", "agent-result-json-v1"))
        {
            string body = await sut.CompleteJsonAsync("s", "u");
            body.Should().Be("{\"ok\":true}");

            LlmCompletionCacheDeferredAdmission.HasPending.Should().BeTrue();
            (await cache.TryGetAsync(versionedKey, CancellationToken.None)).Should().BeNull();

            await LlmCompletionCacheDeferredAdmission.CommitAsync();

            LlmCompletionResult? committed = await cache.TryGetAsync(versionedKey, CancellationToken.None);
            committed.Should().NotBeNull();
            committed!.JsonBody.Should().Be("{\"ok\":true}");
        }

        inner.CallCount.Should().Be(1);
    }

    [Fact]
    [Trait("ChaosSuite", "TB-945")]
    public async Task TB940_poison_cache_hit_busts_and_calls_provider_again()
    {
        CountingCompletionClient inner = new("{\"ok\":true}");
        (CachingLlmCompletionClient sut, ILlmCompletionResponseCache cache) = CreateSut(inner);

        LlmCompletionCacheKey key = RebuildKey("none", "none");
        await cache.SetAsync(key, new LlmCompletionResult("not-json"), CancellationToken.None);

        string body = await sut.CompleteJsonAsync("s", "u");

        body.Should().Be("{\"ok\":true}");
        inner.CallCount.Should().Be(1);

        LlmCompletionResult? after = await cache.TryGetAsync(key, CancellationToken.None);
        after.Should().NotBeNull();
        after!.JsonBody.Should().Be("{\"ok\":true}");
    }

    [Fact]
    public async Task Schema_failure_on_cache_hit_busts_entry()
    {
        CountingCompletionClient inner = new("{\"ok\":true}");
        (CachingLlmCompletionClient sut, ILlmCompletionResponseCache cache) = CreateSut(inner);
        LlmCompletionCacheKey key = RebuildKey("tpl-1", "agent-result-json-v1");

        using (LlmCompletionCacheDeferredAdmission.EnterSchemaAdmissionGate())
        using (LlmCompletionCacheKeyAmbient.Push("tpl-1", "agent-result-json-v1"))
        {
            await cache.SetAsync(key, new LlmCompletionResult("{\"poison\":true}"), CancellationToken.None);

            _ = await sut.CompleteJsonAsync("s", "u");
            await LlmCompletionCacheDeferredAdmission.DiscardOrBustOnSchemaFailureAsync();

            LlmCompletionResult? busted = await cache.TryGetAsync(key, CancellationToken.None);
            busted.Should().BeNull();
        }

        using (LlmCompletionCacheDeferredAdmission.EnterSchemaAdmissionGate())
        using (LlmCompletionCacheKeyAmbient.Push("tpl-1", "agent-result-json-v1"))
        {
            _ = await sut.CompleteJsonAsync("s", "u");
            await LlmCompletionCacheDeferredAdmission.CommitAsync();
        }

        inner.CallCount.Should().Be(1);
        LlmCompletionResult? healthy = await cache.TryGetAsync(key, CancellationToken.None);
        healthy.Should().NotBeNull();
        healthy!.JsonBody.Should().Be("{\"ok\":true}");
    }

    [Fact]
    public void ToMemoryKey_includes_prompt_and_schema_versions()
    {
        string hash = LlmCompletionCacheFingerprint.ComputePromptHash("s", "u");
        LlmCompletionCacheKey a = new("unit", "m1", hash, false, string.Empty, "v1", "schema-a");
        LlmCompletionCacheKey b = new("unit", "m1", hash, false, string.Empty, "v2", "schema-a");

        LlmCompletionResponseCache.ToMemoryKey(a).Should().NotBe(LlmCompletionResponseCache.ToMemoryKey(b));
        LlmCompletionResponseCache.ToMemoryKey(a).Should().Contain("al:llmcomp:v2:");
    }

    private static (CachingLlmCompletionClient Sut, ILlmCompletionResponseCache Cache) CreateSut(
        CountingCompletionClient inner)
    {
        MutableOptionsMonitor<LlmCompletionCacheOptions> opts =
            new(new LlmCompletionCacheOptions { Enabled = true, TTLSeconds = 3600, MaxEntries = 32 });

        MutableOptionsMonitor<LlmTelemetryLabelOptions> telemetry =
            new(new LlmTelemetryLabelOptions { ProviderId = "unit", ModelDeploymentLabel = "m1" });

        MemoryCache memCache = new(new MemoryCacheOptions { SizeLimit = 32 });
        MemorySemanticCache semanticCache = new(memCache, opts);
        ILlmCompletionResponseCache cacheBackend = new LlmCompletionResponseCache(semanticCache);

        CachingLlmCompletionClient sut =
            new(
                inner,
                cacheBackend,
                false,
                new FixedScopeProvider(
                    new ScopeContext
                    {
                        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
                    }),
                opts,
                telemetry,
                NullLogger<CachingLlmCompletionClient>.Instance);

        return (sut, cacheBackend);
    }

    private static LlmCompletionCacheKey RebuildKey(string promptVersion, string schemaVersion)
    {
        string hash = LlmCompletionCacheFingerprint.ComputePromptHash("s", "u");
        string scope = LlmCompletionCacheFingerprint.FormatScopePartition(
            new ScopeContext
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
            });

        return new LlmCompletionCacheKey("unit", "m1", hash, false, scope, promptVersion, schemaVersion);
    }

    private sealed class CountingCompletionClient(string body) : IAgentCompletionClient
    {
        public int CallCount
        {
            get;
            private set;
        }

        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("test", "counting");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            CallCount++;

            return Task.FromResult(body);
        }
    }

    private sealed class FixedScopeProvider(ScopeContext scope) : IScopeContextProvider
    {
        private readonly ScopeContext _scope = scope ?? throw new ArgumentNullException(nameof(scope));

        public ScopeContext GetCurrentScope() => _scope;
    }

    private sealed class MutableOptionsMonitor<T>(T initialValue) : IOptionsMonitor<T>
        where T : class
    {
        public T CurrentValue { get; } = initialValue ?? throw new ArgumentNullException(nameof(initialValue));

        public IDisposable OnChange(Action<T, string?> listener) => throw new NotSupportedException();

        public T Get(string? name) => CurrentValue;
    }
}
