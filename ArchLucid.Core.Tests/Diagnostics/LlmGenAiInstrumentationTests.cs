using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Suite", "Core")]
public sealed class LlmGenAiInstrumentationTests
{
    [Fact]
    public void RecordLlmGenAiOperationDurationMilliseconds_emits_histogram_with_operation_and_status_tags()
    {
        _ = ArchLucidInstrumentation.LlmGenAiOperationDurationMilliseconds;

        using GenAiDurationCapture cap = GenAiDurationCapture.Start();

        ArchLucidInstrumentation.RecordLlmGenAiOperationDurationMilliseconds("chat", 42.5, succeeded: true);

        DoubleMeasurementRecord? hit = cap.DoubleMeasures.FirstOrDefault(m =>
            m.Name == "archlucid_llm_gen_ai_operation_duration_ms");
        hit.Should().NotBeNull();
        hit!.Value.Should().BeApproximately(42.5, 0.001);
        hit.Tags.Should().Contain(t => t.Key == "gen_ai.operation.name" && (string?)t.Value == "chat");
        hit.Tags.Should().Contain(t => t.Key == "status" && (string?)t.Value == "ok");
    }

    [Fact]
    public void RecordLlmGenAiOperationDurationMilliseconds_records_error_status()
    {
        _ = ArchLucidInstrumentation.LlmGenAiOperationDurationMilliseconds;

        using GenAiDurationCapture cap = GenAiDurationCapture.Start();

        ArchLucidInstrumentation.RecordLlmGenAiOperationDurationMilliseconds("embeddings", 3, succeeded: false);

        DoubleMeasurementRecord? hit =
            cap.DoubleMeasures.FirstOrDefault(m => m.Name == "archlucid_llm_gen_ai_operation_duration_ms");
        hit.Should().NotBeNull();
        hit!.Tags.Should().Contain(t => t.Key == "gen_ai.operation.name" && (string?)t.Value == "embeddings");
        hit.Tags.Should().Contain(t => t.Key == "status" && (string?)t.Value == "error");
    }

    [Fact]
    public void RecordLlmGenAiOperationDurationMilliseconds_rejects_unknown_operation()
    {
        _ = ArchLucidInstrumentation.LlmGenAiOperationDurationMilliseconds;

        Action act = () => ArchLucidInstrumentation.RecordLlmGenAiOperationDurationMilliseconds("invoke", 1, true);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void RecordLlmEmbeddingInputTokens_adds_counter_with_optional_deployment_tag()
    {
        _ = ArchLucidInstrumentation.LlmEmbeddingInputTokensTotal;

        using EmbeddingTokensCapture cap = EmbeddingTokensCapture.Start();

        ArchLucidInstrumentation.RecordLlmEmbeddingInputTokens(100, "text-embedding-3-large");

        LongMeasurementRecord? hit = cap.LongMeasures.FirstOrDefault(m =>
            m.Name == "archlucid_llm_embedding_input_tokens_total");
        hit.Should().NotBeNull();
        hit!.Value.Should().Be(100);
        hit.Tags.Should().Contain(t => t.Key == "llm_deployment" && (string?)t.Value == "text-embedding-3-large");
    }

    private sealed class GenAiDurationCapture : IDisposable
    {
        private readonly List<DoubleMeasurementRecord> _doubleMeasures = [];

        private readonly MeterListener _listener = new();

        private GenAiDurationCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<double>(OnDouble);
            _listener.Start();
        }

        public IReadOnlyList<DoubleMeasurementRecord> DoubleMeasures => _doubleMeasures;

        public void Dispose()
        {
            _listener.Dispose();
        }

        public static GenAiDurationCapture Start() => new();

        private static void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidInstrumentation.MeterName)
                return;

            if (instrument.Name == "archlucid_llm_gen_ai_operation_duration_ms")
                meterListener.EnableMeasurementEvents(instrument);
        }

        private void OnDouble(
            Instrument instrument,
            double measurement,
            ReadOnlySpan<KeyValuePair<string, object?>> tags,
            object? state)
        {
            _ = state;
            _doubleMeasures.Add(new DoubleMeasurementRecord(instrument.Name, measurement, ToList(tags)));
        }

        private static List<KeyValuePair<string, object?>> ToList(ReadOnlySpan<KeyValuePair<string, object?>> tags)
        {
            List<KeyValuePair<string, object?>> list = [];

            foreach (KeyValuePair<string, object?> tag in tags)
                list.Add(tag);

            return list;
        }
    }

    private sealed class EmbeddingTokensCapture : IDisposable
    {
        private readonly List<LongMeasurementRecord> _longMeasures = [];

        private readonly MeterListener _listener = new();

        private EmbeddingTokensCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<long>(OnLong);
            _listener.Start();
        }

        public IReadOnlyList<LongMeasurementRecord> LongMeasures => _longMeasures;

        public void Dispose()
        {
            _listener.Dispose();
        }

        public static EmbeddingTokensCapture Start() => new();

        private static void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidInstrumentation.MeterName)
                return;

            if (instrument.Name == "archlucid_llm_embedding_input_tokens_total")
                meterListener.EnableMeasurementEvents(instrument);
        }

        private void OnLong(
            Instrument instrument,
            long measurement,
            ReadOnlySpan<KeyValuePair<string, object?>> tags,
            object? state)
        {
            _ = state;
            _longMeasures.Add(new LongMeasurementRecord(instrument.Name, measurement, ToList(tags)));
        }

        private static List<KeyValuePair<string, object?>> ToList(ReadOnlySpan<KeyValuePair<string, object?>> tags)
        {
            List<KeyValuePair<string, object?>> list = [];

            foreach (KeyValuePair<string, object?> tag in tags)
                list.Add(tag);

            return list;
        }
    }

    private sealed record DoubleMeasurementRecord(string Name, double Value, List<KeyValuePair<string, object?>> Tags);

    private sealed record LongMeasurementRecord(string Name, long Value, List<KeyValuePair<string, object?>> Tags);
}
