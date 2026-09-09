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
    public void Extract_tags_component_after_current_state_section_even_when_target_state_appears_first()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            """
            Target state will use microservices.
            Current state is a monolith.
            Component: Orders API
            """,
            "src-reverse-section-order");

        ArchitectureModelElement component = elements
            .Should()
            .ContainSingle(element => element.Kind == ArchitectureElementKind.Component)
            .Subject;

        component.LifecycleScope.Should().Be(ArchitectureLifecycleScope.CurrentState);
    }

    [Fact]
    public void Extract_tags_component_after_as_is_section_even_when_to_be_appears_first()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            """
            to-be: microservices
            as-is: monolith
            Component: Orders API
            """,
            "src-reverse-as-is-to-be");

        ArchitectureModelElement component = elements
            .Should()
            .ContainSingle(element => element.Kind == ArchitectureElementKind.Component)
            .Subject;

        component.LifecycleScope.Should().Be(ArchitectureLifecycleScope.CurrentState);
    }

    [Fact]
    public void Extract_tags_component_after_present_state_section_even_when_future_state_appears_first()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            """
            future state: microservices
            present state: monolith
            Component: Orders API
            """,
            "src-reverse-present-future");

        ArchitectureModelElement component = elements
            .Should()
            .ContainSingle(element => element.Kind == ArchitectureElementKind.Component)
            .Subject;

        component.LifecycleScope.Should().Be(ArchitectureLifecycleScope.CurrentState);
    }

    [Fact]
    public void Extract_does_not_treat_tabular_contradiction_as_directly_established()
    {
        // Pipe tables look "structured" but contradiction markers require AmbiguousExtraction provenance.
        string source =
            """
            | Topic | Detail |
            | Risk | The diagram contradicts the prose about replication |
            Component: Orders API
            """;

        _router.Classify(source).Should().Be(ExtractionDifficulty.AmbiguousExtraction);

        IReadOnlyList<ArchitectureModelElement> elements =
            _router.Extract(source, "art-contradiction-table");

        ArchitectureModelElement contradiction = elements
            .Should()
            .ContainSingle(element => element.Kind == ArchitectureElementKind.Contradiction)
            .Subject;

        contradiction.Provenance.SupportStatus.Should().Be(SupportStatus.IndirectlySupported);
        contradiction.ExtractionConfidence.Should().BeApproximately(0.55, 0.001);
        contradiction.Provenance.Confidence.Should().BeApproximately(0.55, 0.001);
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

    [Fact]
    public void Classify_returns_human_review_for_long_sensitive_prose_without_structure()
    {
        string source =
            "GDPR compliance policy: customer records must be retained for seven years after account closure. "
            + new string('a', 220);

        ExtractionDifficulty difficulty = _router.Classify(source);

        difficulty.Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Extract_does_not_stamp_long_sensitive_prose_directly_established()
    {
        string source =
            "GDPR compliance policy: customer records must be retained for seven years after account closure. "
            + new string('a', 220)
            + "\nComponent: Compliance API";

        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(source, "art-gdpr-prose");

        ArchitectureModelElement component = elements
            .Should()
            .ContainSingle(element => element.Kind == ArchitectureElementKind.Component)
            .Subject;

        component.Provenance.SupportStatus.Should().Be(SupportStatus.NotYetEvaluated);
        component.ExtractionConfidence.Should().BeApproximately(0.35, 0.001);
    }

    [Fact]
    public void Classify_returns_human_review_for_long_structured_gdpr_json()
    {
        string source =
            """
            {
              "gdpr": "retention policy for customer records",
              "owner": "security",
              "notes": "field: value"
            }
            """ + new string('x', 220);

        ExtractionDifficulty difficulty = _router.Classify(source);

        difficulty.Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Extract_does_not_stamp_sensitive_structured_content_directly_established()
    {
        string source =
            """
            {
              "gdpr": "retention policy for customer records",
              "owner": "security",
              "notes": "field: value"
            }
            """ + new string('x', 220) + "\nComponent: Compliance API";

        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(source, "art-gdpr-json");

        ArchitectureModelElement component = elements
            .Should()
            .ContainSingle(element => element.Kind == ArchitectureElementKind.Component)
            .Subject;

        component.Provenance.SupportStatus.Should().Be(SupportStatus.NotYetEvaluated);
        component.ExtractionConfidence.Should().BeApproximately(0.35, 0.001);
    }
}
