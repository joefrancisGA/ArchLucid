using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceStableCheckKeyTests
{
    [Fact]
    public void FromFinding_is_stable_for_same_check_across_different_finding_ids()
    {
        SpecialistReviewFinding first = new()
        {
            FindingId = "finding-run-a",
            Dimension = QualityDimension.Security,
            Title = "Missing encryption on data store",
            RelatedModelElementIds = ["data-store-1"],
        };

        SpecialistReviewFinding second = new()
        {
            FindingId = "finding-run-b",
            Dimension = QualityDimension.Security,
            Title = "Missing encryption on data store",
            RelatedModelElementIds = ["data-store-1"],
        };

        string firstKey = ArchitectureIntelligenceStableCheckKey.FromFinding(first);
        string secondKey = ArchitectureIntelligenceStableCheckKey.FromFinding(second);

        firstKey.Should().Be(secondKey);
        firstKey.Should().NotContain("finding-run");
    }
}
