using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Evaluation;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests.Evaluation;

/// <summary>RAG-V1-005 output-side citation coverage eval for policy-pack retrieval scenarios.</summary>
[Trait("Category", "Unit")]
public sealed class RetrievalCitationCoverageEvalTests
{
    private const double PolicyPackCitationFloor = 0.5;

    [Fact]
    public void Policy_pack_scenario_meets_citation_coverage_floor()
    {
        List<RetrievalHit> hits =
        [
            new() { SourceId = "rule-42", Title = "Encryption At Rest", CorpusKind = "PolicyPack" },
            new() { SourceId = "rule-99", Title = "Private Endpoints", CorpusKind = "PolicyPack" },
        ];

        string agentOutput = "Controls include rule-42 and Private Endpoints per assigned pack.";

        RetrievalFaithfulnessReport report = RetrievalFaithfulnessEvaluator.Evaluate(hits, agentOutput);

        report.SupportRatio.Should().BeGreaterOrEqualTo(PolicyPackCitationFloor);
    }

    [Fact]
    public void Prior_manifest_scenario_meets_citation_coverage_floor()
    {
        List<RetrievalHit> hits =
        [
            new()
            {
                SourceId = "manifest-decision-7",
                Title = "Use Azure SQL with private endpoint",
                CorpusKind = "PriorManifest",
            },
        ];

        string agentOutput = "Prior run selected Azure SQL with private endpoint (manifest-decision-7).";

        RetrievalFaithfulnessReport report = RetrievalFaithfulnessEvaluator.Evaluate(hits, agentOutput);

        report.SupportRatio.Should().BeGreaterOrEqualTo(PolicyPackCitationFloor);
    }

    [Fact]
    public void Missing_citations_fails_configured_floor()
    {
        List<RetrievalHit> hits =
        [
            new() { SourceId = "rule-1", Title = "MFA", CorpusKind = "PolicyPack" },
        ];

        RetrievalFaithfulnessReport report = RetrievalFaithfulnessEvaluator.Evaluate(hits, "No pack references.");

        report.SupportRatio.Should().BeLessThan(PolicyPackCitationFloor);
    }
}
