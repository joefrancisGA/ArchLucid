using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class DifficultyBasedExtractionRouterHunt257ProbeTests
{
    private readonly DifficultyBasedExtractionRouter _router = new();

    [Fact]
    public void Extract_does_not_emit_ownership_gap_for_single_low_quotation_owner_label_with_unowned()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "RACI lists ‚owner‛ platform. Legacy racks remain unowned.",
            "single-low-quotation-owner");

        elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Classify_returns_human_review_for_data_protection_with_six_per_em_space()
    {
        _router.Classify($"Policies must satisfy data\u2006protection controls.")
            .Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Classify_returns_ambiguous_for_figure_dash_as_is_typo_with_ascii_to_be()
    {
        _router.Classify(
                """
                as‑is
                component: billing
                to be
                component: billing v2
                """)
            .Should().Be(ExtractionDifficulty.AmbiguousExtraction);
    }

    [Fact]
    public void Classify_returns_human_review_for_pci_dss_4_0_hyphenated_shorthand()
    {
        _router.Classify("Card data must meet pci-dss-4.0 requirement 8.2.1.")
            .Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Extract_tags_target_lifecycle_scope_after_soft_hyphen_to_be_header()
    {
        string header = "to\u00ADbe";
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            $"""
            as is
            component: billing
            {header}
            component: billing v2
            """,
            "soft-hyphen-to-be");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.TargetState);
    }
}