using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Collection("ArchLucidInstrumentation")]
[Trait("Suite", "Core")]
public sealed class LlmPromptCacheInstrumentationTests
{
    [Fact]
    public void RecordLlmTokenUsage_updates_prompt_cache_hit_ratio_gauge()
    {
        ArchLucidInstrumentation.TestingResetProviderPromptCacheAggregates();
        _ = ArchLucidInstrumentation.LlmPromptTokensTotal;
        _ = ArchLucidInstrumentation.LlmCachedPromptTokensTotal;
        ArchLucidInstrumentation.EnsureLlmPromptCacheObservableInstrumentsRegistered();

        double? observedRatio = null;

        using MeterListener listener = new();
        listener.InstrumentPublished = (instrument, listener) =>
        {
            if (instrument.Name == "archlucid_llm_prompt_cache_hit_ratio")
                listener.EnableMeasurementEvents(instrument);
        };
        listener.SetMeasurementEventCallback<double>((instrument, measurement, tags, state) =>
        {
            if (instrument.Name == "archlucid_llm_prompt_cache_hit_ratio")
                observedRatio = measurement;
        });
        listener.Start();

        ArchLucidInstrumentation.RecordLlmTokenUsage(
            promptTokens: 100,
            completionTokens: 0,
            recordPerTenant: false,
            tenantIdNormalized: null,
            cachedPromptTokens: 40);

        listener.RecordObservableInstruments();

        observedRatio.Should().BeApproximately(0.4, 0.0001);
    }
}
