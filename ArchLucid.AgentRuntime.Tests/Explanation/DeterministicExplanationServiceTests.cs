using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.AgentRuntime.Tests.Explanation;

[Trait("Category", "Unit")]
public sealed class DeterministicExplanationServiceTests
{
    [SkippableFact]
    public void ExtractMajorChanges_maps_decision_deltas()
    {
        DeterministicExplanationService sut = new(NullLogger<DeterministicExplanationService>.Instance);
        ComparisonResult comparison = new()
        {
            DecisionChanges =
            [
                new DecisionDelta { ChangeType = "Added", DecisionKey = "storage", TargetValue = "blob" }
            ]
        };

        List<string> lines = sut.ExtractMajorChanges(comparison);

        lines.Should().Contain(s =>
            s.Contains("storage", StringComparison.OrdinalIgnoreCase)
            && s.Contains("added", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void BuildComparisonExplanation_uses_heuristic_when_json_empty_object()
    {
        DeterministicExplanationService sut = new(NullLogger<DeterministicExplanationService>.Instance);
        ComparisonResult comparison = new()
        {
            DecisionChanges =
            [
                new DecisionDelta { ChangeType = "Modified", DecisionKey = "k", BaseValue = "a", TargetValue = "b" }
            ]
        };
        List<string> major = sut.ExtractMajorChanges(comparison);

        ComparisonExplanationResult r = sut.BuildComparisonExplanation(comparison, major, "{}");

        r.HighLevelSummary.Should().NotBeNullOrWhiteSpace();
        r.Narrative.Should().NotBeNullOrWhiteSpace();
    }

    [SkippableFact]
    public void ExtractMajorChanges_uses_not_stored_copy_for_null_decision_values()
    {
        DeterministicExplanationService sut = new(NullLogger<DeterministicExplanationService>.Instance);
        ComparisonResult comparison = new()
        {
            DecisionChanges =
            [
                new DecisionDelta { ChangeType = "Modified", DecisionKey = "k", BaseValue = null, TargetValue = null }
            ]
        };

        List<string> lines = sut.ExtractMajorChanges(comparison);

        lines.Should().ContainSingle().Which.Should().ContainAll(
            "Prior value was not stored.",
            "Selected value was not stored.");
    }

    [SkippableFact]
    public void BuildComparisonExplanation_empty_lists_use_empty_comparison_copy()
    {
        DeterministicExplanationService sut = new(NullLogger<DeterministicExplanationService>.Instance);
        ComparisonResult comparison = new();

        ComparisonExplanationResult r = sut.BuildComparisonExplanation(comparison, [], null);

        r.HighLevelSummary.Should().Be("The comparison lists were empty.");
        r.Narrative.Should().Contain("A difference summary was not stored.");
    }
}
