using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Collection("ArchLucidInstrumentation")]
[Trait("Suite", "Core")]
public sealed class GraphRagRetrievalInstrumentationTests
{
    [Fact]
    public void RecordGraphRagExpansion_emits_neighbor_counter_and_latency_histogram()
    {
        _ = ArchLucidInstrumentation.GraphRagNeighborsAddedTotal;
        _ = ArchLucidInstrumentation.GraphRagExpansionLatencyMilliseconds;

        using GraphRagCapture capture = GraphRagCapture.Start();

        ArchLucidInstrumentation.RecordGraphRagExpansion(3, 18.25);

        capture.LongMeasures.Should().ContainSingle(m =>
            m.Name == "graph_rag_neighbors_added_total" && m.Value == 3);

        DoubleMeasurementRecord latency = capture.DoubleMeasures.Should().ContainSingle(m =>
            m.Name == "graph_rag_expansion_latency_ms").Subject;

        latency.Value.Should().BeApproximately(18.25, 0.001);
    }

    [Fact]
    public void RecordGraphRagExpansion_when_zero_neighbors_skips_counter_but_records_latency()
    {
        _ = ArchLucidInstrumentation.GraphRagNeighborsAddedTotal;
        _ = ArchLucidInstrumentation.GraphRagExpansionLatencyMilliseconds;

        using GraphRagCapture capture = GraphRagCapture.Start();

        ArchLucidInstrumentation.RecordGraphRagExpansion(0, 4.5);

        capture.LongMeasures.Should().BeEmpty();

        DoubleMeasurementRecord latency = capture.DoubleMeasures.Should().ContainSingle(m =>
            m.Name == "graph_rag_expansion_latency_ms").Subject;

        latency.Value.Should().BeApproximately(4.5, 0.001);
    }

    private sealed class GraphRagCapture : IDisposable
    {
        private readonly List<LongMeasurementRecord> _longMeasures = [];
        private readonly List<DoubleMeasurementRecord> _doubleMeasures = [];
        private readonly MeterListener _listener = new();

        private GraphRagCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<long>(OnLong);
            _listener.SetMeasurementEventCallback<double>(OnDouble);
            _listener.Start();
        }

        public IReadOnlyList<LongMeasurementRecord> LongMeasures => _longMeasures;

        public IReadOnlyList<DoubleMeasurementRecord> DoubleMeasures => _doubleMeasures;

        public void Dispose() => _listener.Dispose();

        public static GraphRagCapture Start() => new();

        private static void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidInstrumentationTestSupport.MeterName)
                return;

            if (instrument.Name is "graph_rag_neighbors_added_total" or "graph_rag_expansion_latency_ms")
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

    private sealed record LongMeasurementRecord(string Name, long Value, List<KeyValuePair<string, object?>> Tags);

    private sealed record DoubleMeasurementRecord(string Name, double Value, List<KeyValuePair<string, object?>> Tags);
}
