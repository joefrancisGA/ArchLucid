using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SecurityEvidencePathRankBreakdownReaderTests
{
    [Fact]
    public void TryReadDefenderPostureBandLabel_reads_blast_radius_source_token()
    {
        string breakdownJson =
            """
            [
              {
                "dimension": "BlastRadius",
                "rawScore": 2.25,
                "weight": 0.2,
                "weightedContribution": 0.45,
                "source": "resources:0+defender-posture-low"
              }
            ]
            """;

        SecurityEvidencePathRankBreakdownReader.TryReadDefenderPostureBandLabel(breakdownJson)
            .Should()
            .Be("Low");
    }

    [Fact]
    public void TryReadDefenderPostureBandLabel_returns_null_when_companion_absent()
    {
        string breakdownJson =
            """
            [
              {
                "dimension": "BlastRadius",
                "rawScore": 1.0,
                "weight": 0.2,
                "weightedContribution": 0.2,
                "source": "resources:1"
              }
            ]
            """;

        SecurityEvidencePathRankBreakdownReader.TryReadDefenderPostureBandLabel(breakdownJson).Should().BeNull();
    }
}
