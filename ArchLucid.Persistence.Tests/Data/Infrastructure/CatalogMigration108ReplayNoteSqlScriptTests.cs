using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Data.Infrastructure;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Suite", "Persistence")]
[Trait("Category", "Unit")]
public sealed class CatalogMigration108ReplayNoteSqlScriptTests
{
    [Fact]
    public void Contents_first_read_emits_single_low_cardinality_counter_increment()
    {
        _ = ArchLucidInstrumentation.CatalogMigrationRls108ReplayNotesTotal;

        using Catalog108Capture capture = Catalog108Capture.Start();

        CatalogMigration108ReplayNoteSqlScript script = new(
            "ArchLucid.Persistence.Migrations.108_RlsRenameToArchLucid.sql",
            "SELECT 1;",
            "catalog-a");

        _ = script.Contents;
        _ = script.Contents;

        capture.LongMeasures.Should().ContainSingle(m =>
            m.Name == "archlucid_catalog_migration_rls_108_replay_notes_total"
            && m.Value == 1
            && HasTag(m, "migration_id", "108")
            && HasTag(m, "tenant_scope", "catalog-a")
            && HasTag(m, "encounter_kind", "dbup_execute"));
    }

    private static bool HasTag(
        LongMeasurementRecord m,
        string key,
        string expectedValue) =>
        m.Tags.Any(t =>
            string.Equals(t.Key, key, StringComparison.Ordinal)
            && string.Equals(t.Value as string, expectedValue, StringComparison.Ordinal));

    private sealed class Catalog108Capture : IDisposable
    {
        private readonly List<LongMeasurementRecord> _longMeasures = [];

        private readonly MeterListener _listener = new();

        private Catalog108Capture()
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

        public static Catalog108Capture Start() => new();

        private static void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidMeterNames.Meter)
                return;

            if (instrument.Name == "archlucid_catalog_migration_rls_108_replay_notes_total")
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
            {
                list.Add(tag);
            }

            return list;
        }
    }

    private sealed record LongMeasurementRecord(string Name, long Value, List<KeyValuePair<string, object?>> Tags);
}
