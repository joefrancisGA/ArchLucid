using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class DifficultyBasedExtractionRouterHunt255ProbeTests
{
    private readonly DifficultyBasedExtractionRouter _router = new();

    [Fact]
    public void Extract_does_not_emit_ownership_gap_for_corner_quote_owner_label_with_unowned()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "RACI lists 「owner」platform. Legacy racks remain unowned.",
            "corner-quote-owner");

        elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Classify_returns_human_review_for_data_protection_with_punctuation_space()
    {
        _router.Classify($"Policies must satisfy data\u2008protection controls.")
            .Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Classify_returns_ambiguous_for_horizontal_bar_as_is_typo_with_ascii_to_be()
    {
        _router.Classify(
                """
                as―is
                component: billing
                to be
                component: billing v2
                """)
            .Should().Be(ExtractionDifficulty.AmbiguousExtraction);
    }

    [Fact]
    public void Classify_returns_human_review_for_fedramp_moderate_hyphenated_shorthand()
    {
        _router.Classify("Boundary must meet fedramp-moderate baseline.")
            .Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Extract_tags_target_lifecycle_scope_after_en_dash_to_be_header()
    {
        string header = "to\u2013be";
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            $"""
            as is
            component: billing
            {header}
            component: billing v2
            """,
            "en-dash-to-be");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.TargetState);
    }
}
