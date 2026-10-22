using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ProvenancePresentationMapperTests
{
    [Fact]
    public void Map_collapses_directly_established_source_to_source_backed()
    {
        ClaimProvenance provenance = new()
        {
            Origin = ClaimOrigin.DirectlyExtracted,
            SupportStatus = SupportStatus.DirectlyEstablished,
            Confidence = 0.9,
        };

        ProvenancePresentationMapper.Map(provenance).Should().Be(ProvenancePresentationBucket.SourceBacked);
    }

    [Fact]
    public void MapFinding_maps_indeterminate_to_unverified()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "f1",
            Dimension = QualityDimension.Cost,
            Title = "Missing cost drivers",
            Rationale = "No CostDriver element.",
            Conclusion = ReviewConclusion.Indeterminate,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "Medium",
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.ModelInferred,
                SupportStatus = SupportStatus.Unsupported,
            },
        };

        ProvenancePresentationMapper.MapFinding(finding).Should().Be(ProvenancePresentationBucket.Unverified);
    }
}
