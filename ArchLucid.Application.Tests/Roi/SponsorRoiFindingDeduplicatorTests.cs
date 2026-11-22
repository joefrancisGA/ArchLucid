using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
public sealed class SponsorRoiFindingDeduplicatorTests
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

        List<ArchitectureFinding> deduped = SponsorRoiFindingDeduplicator.DeduplicateByStableIdentity(findings).ToList();

        deduped.Should().HaveCount(2);
        deduped.Should().ContainSingle(finding => finding.FindingId == "shared-id");
        deduped.Should().ContainSingle(finding => finding.FindingId == "unique-id");
    }

    [Fact]
    public void DeduplicateByStableIdentity_prefers_highest_estimated_usd_savings()
    {
        IEnumerable<ArchitectureFinding> findings =
        [
            new ArchitectureFinding { FindingId = "cost-id", Message = "zero", EstimatedUsdSavings = 0m },
            new ArchitectureFinding { FindingId = "cost-id", Message = "winner", EstimatedUsdSavings = 500m },
            new ArchitectureFinding { FindingId = "cost-id", Message = "lower", EstimatedUsdSavings = 120m },
        ];

        List<ArchitectureFinding> deduped = SponsorRoiFindingDeduplicator.DeduplicateByStableIdentity(findings).ToList();

        deduped.Should().ContainSingle();
        deduped[0].Message.Should().Be("winner");
        deduped[0].EstimatedUsdSavings.Should().Be(500m);
    }

    [Fact]
    public void DeduplicateByStableIdentity_preserves_findings_without_stable_ids()
    {
        IEnumerable<ArchitectureFinding> findings =
        [
            new ArchitectureFinding { FindingId = string.Empty, Message = "a" },
            new ArchitectureFinding { FindingId = "   ", Message = "b" },
            new ArchitectureFinding { FindingId = string.Empty, Message = "c" },
        ];

        List<ArchitectureFinding> deduped = SponsorRoiFindingDeduplicator.DeduplicateByStableIdentity(findings).ToList();

        deduped.Should().HaveCount(3);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(0, true)]
    [InlineData(-5, false)]
    [InlineData(-5, true)]
    public void DeduplicateByStableIdentity_prefers_a_known_estimate_to_an_unavailable_estimate(int estimate, bool knownFirst)
    {
        var unknown = new ArchitectureFinding { FindingId = "cost-id" };
        var known = new ArchitectureFinding { FindingId = "cost-id", EstimatedUsdSavings = estimate };
        ArchitectureFinding[] findings = knownFirst ? [known, unknown] : [unknown, known];

        SponsorRoiFindingDeduplicator.DeduplicateByStableIdentity(findings).Should().Equal(known);
    }

    [Fact]
    public void DeduplicateWithLogging_preserves_the_same_winner_and_identity_normalization()
    {
        ArchitectureFinding[] findings =
        [
            new ArchitectureFinding { FindingId = "cost-id", EstimatedUsdSavings = 50m },
            new ArchitectureFinding { FindingId = " COST-ID ", EstimatedUsdSavings = 200m },
            new ArchitectureFinding { FindingId = "cost-id", EstimatedUsdSavings = 150m },
        ];

        SponsorRoiFindingExclusionLogger.DeduplicateWithLogging(NullLogger.Instance, findings)
            .Should().Equal(findings[1]);
    }

    [Fact]
    public void DeduplicateByStableIdentity_throws_when_findings_is_null()
    {
        Action act = () => SponsorRoiFindingDeduplicator.DeduplicateByStableIdentity(null!).ToList();

        act.Should().Throw<ArgumentNullException>();
    }
}
