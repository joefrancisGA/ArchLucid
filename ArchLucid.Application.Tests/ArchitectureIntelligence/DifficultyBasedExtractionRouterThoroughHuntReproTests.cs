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
}
