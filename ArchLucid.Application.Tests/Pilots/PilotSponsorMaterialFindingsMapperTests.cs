using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotSponsorMaterialFindingsMapperTests
{
    [Fact]
    public void MapFromSnapshotFinding_uses_not_stored_copy_when_title_and_rationale_missing()
    {
        Finding finding = new()
        {
            FindingId = "finding-abc",
            Severity = FindingSeverity.Error,
            Category = "",
            Title = "",
            Rationale = "",
        };

        ArchitectureFinding mapped = PilotSponsorMaterialFindingsMapper.MapFromSnapshotFinding(finding);

        mapped.Message.Should().Be(PilotSponsorMaterialFindingsHonestyCopy.FindingTitleNotStored);
        mapped.Category.Should().Be(PilotSponsorMaterialFindingsHonestyCopy.CategoryNotStored);
    }
}
