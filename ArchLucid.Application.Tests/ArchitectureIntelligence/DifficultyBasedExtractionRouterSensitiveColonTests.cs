using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class DifficultyBasedExtractionRouterSensitiveColonTests
{
    private readonly DifficultyBasedExtractionRouter _router = new();

    [Fact]
    public void Classify_returns_human_review_for_short_sensitive_text_with_colon()
    {
        string source = "GDPR: customer PII retention is required for compliance.";

        ExtractionDifficulty difficulty = _router.Classify(source);

        difficulty.Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Classify_returns_human_review_for_short_sensitive_text_with_colon_and_ambiguous_markers()
    {
        string source = "GDPR: trust boundary missing for PII storage.";

        ExtractionDifficulty difficulty = _router.Classify(source);

        difficulty.Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Extract_does_not_stamp_short_sensitive_colon_prose_directly_established()
    {
        string source = "GDPR: customer PII retention is required.\nComponent: Compliance API";

        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(source, "art-gdpr-short-colon");

        ArchitectureModelElement component = elements
            .Should()
            .ContainSingle(element => element.Kind == ArchitectureElementKind.Component)
            .Subject;

        component.Provenance.SupportStatus.Should().Be(SupportStatus.NotYetEvaluated);
        component.ExtractionConfidence.Should().BeApproximately(0.35, 0.001);
    }
}
