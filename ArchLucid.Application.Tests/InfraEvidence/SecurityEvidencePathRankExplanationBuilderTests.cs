using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathRankExplanationBuilderTests
{
    [Fact]
    public void BuildDimensionProse_includes_defender_posture_band_in_blast_radius_prose()
    {
        SecurityEvidencePathRecord path = new()
        {
            PathId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            PathKind = PathKind.ToxicCombination,
            PathConfidenceBand = PathConfidenceBand.Confirmed,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

        SecurityEvidencePathRankRecord rank = new()
        {
            PathId = path.PathId,
            TenantId = path.TenantId,
            SnapshotId = Guid.NewGuid(),
            RuleVersion = SecurityEvidencePathRankConstants.RuleVersion,
            TechnicalExposureScore = 3.0m,
            PrivilegeDepthScore = 2.0m,
            BlastRadiusScore = 2.25m,
            BusinessConsequenceScore = null,
            ConfidenceBandScore = 4.0m,
            CompositeSortScore = 2.5m,
            RankOrder = 1,
            ExplanationSummary = "sample",
            BreakdownJson =
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
                """,
            ComputedUtc = DateTime.UtcNow,
        };

        SecurityEvidencePathRankProse prose =
            SecurityEvidencePathRankExplanationBuilder.BuildDimensionProse(path, rank);

        prose.BlastRadius.Should().Contain("Defender posture band is Low");
        prose.BlastRadius.Should().NotContain("%");
    }
}
