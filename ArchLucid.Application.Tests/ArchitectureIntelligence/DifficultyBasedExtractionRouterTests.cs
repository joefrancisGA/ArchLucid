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
    public void Extract_detects_public_endpoint()
    {
        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(
            "Public API exposes customer data.",
            "src-test");

        elements.Should().Contain(element => element.Name.Contains("Public endpoint", StringComparison.OrdinalIgnoreCase));
    }
}
