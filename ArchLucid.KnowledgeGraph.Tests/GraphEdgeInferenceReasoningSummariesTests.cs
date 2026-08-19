using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inference;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class GraphEdgeInferenceReasoningSummariesTests
{
    [Fact]
    public void ForRule_ContextMembership_is_non_empty()
    {
        string text = GraphEdgeInferenceReasoningSummaries.ForRule(GraphEdgeInferenceSources.ContextMembership);

        text.Should().NotBeNullOrWhiteSpace();
        text.Should().ContainEquivalentOf("context");
    }

    [Fact]
    public void ForRule_unknown_defaults_to_identifier()
    {
        string text = GraphEdgeInferenceReasoningSummaries.ForRule("custom-unknown-rule");

        text.Should().Contain("custom-unknown-rule");
    }
}
