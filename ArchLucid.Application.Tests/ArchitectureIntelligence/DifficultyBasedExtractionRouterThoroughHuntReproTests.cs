using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class DifficultyBasedExtractionRouterThoroughHuntReproTests
{
    private readonly DifficultyBasedExtractionRouter _router = new();

    [Fact]
    public void Extract_does_not_emit_ownership_gap_for_single_tilde_strike_owner_with_unowned()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "Wiki RACI lists ~owner~ for platform. Legacy racks remain unowned.",
            "single-tilde-owner");

        elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Extract_does_not_emit_ownership_gap_for_possessive_owner_with_unowned()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "The owner's on-call rotation is documented. DR racks remain unowned.",
            "possessive-owner");

        elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Extract_does_not_emit_ownership_gap_for_service_line_owner_gateway_with_unowned()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            """
            service: owner-gateway
            Legacy racks remain unowned.
            """,
            "service-owner-gateway");

        elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Classify_as_is_underscore_shorthand_is_clear_extraction_without_dual_markers()
    {
        _router.Classify(
                """
                as_is
                component: billing worker
                to_be
                component: billing worker v2
                """)
            .Should().Be(ExtractionDifficulty.ClearExtraction);
    }

    [Fact]
    public void Extract_tags_target_lifecycle_scope_after_narrow_no_break_space_to_be_header()
    {
        string narrowSpace = "to\u202Fbe";
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            $"""
            as is
            component: billing
            {narrowSpace}
            component: billing v2
            """,
            "nnbsp-to-be");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.TargetState);
    }

    [Fact]
    public void Extract_tags_current_lifecycle_scope_after_figure_space_as_is_header()
    {
        string figureSpace = "as\u2007is";
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            $"""
            {figureSpace}
            component: billing
            to be
            component: billing v2
            """,
            "figure-space-as-is");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.TargetState);

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing", StringComparison.OrdinalIgnoreCase)
            && !element.Name.Contains("v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.CurrentState);
    }

    [Fact]
    public void Classify_returns_human_review_for_soc_2_with_no_break_space()
    {
        _router.Classify("Workload must meet soc\u00A02 control objectives.")
            .Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Extract_does_not_emit_ownership_gap_for_fullwidth_colon_owner_label_with_unowned()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "RACI maps owner：platform team. Legacy racks remain unowned.",
            "fullwidth-colon-owner");

        elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Extract_tags_lifecycle_scope_when_as_is_uses_soft_hyphen_line_break()
    {
        string softHyphen = "as\u00ADis";
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            $"""
            {softHyphen}
            component: billing
            to be
            component: billing v2
            """,
            "soft-hyphen-as-is");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.TargetState);
    }

    [Fact]
    public void Classify_returns_ambiguous_for_nbsp_as_is_with_ascii_to_be()
    {
        string asIsHeader = "as\u00A0is";
        _router.Classify(
                $"""
                {asIsHeader}
                component: billing
                to be
                component: billing v2
                """)
            .Should().Be(ExtractionDifficulty.AmbiguousExtraction);
    }

    [Fact]
    public void Extract_emits_dual_lifecycle_transition_for_nbsp_as_is_with_ascii_to_be()
    {
        string asIsHeader = "as\u00A0is";
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            $"""
            {asIsHeader}
            component: billing
            to be
            component: billing v2
            """,
            "nbsp-as-is-to-be");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Assumption
            && element.Name.Contains("Current vs target", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Classify_returns_human_review_for_data_protection_with_ideographic_space()
    {
        string phrase = "data\u3000protection";
        _router.Classify($"Policies must satisfy {phrase} controls.")
            .Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Extract_does_not_emit_ownership_gap_for_fullwidth_parentheses_owner_label_with_unowned()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "RACI lists （owner）platform team. Legacy racks remain unowned.",
            "fullwidth-paren-owner");

        elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Extract_tags_target_lifecycle_scope_after_multiplication_sign_as_is_typo_header()
    {
        string header = "as\u00D7is";
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            $"""
            {header}
            component: billing
            to be
            component: billing v2
            """,
            "multiply-as-is-typo");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.TargetState);
    }

    [Fact]
    public void Extract_tags_target_lifecycle_scope_after_composed_to_be_acute_header()
    {
        string header = "to be\u0301";
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            $"""
            as is
            component: billing
            {header}
            component: billing v2
            """,
            "composed-to-be-acute");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.TargetState);
    }

    [Fact]
    public void Extract_emits_ownership_gap_when_only_plural_owners_mentions_unowned()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "Owners rotate weekly. Several racks are still unowned.",
            "plural-owners-only");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }
}
