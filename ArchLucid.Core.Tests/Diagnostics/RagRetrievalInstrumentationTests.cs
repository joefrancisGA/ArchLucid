using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Collection("ArchLucidInstrumentation")]
[Trait("Suite", "Core")]
public sealed class RagRetrievalInstrumentationTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public void RecordRagRetrievalSearch_emits_duration_and_chunk_histograms_by_corpus_kind()
    {
        _ = ArchLucidInstrumentation.RagRetrievalDurationMilliseconds;
        _ = ArchLucidInstrumentation.RagChunksRetrieved;

        using RagRetrievalCapture cap = RagRetrievalCapture.Start();

        IReadOnlyList<RetrievalHit> hits =
        [
            new RetrievalHit { CorpusKind = "TenantManifest", ChunkId = "a" },
            new RetrievalHit { CorpusKind = "PriorManifest", ChunkId = "b" },
            new RetrievalHit { CorpusKind = "PriorManifest", ChunkId = "c" },
        ];

        ArchLucidInstrumentation.RecordRagRetrievalSearch(125.5, hits, TenantId);

        DoubleMeasurementRecord? duration = cap.DoubleMeasures.FirstOrDefault(m =>
            m.Name == "archlucid_rag_retrieval_duration_ms");
        duration.Should().NotBeNull();
        duration!.Value.Should().BeApproximately(125.5, 0.001);
        duration.Tags.Should().Contain(t => t.Key == "corpus_kind" && (string?)t.Value == "mixed");

        cap.IntMeasures.Where(m => m.Name == "archlucid_rag_chunks_retrieved_total").Should().HaveCount(2);
        cap.IntMeasures.Should().Contain(m =>
            m.Name == "archlucid_rag_chunks_retrieved_total"
            && m.Value == 1
            && m.Tags.Any(t => t.Key == "corpus_kind" && (string?)t.Value == "TenantManifest"));
        cap.IntMeasures.Should().Contain(m =>
            m.Name == "archlucid_rag_chunks_retrieved_total"
            && m.Value == 2
            && m.Tags.Any(t => t.Key == "corpus_kind" && (string?)t.Value == "PriorManifest"));
    }

    [Fact]
    public void RecordRagRetrievalSearch_empty_hits_records_none_corpus_kind()
    {
        _ = ArchLucidInstrumentation.RagRetrievalDurationMilliseconds;
        _ = ArchLucidInstrumentation.RagChunksRetrieved;

        using RagRetrievalCapture cap = RagRetrievalCapture.Start();

        ArchLucidInstrumentation.RecordRagRetrievalSearch(12, [], TenantId);

        cap.DoubleMeasures.Should().ContainSingle(m =>
            m.Name == "archlucid_rag_retrieval_duration_ms"
            && m.Tags.Any(t => t.Key == "corpus_kind" && (string?)t.Value == "none"));
        cap.IntMeasures.Should().ContainSingle(m =>
            m.Name == "archlucid_rag_chunks_retrieved_total"
            && m.Value == 0
            && m.Tags.Any(t => t.Key == "corpus_kind" && (string?)t.Value == "none"));
    }

    [Fact]
    public void RecordRagRetrievalSearch_when_recordPerTenant_includes_tenant_id_tags()
    {
        _ = ArchLucidInstrumentation.RagRetrievalDurationMilliseconds;
        _ = ArchLucidInstrumentation.RagChunksRetrieved;

        using RagRetrievalCapture cap = RagRetrievalCapture.Start();

        IReadOnlyList<RetrievalHit> hits =
        [
            new RetrievalHit { CorpusKind = "TenantManifest", ChunkId = "a" },
        ];

        ArchLucidInstrumentation.RecordRagRetrievalSearch(42, hits, TenantId, recordPerTenant: true);

        cap.DoubleMeasures.Should().ContainSingle(m =>
            m.Name == "archlucid_rag_retrieval_duration_ms"
            && m.Tags.Any(t => t.Key == "tenant_id" && (string?)t.Value == TenantId.ToString("D")));
        cap.IntMeasures.Should().ContainSingle(m =>
            m.Name == "archlucid_rag_chunks_retrieved_total"
            && m.Tags.Any(t => t.Key == "tenant_id" && (string?)t.Value == TenantId.ToString("D")));
    }

    [Fact]
    public void RecordRagRetrievalSearch_when_recordPerTenant_false_omits_tenant_id_tags()
    {
        _ = ArchLucidInstrumentation.RagRetrievalDurationMilliseconds;
        _ = ArchLucidInstrumentation.RagChunksRetrieved;

        using RagRetrievalCapture cap = RagRetrievalCapture.Start();

        IReadOnlyList<RetrievalHit> hits =
        [
            new RetrievalHit { CorpusKind = "TenantManifest", ChunkId = "a" },
        ];

        ArchLucidInstrumentation.RecordRagRetrievalSearch(42, hits, TenantId, recordPerTenant: false);

        cap.DoubleMeasures.Should().ContainSingle(m =>
            m.Name == "archlucid_rag_retrieval_duration_ms"
            && m.Tags.All(t => t.Key != "tenant_id"));
        cap.IntMeasures.Should().ContainSingle(m =>
            m.Name == "archlucid_rag_chunks_retrieved_total"
            && m.Tags.All(t => t.Key != "tenant_id"));
    }

    [Fact]
    public void RecordRagRetrievalSearch_when_circuit_breaker_open_drops_tenant_id_tags()
    {
        _ = ArchLucidInstrumentation.RagRetrievalDurationMilliseconds;
        _ = ArchLucidInstrumentation.RagChunksRetrieved;

        ArchLucidInstrumentation.SetRetrievalTelemetryPerTenantTagCircuitBreaker(static () => true);

        try
        {
            using RagRetrievalCapture cap = RagRetrievalCapture.Start();

            IReadOnlyList<RetrievalHit> hits =
            [
                new RetrievalHit { CorpusKind = "TenantManifest", ChunkId = "a" },
            ];

            ArchLucidInstrumentation.RecordRagRetrievalSearch(42, hits, TenantId, recordPerTenant: true);

            cap.DoubleMeasures.Should().ContainSingle(m =>
                m.Name == "archlucid_rag_retrieval_duration_ms"
                && m.Tags.All(t => t.Key != "tenant_id"));
            cap.IntMeasures.Should().ContainSingle(m =>
                m.Name == "archlucid_rag_chunks_retrieved_total"
                && m.Tags.All(t => t.Key != "tenant_id"));
        }
        finally
        {
            ArchLucidInstrumentation.SetRetrievalTelemetryPerTenantTagCircuitBreaker(null);
        }
    }

    [Fact]
    public void RecordIntegrationEventDeliverySuccess_and_failure_emit_counters()
    {
        _ = ArchLucidInstrumentation.IntegrationEventDeliverySuccessTotal;
        _ = ArchLucidInstrumentation.IntegrationEventDeliveryFailedTotal;

        using IntegrationDeliveryCapture cap = IntegrationDeliveryCapture.Start();

        ArchLucidInstrumentation.RecordIntegrationEventDeliverySuccess("AuthorityRunCompletedV1");
        ArchLucidInstrumentation.RecordIntegrationEventDeliveryFailure("ManifestFinalizedV1");

        cap.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_integration_event_delivery_success_total"
            && m.Value == 1
            && m.Tags.Any(t => t.Key == "event_type" && (string?)t.Value == "AuthorityRunCompletedV1"));
        cap.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_integration_event_delivery_failed_total"
            && m.Value == 1
            && m.Tags.Any(t => t.Key == "event_type" && (string?)t.Value == "ManifestFinalizedV1"));
    }

    private sealed class RagRetrievalCapture : IDisposable
    {
        private readonly List<DoubleMeasurementRecord> _doubleMeasures = [];
        private readonly List<IntMeasurementRecord> _intMeasures = [];
        private readonly MeterListener _listener = new();

        private RagRetrievalCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<double>(OnDouble);
            _listener.SetMeasurementEventCallback<int>(OnInt);
            _listener.Start();
        }

        public IReadOnlyList<DoubleMeasurementRecord> DoubleMeasures => _doubleMeasures;

        public IReadOnlyList<IntMeasurementRecord> IntMeasures => _intMeasures;

        public void Dispose() => _listener.Dispose();

        public static RagRetrievalCapture Start() => new();

        private static void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidInstrumentationTestSupport.MeterName)
                return;

            if (instrument.Name is "archlucid_rag_retrieval_duration_ms" or "archlucid_rag_chunks_retrieved_total")
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

        private void OnInt(
            Instrument instrument,
            int measurement,
            ReadOnlySpan<KeyValuePair<string, object?>> tags,
            object? state)
        {
            _ = state;
            _intMeasures.Add(new IntMeasurementRecord(instrument.Name, measurement, ToList(tags)));
        }

        private static List<KeyValuePair<string, object?>> ToList(ReadOnlySpan<KeyValuePair<string, object?>> tags)
        {
            List<KeyValuePair<string, object?>> list = [];

            foreach (KeyValuePair<string, object?> tag in tags)
                list.Add(tag);

            return list;
        }
    }

    private sealed class IntegrationDeliveryCapture : IDisposable
    {
        private readonly List<LongMeasurementRecord> _longMeasures = [];
        private readonly MeterListener _listener = new();

        private IntegrationDeliveryCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<long>(OnLong);
            _listener.Start();
        }

        public IReadOnlyList<LongMeasurementRecord> LongMeasures => _longMeasures;

        public void Dispose() => _listener.Dispose();

        public static IntegrationDeliveryCapture Start() => new();

        private static void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidInstrumentationTestSupport.MeterName)
                return;

            if (instrument.Name is "archlucid_integration_event_delivery_success_total"
                or "archlucid_integration_event_delivery_failed_total")
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

    private sealed record IntMeasurementRecord(string Name, int Value, List<KeyValuePair<string, object?>> Tags);

    private sealed record LongMeasurementRecord(string Name, long Value, List<KeyValuePair<string, object?>> Tags);
}
