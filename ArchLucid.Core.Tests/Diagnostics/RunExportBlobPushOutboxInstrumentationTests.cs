using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Category", "Unit")]
public sealed class RunExportBlobPushOutboxInstrumentationTests
{
    [Fact]
    public void RecordRunExportBlobPushOutbox_counters_emit_expected_instruments()
    {
        _ = ArchLucidInstrumentation.RunExportBlobPushOutboxProcessedSuccessTotal;
        _ = ArchLucidInstrumentation.RunExportBlobPushOutboxRetryScheduledTotal;
        _ = ArchLucidInstrumentation.RunExportBlobPushOutboxDeadLetteredTotal;

        using RunExportOutboxCapture capture = RunExportOutboxCapture.Start();

        ArchLucidInstrumentation.RecordRunExportBlobPushOutboxProcessedSuccess();
        ArchLucidInstrumentation.RecordRunExportBlobPushOutboxRetryScheduled();
        ArchLucidInstrumentation.RecordRunExportBlobPushOutboxDeadLettered();

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_run_export_blob_push_outbox_processed_success_total" && m.Value == 1);
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_run_export_blob_push_outbox_retry_scheduled_total" && m.Value == 1);
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_run_export_blob_push_outbox_dead_lettered_total" && m.Value == 1);
    }

    private sealed class RunExportOutboxCapture : IDisposable
    {
        private readonly List<LongMeasurementRecord> _longMeasures = [];
        private readonly MeterListener _listener = new();

        private RunExportOutboxCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<long>(OnLong);
            _listener.Start();
        }

        public IReadOnlyList<LongMeasurementRecord> LongMeasures => _longMeasures;

        public void Dispose() => _listener.Dispose();

        public static RunExportOutboxCapture Start() => new();

        private static void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidInstrumentationTestSupport.MeterName)
                return;

            if (instrument.Name is "archlucid_run_export_blob_push_outbox_processed_success_total"
                or "archlucid_run_export_blob_push_outbox_retry_scheduled_total"
                or "archlucid_run_export_blob_push_outbox_dead_lettered_total")
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

    private sealed record LongMeasurementRecord(string Name, long Value, List<KeyValuePair<string, object?>> Tags);
}
