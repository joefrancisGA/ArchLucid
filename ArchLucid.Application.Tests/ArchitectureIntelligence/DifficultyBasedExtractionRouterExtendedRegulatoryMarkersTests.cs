using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class DifficultyBasedExtractionRouterExtendedRegulatoryMarkersTests
{
    private readonly DifficultyBasedExtractionRouter _router = new();

    [Theory]
    [InlineData("CCPA: customer opt-out rights must be documented.")]
    [InlineData("SOC 2 Type II controls cover availability.")]
    [InlineData("PCI-DSS: cardholder data must be tokenized.")]
    [InlineData("PCI: cardholder data must be tokenized.")]
    [InlineData("PHI must be encrypted at rest.")]
    [InlineData("Personal data retention requires consent.")]
    [InlineData("ISO 27001 controls require annual attestation.")]
    [InlineData("FedRAMP Moderate boundary spans two regions.")]
    [InlineData("NIST 800-53 controls map to this design.")]
    public void Classify_returns_human_review_for_extended_regulatory_markers_without_compliance_keyword(string source)
    {
        ExtractionDifficulty difficulty = _router.Classify(source);

        difficulty.Should().Be(ExtractionDifficulty.HumanReviewRequired);
    }

    [Fact]
    public void Extract_does_not_stamp_pci_shorthand_prose_directly_established()
    {
        string source = "PCI: cardholder data must be tokenized.\nComponent: Payments API";

        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(source, "art-pci-short");

        ArchitectureModelElement component = elements
            .Should()
            .ContainSingle(element => element.Kind == ArchitectureElementKind.Component)
            .Subject;

        component.Provenance.SupportStatus.Should().Be(SupportStatus.NotYetEvaluated);
        component.ExtractionConfidence.Should().BeApproximately(0.35, 0.001);
    }

    [Fact]
    public void Extract_does_not_stamp_ccpa_prose_directly_established()
    {
        string source = "CCPA: customer opt-out rights must be documented.\nComponent: Privacy API";

        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(source, "art-ccpa-short");

        ArchitectureModelElement component = elements
            .Should()
            .ContainSingle(element => element.Kind == ArchitectureElementKind.Component)
            .Subject;

        component.Provenance.SupportStatus.Should().Be(SupportStatus.NotYetEvaluated);
        component.ExtractionConfidence.Should().BeApproximately(0.35, 0.001);
    }

    [Fact]
    public void Extract_does_not_stamp_fedramp_prose_directly_established()
    {
        string source = "FedRAMP Moderate boundary spans two regions.\nComponent: Boundary API";

        IReadOnlyList<ArchitectureModelElement> elements = _router.Extract(source, "art-fedramp-short");

        ArchitectureModelElement component = elements
            .Should()
            .ContainSingle(element => element.Kind == ArchitectureElementKind.Component)
            .Subject;

        component.Provenance.SupportStatus.Should().Be(SupportStatus.NotYetEvaluated);
        component.ExtractionConfidence.Should().BeApproximately(0.35, 0.001);
    }
}
