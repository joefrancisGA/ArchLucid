using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandLlmJudgePolicyTests
{
    [Fact]
    public void As074_default_path_uses_heuristic_scorer_without_calling_llm_judge()
    {
        const string citation =
            "Kubernetes ingress controller exposes the storefront workload on port 443.";

        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Title = "Storage exposure",
            Rationale =
                "PostgreSQL firewall rules allow unrestricted storage account access from the public internet.",
            EvidenceRefs = [citation],
        };

        RecordingFindingSemanticSupportBandLlmJudge recordingJudge = new();

        FindingSemanticSupportBandDefaultsApplicator.Apply([finding]);
        FindingSemanticSupportBandEmissionApplicator.Apply(
            [finding],
            new FindingSemanticSupportBandOptions(),
            recordingJudge);

        recordingJudge.InvocationCount.Should().Be(0);
        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unsupported);
    }

    [Fact]
    public void As074_enable_llm_judge_defers_to_heuristic_when_judge_returns_null()
    {
        const string citation =
            "The API gateway terminates TLS and forwards traffic to the internal router service.";

        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Title = "Gateway posture",
            Rationale = citation,
            EvidenceRefs = [citation],
        };

        RecordingFindingSemanticSupportBandLlmJudge recordingJudge = new();

        FindingSemanticSupportBandDefaultsApplicator.Apply([finding]);
        FindingSemanticSupportBandEmissionApplicator.Apply(
            [finding],
            new FindingSemanticSupportBandOptions { EnableLlmJudge = true },
            recordingJudge);

        recordingJudge.InvocationCount.Should().Be(1);
        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Supported);
    }

    private sealed class RecordingFindingSemanticSupportBandLlmJudge : IFindingSemanticSupportBandLlmJudge
    {
        public int InvocationCount { get; private set; }

        public FindingSemanticSupportBand? TryScore(
            Finding finding,
            string findingMessage,
            IReadOnlyList<string> citationExcerpts,
            FindingSemanticSupportBandOptions options)
        {
            InvocationCount++;
            return null;
        }
    }
}
