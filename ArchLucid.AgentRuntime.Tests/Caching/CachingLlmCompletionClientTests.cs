using System.Diagnostics.Metrics;

using ArchLucid.AgentRuntime.Caching;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Caching;

[Trait("Category", "Unit")]
public sealed class CachingLlmCompletionClientTests
{
    [SkippableFact]
    public async Task CompleteJsonAsync_when_hit_does_not_call_inner()
    {
        CountingCompletionClient inner = new();
        MutableOptionsMonitor<LlmCompletionCacheOptions> opts =
            new(new LlmCompletionCacheOptions { Enabled = true, TTLSeconds = 3600, MaxEntries = 32 });

        MutableOptionsMonitor<LlmTelemetryLabelOptions> telemetry =
            new(new LlmTelemetryLabelOptions { ProviderId = "unit", ModelDeploymentLabel = "m1" });

        using MemoryCache memCache = new(new MemoryCacheOptions { SizeLimit = 32 });

        ILlmCompletionResponseCache cacheBackend = new LlmCompletionResponseCache(memCache, opts);

        CachingLlmCompletionClient sut =
            new(
                inner,
                cacheBackend,
                simulatorMode: false,
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

        _ = await sut.CompleteJsonAsync("s", "u");
        _ = await sut.CompleteJsonAsync("s", "u");

        inner.CallCount.Should().Be(1);
    }

    [SkippableFact]
    public async Task CompleteJsonAsync_when_disabled_invokes_inner_each_time()
    {
        CountingCompletionClient inner = new();

        MutableOptionsMonitor<LlmCompletionCacheOptions> opts =
            new(new LlmCompletionCacheOptions { Enabled = false, TTLSeconds = 3600, MaxEntries = 32 });

        MutableOptionsMonitor<LlmTelemetryLabelOptions> telemetry =
            new(new LlmTelemetryLabelOptions { ProviderId = "unit", ModelDeploymentLabel = "m1" });

        using MemoryCache memCache = new(new MemoryCacheOptions { SizeLimit = 32 });

        ILlmCompletionResponseCache cacheBackend = new LlmCompletionResponseCache(memCache, opts);

        CachingLlmCompletionClient sut =
            new(
                inner,
                cacheBackend,
                simulatorMode: false,
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

        _ = await sut.CompleteJsonAsync("s", "u");
        _ = await sut.CompleteJsonAsync("s", "u");

        inner.CallCount.Should().Be(2);
    }

    [SkippableFact]
    public async Task Hit_and_miss_increment_llm_counter_metrics_with_agent_type_label()
    {
        _ = ArchLucidInstrumentation.LlmCompletionCacheHitsTotal;
        _ = ArchLucidInstrumentation.LlmCompletionCacheMissesTotal;

        using LongMeasurementCapture capture = LongMeasurementCapture.Start();

        CountingCompletionClient inner = new();
        MutableOptionsMonitor<LlmCompletionCacheOptions> opts =
            new(new LlmCompletionCacheOptions { Enabled = true, TTLSeconds = 3600, MaxEntries = 32 });

        MutableOptionsMonitor<LlmTelemetryLabelOptions> telemetry =
            new(new LlmTelemetryLabelOptions { ProviderId = "metric-agent", ModelDeploymentLabel = "m1" });

        using MemoryCache memCache = new(new MemoryCacheOptions { SizeLimit = 32 });

        ILlmCompletionResponseCache cacheBackend = new LlmCompletionResponseCache(memCache, opts);

        CachingLlmCompletionClient sut =
            new(
                inner,
                cacheBackend,
                simulatorMode: false,
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

        _ = await sut.CompleteJsonAsync("s", "u");
        _ = await sut.CompleteJsonAsync("s", "u");

        capture.LongMeasures.Should()
            .Contain(m =>
                m.Name == "archlucid_llm_cache_misses_total"
                && m.Value == 1
                && m.Tags.Any(t =>
                    t.Key == "agent_type"
                    && string.Equals(t.Value as string, "metric-agent", StringComparison.Ordinal)));

        capture.LongMeasures.Should()
            .Contain(m =>
                m.Name == "archlucid_llm_cache_hits_total"
                && m.Value == 1
                && m.Tags.Any(t =>
                    t.Key == "agent_type"
                    && string.Equals(t.Value as string, "metric-agent", StringComparison.Ordinal)));
    }

    private sealed class CountingCompletionClient : IAgentCompletionClient
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
            CancellationToken cancellationToken = default)
        {
            CallCount++;

            return Task.FromResult("{\"n\":" + CallCount + "}");
        }
    }

    private sealed class FixedScopeProvider(ScopeContext scope) : IScopeContextProvider
    {
        private readonly ScopeContext _scope = scope ?? throw new ArgumentNullException(nameof(scope));

        public ScopeContext GetCurrentScope()
        {
            return _scope;
        }
    }

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

    private sealed class LongMeasurementCapture : IDisposable
    {
        private readonly MeterListener _listener = new();

        private readonly List<LongMeasurementRecord> _longMeasures = [];

        private LongMeasurementCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<long>(OnMeasurementLong);
            _listener.Start();
        }

        public IReadOnlyList<LongMeasurementRecord> LongMeasures => _longMeasures;

        public void Dispose()
        {
            _listener.Dispose();
        }

        public static LongMeasurementCapture Start()
        {
            return new LongMeasurementCapture();
        }

        private void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidInstrumentation.MeterName)

                return;


            string name = instrument.Name;

            if (name is "archlucid_llm_cache_hits_total" or "archlucid_llm_cache_misses_total")
                meterListener.EnableMeasurementEvents(instrument);
        }

        private void OnMeasurementLong(
            Instrument instrument,
            long measurement,
            ReadOnlySpan<KeyValuePair<string, object?>> tags,
            object? state)
        {
            _ = state;

            _longMeasures.Add(new LongMeasurementRecord(instrument.Name, measurement, ToList(tags)));
        }

        private static List<KeyValuePair<string, object?>> ToList(
            ReadOnlySpan<KeyValuePair<string, object?>> tags)
        {
            List<KeyValuePair<string, object?>> list = [];

            foreach (KeyValuePair<string, object?> t in tags)
                list.Add(t);

            return list;
        }

        public sealed record LongMeasurementRecord(
            string Name,
            long Value,
            List<KeyValuePair<string, object?>> Tags);
    }
}
