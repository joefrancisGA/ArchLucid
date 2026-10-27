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
    public void From_null_provenance_and_inference_returns_unclassified()
    {
        DiagramEdgeVisualKindResolver.From(null, null)
            .Should()
            .Be(DiagramEdgeVisualKind.Unclassified);
    }

    [Fact]
    public void From_unrecognized_provenance_returns_unclassified()
    {
        DiagramEdgeVisualKindResolver.From("NotAFact", null)
            .Should()
            .Be(DiagramEdgeVisualKind.Unclassified);
    }

    [Fact]
    public void From_derived_fact_returns_probable()
    {
        DiagramEdgeVisualKindResolver.From("DerivedFact", GraphEdgeInferenceSources.InventoryAppAuthorizedAccess)
            .Should()
            .Be(DiagramEdgeVisualKind.Probable);
    }

    [Fact]
    public void From_deterministic_inference_app_setting_host_returns_inferred()
    {
        DiagramEdgeVisualKindResolver.From("DeterministicInference", GraphEdgeInferenceSources.InventoryHostnameInferredTarget)
            .Should()
            .Be(DiagramEdgeVisualKind.Inferred);

        DiagramEdgeVisualKindResolver.From("DeterministicInference", GraphEdgeInferenceSources.InventoryStorageHostRef)
            .Should()
            .Be(DiagramEdgeVisualKind.Inferred);
    }

    [Fact]
    public void From_blank_provenance_and_unknown_inference_returns_unclassified()
    {
        DiagramEdgeVisualKindResolver.From(null, "not-a-known-source")
            .Should()
            .Be(DiagramEdgeVisualKind.Unclassified);
    }

    [Fact]
    public void From_deterministic_inference_synapse_linked_service_guess_returns_inferred()
    {
        DiagramEdgeVisualKindResolver.From("DeterministicInference", GraphEdgeInferenceSources.InventorySynapseLinkedServiceInferred)
            .Should()
            .Be(DiagramEdgeVisualKind.Inferred);
    }

    [Fact]
    public void Build_unclassified_provenance_label_is_not_stored_sentence()
    {
        DiagramEdgeProvenanceDisplayLabelBuilder.Build("connects", DiagramEdgeVisualKind.Unclassified)
            .Should()
            .Be("Provenance was not stored.");
    }

    [Fact]
    public void Build_inferred_empty_verb_uses_relationship_omission_sentence()
    {
        DiagramEdgeProvenanceDisplayLabelBuilder.Build("  ", DiagramEdgeVisualKind.Inferred)
            .Should()
            .Be("Relationship verb was not stored.");
    }

    [Fact]
    public void Build_probable_verb_gets_probable_prefix()
    {
        DiagramEdgeProvenanceDisplayLabelBuilder.Build("connects", DiagramEdgeVisualKind.Probable)
            .Should()
            .Be("probable · connects");
    }

    [Fact]
    public void Build_probable_empty_verb_uses_probable_headline()
    {
        DiagramEdgeProvenanceDisplayLabelBuilder.Build("  ", DiagramEdgeVisualKind.Probable)
            .Should()
            .Be("probable");
    }

    [Fact]
    public void Build_inferred_app_settings_verb_omits_likely_prefix()
    {
        DiagramEdgeProvenanceDisplayLabelBuilder.Build(
                "Named in app settings. This is not a declared connection.",
                DiagramEdgeVisualKind.Inferred)
            .Should()
            .Be("Named in app settings. This is not a declared connection.");
    }
}
