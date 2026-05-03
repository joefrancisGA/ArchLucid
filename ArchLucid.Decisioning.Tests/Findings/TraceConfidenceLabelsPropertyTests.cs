using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

using FsCheck;
using FsCheck.Xunit;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TraceConfidenceLabelsPropertyTests
{
    [Property(MaxTest = 300)]
    public Property FromCompletenessRatio_maps_to_high_medium_or_low()
    {
        return Prop.ForAll(
            Arb.Default.Float(),
            f =>
            {
                double r = Math.Clamp(f, 0, 1);
                string label = TraceConfidenceLabels.FromCompletenessRatio(r);

                return label is TraceConfidenceLabels.High or TraceConfidenceLabels.Medium or TraceConfidenceLabels.Low;
            });
    }

    [Fact]
    public void AnalyzeFinding_completeness_ratio_in_range_for_all_trace_field_toggle_combinations()
    {
        for (int mask = 0; mask < 64; mask++)
        {
            Finding f = new()
            {
                FindingType = "t",
                Category = "c",
                EngineType = "e",
                Title = "title",
                Rationale = "r",
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = (mask & 1) != 0 ? ["a"] : [],
                    RulesApplied = (mask & 2) != 0 ? ["r1"] : [],
                    DecisionsTaken = (mask & 4) != 0 ? ["d1"] : [],
                    AlternativePathsConsidered = (mask & 8) != 0 ? ["x"] : [],
                    Notes = (mask & 16) != 0 ? ["n"] : [],
                    Citations = (mask & 32) != 0 ? ["c1"] : [],
                },
            };

            TraceCompletenessScore score = ExplainabilityTraceCompletenessAnalyzer.AnalyzeFinding(f);

            score.CompletenessRatio.Should().BeGreaterThanOrEqualTo(0);
            score.CompletenessRatio.Should().BeLessThanOrEqualTo(1.0 + 1e-9);
        }
    }
}
