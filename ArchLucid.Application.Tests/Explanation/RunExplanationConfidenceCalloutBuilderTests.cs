using ArchLucid.Core.Explanation;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Explanation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunExplanationConfidenceCalloutBuilderTests
{
    [Fact]
    public void ResolveDisposition_returns_hold_for_deterministic_fallback()
    {
        RunExplanationConfidenceSignals signals = new(
            FaithfulnessSupportRatio: 0.95,
            DeterministicFallbackUsed: true,
            FaithfulnessWarning: null,
            CitationCount: 3);

        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void FromSummary_maps_run_explanation_summary_fields()
    {
        RunExplanationSummary summary = new()
        {
            Explanation = new ExplanationResult { Summary = "x", DetailedNarrative = "y" },
            ThemeSummaries = [],
            OverallAssessment = "ok",
            RiskPosture = "Moderate",
            FindingCount = 1,
            DecisionCount = 0,
            UnresolvedIssueCount = 0,
            ComplianceGapCount = 0,
            FaithfulnessSupportRatio = 0.4,
            Citations = [],
        };

        RunExplanationConfidenceSignals signals = RunExplanationConfidenceCalloutBuilder.FromSummary(summary);

        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }
}
