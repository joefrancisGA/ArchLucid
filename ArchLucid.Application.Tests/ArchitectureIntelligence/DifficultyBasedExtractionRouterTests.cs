using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class DifficultyBasedExtractionRouterTests
{
    private readonly DifficultyBasedExtractionRouter _router = new();

    [Fact]
    public void Classify_returns_structured_parse_for_json()
    {
        ExtractionDifficulty difficulty = _router.Classify("{\"component\":\"api\"}");

        difficulty.Should().Be(ExtractionDifficulty.StructuredParse);
    }

    [Fact]
    public void Classify_returns_ambiguous_for_current_and_target_state()
    {
        ExtractionDifficulty difficulty = _router.Classify("Current state is monolith. Target state is services.");

        difficulty.Should().Be(ExtractionDifficulty.AmbiguousExtraction);
    }

    [Fact]
    public void Extract_tags_current_and_target_state_elements_with_lifecycle_scope()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "Current state uses monolith. Target state uses microservices.",
            "src-lifecycle");

        elements.Should().Contain(element =>
            element.Name.Contains("Current vs target state", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.Transition);
    }

    [Fact]
    public void Extract_emits_diagram_vs_prose_contradiction()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "The diagram contradicts the prose about database replication.",
            "src-contradiction-diagram");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Contradiction
            && element.Name == "Diagram vs prose contradiction");
    }

    [Fact]
    public void Extract_emits_policy_vs_component_contradiction()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "The policy contradicts the component inventory.",
            "src-contradiction-policy");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Contradiction
            && element.Name == "Policy vs component contradiction");
    }

    [Fact]
    public void Extract_emits_generic_contradiction()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "These two artifacts contradict each other.",
            "src-contradiction-generic");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Contradiction
            && element.Name == "Contradiction");
    }
}
