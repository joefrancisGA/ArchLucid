using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Host.Composition.Tests.DataConsistency;

/// <summary>
///     Ensures orphan-probe instrumentation uses stable meter names/tags (Warn / Alert / Quarantine tooling reads these counters).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DataConsistencyCounterInstrumentationContractTests
{
    [Fact]
    public void DataConsistencyOrphansDetected_add_yields_meter_named_counter_with_table_column_tags()
    {
        _ = ArchLucidInstrumentation.DataConsistencyOrphansDetected;

        using DataConsistencyCapture capture = DataConsistencyCapture.Start();

        ArchLucidInstrumentation.DataConsistencyOrphansDetected.Add(
            4,
            new KeyValuePair<string, object?>("table", "GoldenManifests"),
            new KeyValuePair<string, object?>("column", "RunId"));

        capture.LongMeasures.Should().ContainSingle(m =>
            m.Name == "archlucid_data_consistency_orphans_detected_total"
            && m.Value == 4
            && HasTag(m, "table", "GoldenManifests")
            && HasTag(m, "column", "RunId"));
    }

    [Fact]
    public void DataConsistencyAlerts_add_records_one_increment_per_slice()
    {
        _ = ArchLucidInstrumentation.DataConsistencyAlerts;

        using DataConsistencyCapture capture = DataConsistencyCapture.Start();

        ArchLucidInstrumentation.DataConsistencyAlerts.Add(
            1,
            new KeyValuePair<string, object?>("table", "ComparisonRecords"),
            new KeyValuePair<string, object?>("column", "LeftRunId"));

        capture.LongMeasures.Should().ContainSingle(m =>
            m.Name == "archlucid_data_consistency_alerts_total"
            && m.Value == 1
            && HasTag(m, "table", "ComparisonRecords")
            && HasTag(m, "column", "LeftRunId"));
    }

    [Fact]
    public void DataConsistencyOrphansQuarantined_add_reflects_bounded_insert_batches()
    {
        _ = ArchLucidInstrumentation.DataConsistencyOrphansQuarantined;

        using DataConsistencyCapture capture = DataConsistencyCapture.Start();

        ArchLucidInstrumentation.DataConsistencyOrphansQuarantined.Add(
            12,
            new KeyValuePair<string, object?>("table", "GoldenManifests"),
            new KeyValuePair<string, object?>("column", "RunId"));

        capture.LongMeasures.Should().ContainSingle(m =>
            m.Name == "archlucid_data_consistency_orphans_quarantined_total"
            && m.Value == 12
            && HasTag(m, "table", "GoldenManifests")
            && HasTag(m, "column", "RunId"));
    }

    private static bool HasTag(
        LongMeasurementRecord m,
        string key,
        string expectedValue) =>
        m.Tags.Any(t =>
            string.Equals(t.Key, key, StringComparison.Ordinal)
            && string.Equals(t.Value as string, expectedValue, StringComparison.Ordinal));

    private sealed class DataConsistencyCapture : IDisposable
    {
        private static readonly HashSet<string> WatchedCounters =
        [
            "archlucid_data_consistency_orphans_detected_total",
            "archlucid_data_consistency_alerts_total",
            "archlucid_data_consistency_orphans_quarantined_total",
        ];

        private readonly MeterListener _listener = new();
        private readonly List<LongMeasurementRecord> _longMeasures = [];

        private DataConsistencyCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<long>(OnLong);
            _listener.Start();
        }

        public IReadOnlyList<LongMeasurementRecord> LongMeasures => _longMeasures;

        public void Dispose() => _listener.Dispose();

        public static DataConsistencyCapture Start() => new();

        private void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidInstrumentation.MeterName)
                return;

            if (WatchedCounters.Contains(instrument.Name))
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

            foreach (KeyValuePair<string, object?> t in tags)
                list.Add(t);

            return list;
        }
    }

    private sealed record LongMeasurementRecord(
        string Name,
        long Value,
        IReadOnlyList<KeyValuePair<string, object?>> Tags);
}
