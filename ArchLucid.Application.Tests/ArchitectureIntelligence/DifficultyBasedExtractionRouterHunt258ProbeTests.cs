using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class DifficultyBasedExtractionRouterHunt258ProbeTests
{
    private readonly DifficultyBasedExtractionRouter _router = new();

    [Fact]
    public void Extract_does_not_emit_ownership_gap_for_double_low_quotation_owner_label_with_unowned()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "RACI lists \u201Eowner\u201F platform. Legacy racks remain unowned.",
            "double-low-quotation-owner");

        elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Classify_returns_human_review_for_data_protection_with_narrow_no_break_space()
    {
        _router.Classify($"Policies must satisfy data\u202Fprotection controls.")
            .Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Classify_returns_ambiguous_for_narrow_no_break_as_is_typo_with_ascii_to_be()
    {
        _router.Classify(
                $"""
                as\u202Fis
                component: billing
                to be
                component: billing v2
                """)
            .Should().Be(ExtractionDifficulty.AmbiguousExtraction);
    }

    [Fact]
    public void Classify_returns_human_review_for_hipaa_security_rule_hyphenated_shorthand()
    {
        _router.Classify("Safeguards must follow hipaa-security-rule baseline.")
            .Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Extract_tags_target_lifecycle_scope_after_ideographic_hyphen_to_be_header()
    {
        string header = "to\u30FBbe";
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            $"""
            as is
            component: billing
            {header}
            component: billing v2
            """,
            "ideographic-hyphen-to-be");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.TargetState);
    }
}