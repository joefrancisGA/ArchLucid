using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class DifficultyBasedExtractionRouterHunt252ProbeTests
{
    private readonly DifficultyBasedExtractionRouter _router = new();

    [Fact]
    public void Extract_does_not_emit_ownership_gap_for_cjk_corner_bracket_owner_label_with_unowned()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "RACI lists 【owner】platform. Legacy racks remain unowned.",
            "cjk-corner-bracket-owner");

        elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.OperationalOwnership
            && element.Name.Contains("Unowned component", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Extract_tags_target_lifecycle_scope_after_zero_width_space_as_is_header()
    {
        string header = "as\u200B is";
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            $"""
            {header}
            component: billing
            to be
            component: billing v2
            """,
            "zwsp-as-is");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.TargetState);
    }

    [Fact]
    public void Classify_returns_ambiguous_for_slash_spaced_as_is_with_ascii_to_be()
    {
        _router.Classify(
                """
                as / is
                component: billing
                to be
                component: billing v2
                """)
            .Should().Be(ExtractionDifficulty.AmbiguousExtraction);
    }

    [Fact]
    public void Extract_tags_current_lifecycle_scope_after_uppercase_as_is_header()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            """
            AS IS
            component: billing
            TO BE
            component: billing v2
            """,
            "upper-as-is");

        elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Component
            && element.Name.Contains("billing", StringComparison.OrdinalIgnoreCase)
            && !element.Name.Contains("v2", StringComparison.OrdinalIgnoreCase)
            && element.LifecycleScope == ArchitectureLifecycleScope.CurrentState);
    }
}
