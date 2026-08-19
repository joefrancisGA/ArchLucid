using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Evaluation;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class RetrievalFaithfulnessEvaluatorTests
{    [Fact]
    public void Evaluate_empty_hits_returns_perfect_ratio()
    {
        RetrievalFaithfulnessReport report =
            RetrievalFaithfulnessEvaluator.Evaluate([], "any output");

        report.RetrievedChunkCount.Should().Be(0);
        report.SupportRatio.Should().Be(1d);
    }

    [Fact]
    public void Evaluate_counts_cited_source_ids_and_titles()
    {
        List<RetrievalHit> hits =
        [
            new() { SourceId = "rule-42", Title = "Encryption At Rest" },
            new() { SourceId = "rule-99", Title = "Private Endpoints" },
        ];

        RetrievalFaithfulnessReport report = RetrievalFaithfulnessEvaluator.Evaluate(
            hits,
            "Mandatory controls include rule-42 and mention Private Endpoints.");

        report.RetrievedChunkCount.Should().Be(2);
        report.SupportedChunkCount.Should().Be(2);
        report.SupportRatio.Should().Be(1d);
        report.UnsupportedSourceIds.Should().BeEmpty();
    }

    [Fact]
    public void EvaluateAndRecord_emits_retrieval_faithfulness_histogram_with_tags()
    {
        _ = ArchLucidInstrumentation.RetrievalFaithfulnessRatio;

        using RetrievalFaithfulnessCapture cap = RetrievalFaithfulnessCapture.Start();

        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        List<RetrievalHit> hits =
        [
            new() { SourceId = "rule-1", Title = "Key Vault", CorpusKind = "PolicyPack" },
            new() { SourceId = "rule-2", Title = "Managed Identity", CorpusKind = "PolicyPack" },
        ];

        RetrievalFaithfulnessReport report = RetrievalFaithfulnessEvaluator.EvaluateAndRecord(
            hits,
            "Output cites rule-1 only.",
            tenantId);

        report.SupportRatio.Should().Be(0.5d);

        DoubleMeasurementRecord? measure = cap.DoubleMeasures.SingleOrDefault(m =>
            m.Name == "archlucid_retrieval_faithfulness_ratio");

        measure.Should().NotBeNull();
        measure!.Value.Should().BeApproximately(0.5d, 0.001);
        measure.Tags.Should().Contain(t => t.Key == "tenant_id" && (string?)t.Value == tenantId.ToString("D"));
        measure.Tags.Should().Contain(t => t.Key == "corpus_source" && (string?)t.Value == "PolicyPack");
    }

    [Fact]
    public void Evaluate_lists_unsupported_source_ids()
    {
        List<RetrievalHit> hits =
        [
            new() { SourceId = "rule-1", Title = "Key Vault" },
            new() { SourceId = "rule-2", Title = "Managed Identity" },
        ];

        RetrievalFaithfulnessReport report = RetrievalFaithfulnessEvaluator.Evaluate(
            hits,
            "Output cites rule-1 only.");

        report.SupportedChunkCount.Should().Be(1);
        report.SupportRatio.Should().Be(0.5d);
        report.UnsupportedSourceIds.Should().ContainSingle("rule-2");
    }

    private sealed class RetrievalFaithfulnessCapture : IDisposable
    {
        private readonly List<DoubleMeasurementRecord> _doubleMeasures = [];
        private readonly MeterListener _listener = new();

        private RetrievalFaithfulnessCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<double>(OnDouble);
            _listener.Start();
        }

        public IReadOnlyList<DoubleMeasurementRecord> DoubleMeasures => _doubleMeasures;

        public void Dispose() => _listener.Dispose();

        public static RetrievalFaithfulnessCapture Start() => new();

        private static void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidInstrumentation.MeterName)
                return;

            if (instrument.Name == "archlucid_retrieval_faithfulness_ratio")
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

    private sealed record DoubleMeasurementRecord(string Name, double Value, List<KeyValuePair<string, object?>> Tags);
}
