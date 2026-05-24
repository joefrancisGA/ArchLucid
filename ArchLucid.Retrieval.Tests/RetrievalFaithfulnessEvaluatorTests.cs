using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Evaluation;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class RetrievalFaithfulnessEvaluatorTests
{
    [Fact]
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
}
