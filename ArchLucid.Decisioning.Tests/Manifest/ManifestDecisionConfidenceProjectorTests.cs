using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Manifest;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Manifest;

[Trait("Category", "Unit")]
public sealed class ManifestDecisionConfidenceProjectorTests
{
    [Fact]
    public void FromFinding_prefers_evaluation_score()
    {
        Finding finding = new()
        {
            FindingId = "f1",
            EvaluationConfidenceScore = 82,
            ConfidenceScore = 0.5,
        };

        (double? confidence, DecisionConfidenceSource source) = ManifestDecisionConfidenceProjector.FromFinding(finding);

        confidence.Should().Be(82);
        source.Should().Be(DecisionConfidenceSource.FindingEvaluation);
    }

    [Fact]
    public void FromFinding_uses_aggregate_when_evaluation_missing()
    {
        Finding finding = new() { FindingId = "f2", ConfidenceScore = 0.71 };

        (double? confidence, DecisionConfidenceSource source) = ManifestDecisionConfidenceProjector.FromFinding(finding);

        confidence.Should().Be(0.71);
        source.Should().Be(DecisionConfidenceSource.FindingAggregate);
    }

    [Fact]
    public void FromFinding_null_scores_yield_Unknown_not_zero()
    {
        Finding finding = new() { FindingId = "f3" };

        (double? confidence, DecisionConfidenceSource source) = ManifestDecisionConfidenceProjector.FromFinding(finding);

        confidence.Should().BeNull();
        source.Should().Be(DecisionConfidenceSource.Unknown);
    }
}
