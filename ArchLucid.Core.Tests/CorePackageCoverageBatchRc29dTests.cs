using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.TestSupport.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

/// <summary>RC29d package-coverage batch: cache telemetry Record helpers and counter emissions.</summary>
[Collection("ArchLucidInstrumentation")]
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc29dTests
{
    [Fact]
    public void RecordHotPathReadCache_helpers_update_cache_telemetry_snapshot()
    {
        ArchLucidInstrumentation.RecordHotPathReadCacheHit();
        ArchLucidInstrumentation.RecordHotPathReadCacheMiss();
        ArchLucidInstrumentation.RecordHotPathReadCacheInFlightDedupe();

        CacheTelemetrySnapshot snapshot = ArchLucidInstrumentation.GetCacheTelemetrySnapshot();

        snapshot.HotPathReadCacheHits.Should().BeGreaterThanOrEqualTo(1);
        snapshot.HotPathReadCacheMisses.Should().BeGreaterThanOrEqualTo(1);
        snapshot.HotPathReadCacheInFlightDeduped.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public void RecordExplanationCache_helpers_update_cache_telemetry_snapshot()
    {
        ArchLucidInstrumentation.RecordExplanationCacheHit();
        ArchLucidInstrumentation.RecordExplanationCacheMiss();

        CacheTelemetrySnapshot snapshot = ArchLucidInstrumentation.GetCacheTelemetrySnapshot();

        snapshot.ExplanationCacheHits.Should().BeGreaterThanOrEqualTo(1);
        snapshot.ExplanationCacheMisses.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public void RecordGraphProjectionCache_helpers_update_cache_telemetry_snapshot()
    {
        ArchLucidInstrumentation.RecordGraphProjectionCacheHit();
        ArchLucidInstrumentation.RecordGraphProjectionCacheMiss();
        ArchLucidInstrumentation.RecordGraphProjectionCacheOversizedBypass();

        CacheTelemetrySnapshot snapshot = ArchLucidInstrumentation.GetCacheTelemetrySnapshot();

        snapshot.GraphProjectionCacheHits.Should().BeGreaterThanOrEqualTo(1);
        snapshot.GraphProjectionCacheMisses.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public void RecordLlmCompletionCache_helpers_update_snapshot_and_emit_counters()
    {
        _ = ArchLucidInstrumentation.LlmCompletionCacheHitsTotal;
        _ = ArchLucidInstrumentation.LlmCompletionCacheMissesTotal;
        _ = ArchLucidInstrumentation.LlmCompletionCachePoisonBustsTotal;

        using LongCounterCapture capture = LongCounterCapture.Start(
            "archlucid_llm_cache_hits_total",
            "archlucid_llm_cache_misses_total",
            "archlucid_llm_cache_poison_busts_total");

        ArchLucidInstrumentation.RecordLlmCompletionCacheHit("holistic-critic");
        ArchLucidInstrumentation.RecordLlmCompletionCacheMiss("  ");
        ArchLucidInstrumentation.RecordLlmCompletionCachePoisonBust("holistic-critic");

        CacheTelemetrySnapshot snapshot = ArchLucidInstrumentation.GetCacheTelemetrySnapshot();

        snapshot.LlmCompletionCacheHits.Should().BeGreaterThanOrEqualTo(1);
        snapshot.LlmCompletionCacheMisses.Should().BeGreaterThanOrEqualTo(1);

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_llm_cache_hits_total"
            && m.Tags.Any(t => t.Key == "agent_type" && (string?)t.Value == "holistic-critic"));
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_llm_cache_misses_total"
            && m.Tags.Any(t => t.Key == "agent_type" && (string?)t.Value == "unknown"));
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_llm_cache_poison_busts_total"
            && m.Tags.Any(t => t.Key == "agent_type" && (string?)t.Value == "holistic-critic"));
    }

    [Fact]
    public void RecordRetrievalIndex_and_provenance_helpers_emit_counters()
    {
        _ = ArchLucidInstrumentation.RetrievalIndexDocumentSkippedUnchangedTotal;
        _ = ArchLucidInstrumentation.RetrievalIndexDocumentReindexedTotal;
        _ = ArchLucidInstrumentation.RetrievalIndexChunkingFingerprintInvalidatedTotal;
        _ = ArchLucidInstrumentation.ProvenanceSnapshotWritesTotal;
        _ = ArchLucidInstrumentation.ProvenanceSnapshotReadHitsTotal;
        _ = ArchLucidInstrumentation.ProvenanceSnapshotRebuildFallbackTotal;
        _ = ArchLucidInstrumentation.AzureRetailPricesHeuristicFallbackTotal;
        _ = ArchLucidInstrumentation.RagRetrievalFallbackTotal;
        _ = ArchLucidInstrumentation.RetrievalEmbeddingDimensionMismatchTotal;

        using LongCounterCapture capture = LongCounterCapture.Start(
            "archlucid_retrieval_index_documents_skipped_unchanged_total",
            "archlucid_retrieval_index_documents_reindexed_total",
            "archlucid_retrieval_index_chunking_fingerprint_invalidated_total",
            "archlucid_provenance_snapshot_writes_total",
            "archlucid_provenance_snapshot_read_hits_total",
            "archlucid_provenance_snapshot_rebuild_fallback_total",
            "archlucid_azure_retail_prices_heuristic_fallback_total",
            "archlucid_rag_retrieval_fallback_total",
            "archlucid_retrieval_embedding_dimension_mismatch_total");

        ArchLucidInstrumentation.RecordRetrievalIndexDocumentSkippedUnchanged();
        ArchLucidInstrumentation.RecordRetrievalIndexDocumentReindexed();
        ArchLucidInstrumentation.RecordRetrievalIndexChunkingFingerprintInvalidated();
        ArchLucidInstrumentation.RecordProvenanceSnapshotWrite();
        ArchLucidInstrumentation.RecordProvenanceSnapshotReadHit();
        ArchLucidInstrumentation.RecordProvenanceSnapshotRebuildFallback();
        ArchLucidInstrumentation.RecordAzureRetailPricesHeuristicFallback("Virtual Machines", "D4s_v5");
        ArchLucidInstrumentation.RecordRagRetrievalFallback();
        ArchLucidInstrumentation.RecordRetrievalEmbeddingDimensionMismatch();

        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid_retrieval_index_documents_skipped_unchanged_total");
        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid_retrieval_index_documents_reindexed_total");
        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid_retrieval_index_chunking_fingerprint_invalidated_total");
        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid_provenance_snapshot_writes_total");
        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid_provenance_snapshot_read_hits_total");
        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid_provenance_snapshot_rebuild_fallback_total");
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_azure_retail_prices_heuristic_fallback_total"
            && m.Tags.Any(t => t.Key == "service_name" && (string?)t.Value == "Virtual Machines")
            && m.Tags.Any(t => t.Key == "sku" && (string?)t.Value == "D4s_v5"));
        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid_rag_retrieval_fallback_total");
        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid_retrieval_embedding_dimension_mismatch_total");
    }

    [Fact]
    public void RecordAgentHandlerDegraded_and_llm_fallback_emit_tagged_counters()
    {
        _ = ArchLucidInstrumentation.AgentHandlerDegradationsTotal;
        _ = ArchLucidInstrumentation.LlmCompletionFallbackEngagementsTotal;

        using LongCounterCapture capture = LongCounterCapture.Start(
            "archlucid_agent_handler_degradations_total",
            "archlucid_llm_completion_fallback_engagements_total");

        ArchLucidInstrumentation.RecordAgentHandlerDegraded("cost-estimator", "timeout");
        ArchLucidInstrumentation.RecordLlmCompletionFallbackEngaged("gpt-4o-mini");

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_agent_handler_degradations_total"
            && m.Tags.Any(t => t.Key == "agent_type_key" && (string?)t.Value == "cost-estimator")
            && m.Tags.Any(t => t.Key == "degradation_reason" && (string?)t.Value == "timeout"));
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_llm_completion_fallback_engagements_total"
            && m.Tags.Any(t => t.Key == "deployment" && (string?)t.Value == "gpt-4o-mini"));
    }

    private sealed class LongCounterCapture : IDisposable
    {
        private readonly List<LongMeasurementRecord> _longMeasures = [];
        private readonly MeterListener _listener = new();

        private LongCounterCapture(IEnumerable<string> instrumentNames)
        {
            HashSet<string> names = instrumentNames.ToHashSet(StringComparer.Ordinal);

            _listener.InstrumentPublished = (instrument, meterListener) =>
            {
                if (instrument.Meter.Name != ArchLucidInstrumentationTestSupport.MeterName)
                    return;

                if (names.Contains(instrument.Name))
                    meterListener.EnableMeasurementEvents(instrument);
            };
            _listener.SetMeasurementEventCallback<long>(OnLong);
            _listener.Start();
        }

        public IReadOnlyList<LongMeasurementRecord> LongMeasures => _longMeasures;

        public void Dispose() => _listener.Dispose();

        public static LongCounterCapture Start(params string[] instrumentNames) => new(instrumentNames);

        private void OnLong(
            Instrument instrument,
            long measurement,
            ReadOnlySpan<KeyValuePair<string, object?>> tags,
            object? state)
        {
            _ = state;
            List<KeyValuePair<string, object?>> tagList = [];

            foreach (KeyValuePair<string, object?> tag in tags)
                tagList.Add(tag);

            _longMeasures.Add(new LongMeasurementRecord(instrument.Name, measurement, tagList));
        }
    }

    private sealed record LongMeasurementRecord(
        string Name,
        long Value,
        List<KeyValuePair<string, object?>> Tags);
}
