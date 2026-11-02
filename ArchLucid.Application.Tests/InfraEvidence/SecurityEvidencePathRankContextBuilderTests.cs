using ArchLucid.Application.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathRankContextBuilderTests
{
    private static readonly Guid PathA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid PathB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public void BuildNextStoredPathRankContext_names_the_next_stored_path_and_dimension()
    {
        IReadOnlyList<SecurityEvidencePathRankRecord> ranks =
        [
            CreateRank(PathA, rankOrder: 1, technicalExposure: 3m),
            CreateRank(PathB, rankOrder: 2, technicalExposure: 1m),
        ];

        string sentence = SecurityEvidencePathRankContextBuilder.BuildNextStoredPathRankContext(PathA, ranks);

        sentence.Should().Contain(PathB.ToString("D"));
        sentence.Should().Contain("TechnicalExposure");
        sentence.Should().Contain("This does not change the rank.");
    }

    [Fact]
    public void BuildNextStoredPathRankContext_returns_no_next_sentence_for_last_ranked_path()
    {
        IReadOnlyList<SecurityEvidencePathRankRecord> ranks =
        [
            CreateRank(PathA, rankOrder: 1, technicalExposure: 3m),
            CreateRank(PathB, rankOrder: 2, technicalExposure: 1m),
        ];

        SecurityEvidencePathRankContextBuilder.BuildNextStoredPathRankContext(PathB, ranks)
            .Should()
            .Be(SecurityEvidencePathRankContextBuilder.NoNextStoredPathSentence);
    }

    private static SecurityEvidencePathRankRecord CreateRank(
        Guid pathId,
        int rankOrder,
        decimal technicalExposure) =>
        new()
        {
            PathId = pathId,
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            SnapshotId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            RankOrder = rankOrder,
            TechnicalExposureScore = technicalExposure,
            PrivilegeDepthScore = 1m,
            BlastRadiusScore = 1m,
            ConfidenceBandScore = 1m,
            CompositeSortScore = 1m,
            RuleVersion = "test",
            ExplanationSummary = "sample",
            BreakdownJson = "[]",
            ComputedUtc = DateTime.UtcNow,
        };
}
