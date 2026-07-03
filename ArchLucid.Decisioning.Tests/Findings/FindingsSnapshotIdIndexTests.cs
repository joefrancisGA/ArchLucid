using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingsSnapshotIdIndexTests
{
    [Fact]
    public void TryGet_returns_finding_by_id_in_single_pass()
    {
        Finding securityFinding = new() { FindingId = "finding-a", FindingType = "Security" };
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Findings =
            [
                securityFinding,
                new Finding { FindingId = "finding-b", FindingType = "Cost" },
            ],
        };

        FindingsSnapshotIdIndex index = new(snapshot);

        index.TryGet("finding-a", out Finding? resolved).Should().BeTrue();
        resolved.Should().BeSameAs(securityFinding);
        index.TryGet("missing", out _).Should().BeFalse();
        index.TryGet("", out _).Should().BeFalse();
    }
}
