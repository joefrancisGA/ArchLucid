using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
public sealed class ExecutiveRoiFindingDeduplicatorTests
{
    [Fact]
    public void DeduplicateByStableIdentity_collapses_case_insensitive_ids()
    {
        IEnumerable<ArchitectureFinding> findings =
        [
            new ArchitectureFinding { FindingId = "shared-id", Message = "first" },
            new ArchitectureFinding { FindingId = "SHARED-ID", Message = "duplicate" },
            new ArchitectureFinding { FindingId = "unique-id", Message = "second" },
        ];

        List<ArchitectureFinding> deduped = ExecutiveRoiFindingDeduplicator.DeduplicateByStableIdentity(findings).ToList();

        deduped.Should().HaveCount(2);
        deduped.Should().ContainSingle(finding => finding.FindingId == "shared-id");
        deduped.Should().ContainSingle(finding => finding.FindingId == "unique-id");
    }

    [Fact]
    public void DeduplicateByStableIdentity_preserves_findings_without_stable_ids()
    {
        IEnumerable<ArchitectureFinding> findings =
        [
            new ArchitectureFinding { FindingId = null, Message = "a" },
            new ArchitectureFinding { FindingId = "   ", Message = "b" },
            new ArchitectureFinding { FindingId = null, Message = "c" },
        ];

        List<ArchitectureFinding> deduped = ExecutiveRoiFindingDeduplicator.DeduplicateByStableIdentity(findings).ToList();

        deduped.Should().HaveCount(3);
    }

    [Fact]
    public void DeduplicateByStableIdentity_throws_when_findings_is_null()
    {
        Action act = () => ExecutiveRoiFindingDeduplicator.DeduplicateByStableIdentity(null!).ToList();

        act.Should().Throw<ArgumentNullException>();
    }
}
