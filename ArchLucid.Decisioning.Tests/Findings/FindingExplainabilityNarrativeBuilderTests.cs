using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingExplainabilityNarrativeBuilderTests
{
    [Fact]
    public void Build_empty_trace_and_no_heading_returns_empty_string()
    {
        ExplainabilityTrace trace = new();

        string text = FindingExplainabilityNarrativeBuilder.Build(string.Empty, string.Empty, "engine", trace, 0);

        text.Should().BeEmpty();
    }

    [Fact]
    public void Build_full_trace_includes_sections_and_completeness()
    {
        ExplainabilityTrace trace = new()
        {
            SourceAgentExecutionTraceId = "a1b2c3d4e5f6789012345678abcdef01",
            GraphNodeIdsExamined = ["n1"],
            RulesApplied = ["rule-a"],
            DecisionsTaken = ["decided-x"],
            AlternativePathsConsidered = ["alt-y"],
            Notes = ["note-z"],
        };

        string text = FindingExplainabilityNarrativeBuilder.Build("f1", "Title", "engine", trace, 1.0);

        text.Should().Contain("Finding f1: Title");
        text.Should().Contain("(engine: engine)");
        text.Should().MatchRegex("100\\s*%");
        text.Should().Contain("Source agent execution trace id: a1b2c3d4e5f6789012345678abcdef01");
        text.Should().Contain("Graph nodes examined");
        text.Should().Contain("- n1");
        text.Should().Contain("Rules applied");
        text.Should().Contain("- rule-a");
        text.Should().Contain("Decisions taken");
        text.Should().Contain("- decided-x");
        text.Should().Contain("Alternative paths considered");
        text.Should().Contain("- alt-y");
        text.Should().Contain("Notes");
        text.Should().Contain("- note-z");
    }

    [Fact]
    public void Build_skips_blank_list_entries()
    {
        ExplainabilityTrace trace = new()
        {
            RulesApplied = ["ok", "   ", ""],
        };

        string text = FindingExplainabilityNarrativeBuilder.Build("x", "T", "e", trace, 0.5);

        text.Should().Contain("- ok");
        text.Should().NotContain("-    ");
    }

    [Fact]
    public void Build_includes_rule_based_deterministic_marker_in_alternative_paths_section()
    {
        ExplainabilityTrace trace = new()
        {
            AlternativePathsConsidered = [ExplainabilityTraceMarkers.RuleBasedDeterministicSinglePathNote],
        };

        string text = FindingExplainabilityNarrativeBuilder.Build("f", "T", "engine", trace, 0.75);

        text.Should().Contain("Alternative paths considered");
        text.Should().Contain(ExplainabilityTraceMarkers.RuleBasedDeterministicSinglePathNote);
    }

    [Fact]
    public void Build_with_node_labels_shows_label_and_id_for_resolved_nodes()
    {
        ExplainabilityTrace trace = new()
        {
            GraphNodeIdsExamined = ["n-1"],
        };

        Dictionary<string, string> labels = new() { ["n-1"] = "Subnet A" };

        string text = FindingExplainabilityNarrativeBuilder.Build("f1", "T", "e", trace, 1.0, labels);

        text.Should().Contain("Graph nodes examined");
        text.Should().Contain("- Subnet A (n-1)");
    }

    [Fact]
    public void Build_with_partial_node_labels_mixed_lines()
    {
        ExplainabilityTrace trace = new()
        {
            GraphNodeIdsExamined = ["a", "b"],
        };

        Dictionary<string, string> labels = new() { ["a"] = "L1" };

        string text = FindingExplainabilityNarrativeBuilder.Build("x", "T", "e", trace, 0.5, labels);

        text.Should().Contain("- L1 (a)");
        text.Should().Contain("- b");
    }

    [Fact]
    public void Build_with_null_node_labels_matches_overload_without_labels()
    {
        ExplainabilityTrace trace = new()
        {
            GraphNodeIdsExamined = ["n1"],
        };

        string without = FindingExplainabilityNarrativeBuilder.Build("f", "T", "e", trace, 0.5);
        string withNull = FindingExplainabilityNarrativeBuilder.Build("f", "T", "e", trace, 0.5, null);

        withNull.Should().Be(without);
    }
}
