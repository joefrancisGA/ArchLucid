using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingsSnapshotTypeIndexTests
{
    [Fact]
    public void GetByType_returns_matching_findings_in_single_pass()
    {
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Findings =
            [
                new Finding { FindingId = "a", FindingType = "Security" },
                new Finding { FindingId = "b", FindingType = "Cost" },
                new Finding { FindingId = "c", FindingType = "security" },
            ],
        };

        FindingsSnapshotTypeIndex index = new(snapshot);

        IReadOnlyList<Finding> security = index.GetByType("Security");

        security.Should().HaveCount(2);
        security.Select(f => f.FindingId).Should().BeEquivalentTo(["a", "c"]);
        index.GetByType("Cost").Should().ContainSingle(f => f.FindingId == "b");
        index.GetByType("Missing").Should().BeEmpty();
    }
}
