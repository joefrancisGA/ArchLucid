using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class DifficultyBasedExtractionRouterHunt253ProbeTests
{
    private readonly DifficultyBasedExtractionRouter _router = new();

    [Fact]
    public void Extract_does_not_emit_ownership_gap_for_lenticular_bracket_owner_label_with_unowned()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "RACI lists 〔owner〕platform. Legacy racks remain unowned.",
            "lenticular-bracket-owner");

        elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Classify_returns_human_review_for_data_protection_with_hair_space()
    {
        _router.Classify($"Policies must satisfy data\u200Aprotection controls.")
            .Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Classify_returns_ambiguous_for_em_dash_as_is_typo_with_ascii_to_be()
    {
        _router.Classify(
                """
                as—is
                component: billing
                to be
                component: billing v2
                """)
            .Should().Be(ExtractionDifficulty.AmbiguousExtraction);
    }

    [Fact]
    public void Classify_returns_human_review_for_soc_2_hyphenated_shorthand()
    {
        _router.Classify("Workload must meet soc-2 control objectives.")
            .Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Extract_tags_target_lifecycle_scope_after_narrow_no_break_hyphen_to_be_header()
    {
        string header = "to\u2011be";
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            $"""
            as is
            component: billing
            {header}
            component: billing v2
            """,
            "narrow-hyphen-to-be");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.TargetState);
    }
}
