using System.Diagnostics.Metrics;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
/// <summary>
///     TB-023: <see cref="ILlmCostEstimator.EstimateUsd" /> uses live rates; run-level recomputation may diverge from
///     persisted <c>AgentExecutionTrace.EstimatedCostUsd</c> after admin rate changes.
/// </summary>
public sealed class LlmCostEstimatorTests
{
    [SkippableFact]
    public void EstimateUsd_returns_null_when_disabled()
    {
        LlmCostEstimator sut = new(Options.Create(new LlmCostEstimationOptions { Enabled = false }),
            NoOpLlmCostEstimationUsdRateOverride.Instance);

        sut.EstimateUsd(100, 100).Should().BeNull();
    }

    [SkippableFact]
    public void EstimateUsd_computes_when_enabled()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true, InputUsdPerMillionTokens = 3m, OutputUsdPerMillionTokens = 15m
                }),
            NoOpLlmCostEstimationUsdRateOverride.Instance);

        decimal? usd = sut.EstimateUsd(2_000_000, 1_000_000);

        usd.Should().Be(21m);
    }

    [SkippableFact]
    public void EstimateUsd_uses_persisted_override_base_rates_before_deployment_specific()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true,
                    InputUsdPerMillionTokens = 1m,
                    OutputUsdPerMillionTokens = 1m,
                    Deployments = new Dictionary<string, LlmDeploymentUsdRates>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["dep-a"] = new LlmDeploymentUsdRates
                        {
                            InputUsdPerMillionTokens = 99m,
                            OutputUsdPerMillionTokens = 99m
                        }
                    }
                }),
            new FixedUsdRateOverride(10m, 20m));

        decimal? noLabel = sut.EstimateUsd(1_000_000, 1_000_000);
        noLabel.Should().Be(30m);

        decimal? withDep = sut.EstimateUsd(1_000_000, 1_000_000, 0, "dep-a");
        withDep.Should().Be(99m + 99m);
    }

    [SkippableFact]
    public void EstimateUsd_uses_positive_defaults_when_persisted_override_rate_is_negative()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true,
                    InputUsdPerMillionTokens = 3m,
                    OutputUsdPerMillionTokens = 15m,
                }),
            new FixedUsdRateOverride(-1m, 15m));

        sut.EstimateUsd(1_000_000, 0).Should().Be(3m);
    }

    [SkippableFact]
    public void EstimateUsd_ignores_negative_deployment_override_rates()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true,
                    InputUsdPerMillionTokens = 2m,
                    OutputUsdPerMillionTokens = 4m,
                    Deployments = new Dictionary<string, LlmDeploymentUsdRates>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["dep-a"] = new LlmDeploymentUsdRates { InputUsdPerMillionTokens = -9m },
                    },
                }),
            NoOpLlmCostEstimationUsdRateOverride.Instance);

        decimal? usd = sut.EstimateUsd(1_000_000, 0, 0, "dep-a");

        usd.Should().Be(2m);
    }

    [SkippableFact]
    public void EstimateUsd_applies_explicit_reasoning_rate_when_configured()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true,
                    InputUsdPerMillionTokens = 3m,
                    OutputUsdPerMillionTokens = 15m,
                    ReasoningUsdPerMillionTokens = 20m,
                }),
            NoOpLlmCostEstimationUsdRateOverride.Instance);

        decimal? usd = sut.EstimateUsd(1_000_000, 0, 1_000_000);

        usd.Should().Be(23m);
    }

    [SkippableFact]
    public void EstimateUsd_reasoning_falls_back_to_output_rate_when_zero()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true,
                    InputUsdPerMillionTokens = 3m,
                    OutputUsdPerMillionTokens = 15m,
                    ReasoningUsdPerMillionTokens = 0m,
                }),
            NoOpLlmCostEstimationUsdRateOverride.Instance);

        decimal? usd = sut.EstimateUsd(0, 0, 1_000_000);

        usd.Should().Be(15m);
    }

    [SkippableFact]
    public void EstimateUsd_per_deployment_reasoning_overrides_global()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true,
                    InputUsdPerMillionTokens = 3m,
                    OutputUsdPerMillionTokens = 15m,
                    ReasoningUsdPerMillionTokens = 5m,
                    Deployments = new Dictionary<string, LlmDeploymentUsdRates>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["dep-o"] = new LlmDeploymentUsdRates { ReasoningUsdPerMillionTokens = 25m },
                    },
                }),
            NoOpLlmCostEstimationUsdRateOverride.Instance);

        decimal? usd = sut.EstimateUsd(0, 0, 1_000_000, "dep-o");

        usd.Should().Be(25m);
    }

    [SkippableFact]
    public void EstimateUsd_reasoning_fallback_uses_persisted_override_output_rate()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true,
                    InputUsdPerMillionTokens = 1m,
                    OutputUsdPerMillionTokens = 2m,
                    ReasoningUsdPerMillionTokens = 0m,
                }),
            new FixedUsdRateOverride(10m, 30m));

        decimal? usd = sut.EstimateUsd(0, 0, 1_000_000);

        usd.Should().Be(30m);
    }

    [SkippableFact]
    public void EstimateUsd_reasoning_cost_records_matching_otel_counter()
    {
        _ = ArchLucidInstrumentation.LlmCostUsdTotal;

        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true,
                    InputUsdPerMillionTokens = 3m,
                    OutputUsdPerMillionTokens = 15m,
                    ReasoningUsdPerMillionTokens = 20m,
                }),
            NoOpLlmCostEstimationUsdRateOverride.Instance);

        decimal? estimatedUsd = sut.EstimateUsd(1_000_000, 0, 1_000_000);

        estimatedUsd.Should().Be(23m);

        using LlmCostUsdMeasurementCapture capture = LlmCostUsdMeasurementCapture.Start();

        ArchLucidInstrumentation.RecordLlmCostUsd(estimatedUsd!.Value, "tenant-reasoning");

        capture.DoubleMeasures.Should().Contain(m =>
            m.Name == "archlucid_llm_cost_usd_total"
            && Math.Abs(m.Value - 23d) < 1e-9
            && m.Tags.Any(t => t.Key == "tenant" && (string?)t.Value == "tenant-reasoning"));
    }

    private sealed class FixedUsdRateOverride(decimal input, decimal output) : ILlmCostEstimationUsdRateOverride
    {
        public bool TryGetUsdPerMillionRates(out decimal inputUsdPerMillionTokens, out decimal outputUsdPerMillionTokens)
        {
            inputUsdPerMillionTokens = input;
            outputUsdPerMillionTokens = output;

            return true;
        }
    }

    private sealed class LlmCostUsdMeasurementCapture : IDisposable
    {
        private readonly List<LlmCostUsdMeasurementRecord> _doubleMeasures = [];
        private readonly MeterListener _listener = new();

        private LlmCostUsdMeasurementCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<double>(OnMeasurementDouble);
            _listener.Start();
        }

        public IReadOnlyList<LlmCostUsdMeasurementRecord> DoubleMeasures => _doubleMeasures;

        public void Dispose()
        {
            _listener.Dispose();
        }

        public static LlmCostUsdMeasurementCapture Start()
        {
            return new LlmCostUsdMeasurementCapture();
        }

        private static void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidMeterNames.Meter)
                return;

            if (instrument.Name == "archlucid_llm_cost_usd_total")
                meterListener.EnableMeasurementEvents(instrument);
        }

        private void OnMeasurementDouble(
            Instrument instrument,
            double measurement,
            ReadOnlySpan<KeyValuePair<string, object?>> tags,
            object? state)
        {
            _ = state;

            _doubleMeasures.Add(new LlmCostUsdMeasurementRecord(instrument.Name, measurement, ToTagList(tags)));
        }

        private static List<KeyValuePair<string, object?>> ToTagList(ReadOnlySpan<KeyValuePair<string, object?>> tags)
        {
            List<KeyValuePair<string, object?>> list = [];

            foreach (KeyValuePair<string, object?> tag in tags)
            {
                list.Add(tag);
            }

            return list;
        }
    }

    private sealed record LlmCostUsdMeasurementRecord(
        string Name,
        double Value,
        List<KeyValuePair<string, object?>> Tags);
}
