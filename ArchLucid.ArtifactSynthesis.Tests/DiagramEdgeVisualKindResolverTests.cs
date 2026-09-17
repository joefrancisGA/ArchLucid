using ArchLucid.ArtifactSynthesis;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DiagramEdgeVisualKindResolverTests
{
    [Fact]
    public void From_human_assertion_provenance_returns_declared()
    {
        DiagramEdgeVisualKindResolver.From("HumanAssertion", null)
            .Should()
            .Be(DiagramEdgeVisualKind.Declared);
    }

    [Fact]
    public void From_human_declared_inference_without_kind_returns_declared()
    {
        DiagramEdgeVisualKindResolver.From(null, GraphEdgeInferenceSources.HumanDeclaredConnection)
            .Should()
            .Be(DiagramEdgeVisualKind.Declared);
    }

    [Fact]
    public void From_observed_fact_with_inventory_inference_returns_observed()
    {
        DiagramEdgeVisualKindResolver.From("ObservedFact", GraphEdgeInferenceSources.InventoryNicSubnet)
            .Should()
            .Be(DiagramEdgeVisualKind.Observed);
    }

    [Fact]
    public void From_ai_inference_returns_ai_inferred()
    {
        DiagramEdgeVisualKindResolver.From("AiInference", "agent-proposal-relationship")
            .Should()
            .Be(DiagramEdgeVisualKind.AiInferred);
    }

    [Fact]
    public void From_null_provenance_and_inference_returns_observed()
    {
        DiagramEdgeVisualKindResolver.From(null, null)
            .Should()
            .Be(DiagramEdgeVisualKind.Observed);
    }

    [Theory]
    [InlineData("DerivedFact")]
    [InlineData("DeterministicInference")]
    public void From_inventory_backed_provenance_values_return_observed(string provenanceKind)
    {
        DiagramEdgeVisualKindResolver.From(provenanceKind, GraphEdgeInferenceSources.InventoryNicSubnet)
            .Should()
            .Be(DiagramEdgeVisualKind.Observed);
    }
}
