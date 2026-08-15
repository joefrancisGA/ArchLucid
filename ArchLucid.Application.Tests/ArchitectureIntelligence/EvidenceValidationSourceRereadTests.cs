using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class EvidenceValidationSourceRereadTests
{
    [Fact]
    public void AugmentCitedQuotesForHighSeverity_adds_source_excerpt_for_high_findings()
    {
        InMemoryImmutableSourceStore store = new();
        ImmutableSourceArtifact artifact = store.Store(
            new ImmutableSourceArtifact
            {
                ArtifactId = "artifact-1",
                TenantId = "tenant-1",
                ContentType = "text/markdown",
                Version = "v1",
            },
            System.Text.Encoding.UTF8.GetBytes("Public API exposes customer records without authentication."));

        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-high",
            Dimension = QualityDimension.Security,
            Title = "Public API exposure",
            Rationale = "No authentication described.",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "High",
            EvidenceArtifactIds = [artifact.ArtifactId],
        };

        List<string> augmented = EvidenceValidationSourceReread.AugmentCitedQuotesForHighSeverity(
            finding,
            [],
            store);

        augmented.Should().ContainSingle();
        augmented[0].Should().Contain("Public API exposes customer records");
    }

    [Fact]
    public void AugmentCitedQuotesForHighSeverity_skips_low_severity()
    {
        InMemoryImmutableSourceStore store = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-low",
            Dimension = QualityDimension.Cost,
            Title = "Cost note",
            Rationale = "Minor cost signal.",
            Conclusion = ReviewConclusion.Indeterminate,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "Low",
            EvidenceArtifactIds = ["artifact-missing"],
        };

        List<string> augmented = EvidenceValidationSourceReread.AugmentCitedQuotesForHighSeverity(
            finding,
            ["existing quote"],
            store);

        augmented.Should().ContainSingle("existing quote");
    }
}
