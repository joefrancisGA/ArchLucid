using ArchLucid.Api.Contracts;
using ArchLucid.Api.Mapping;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Mapping;

public sealed class RecommendationImproveLoopResponseMapperTests
{
    [Fact]
    public void ToEvidenceResponse_maps_diff_impact_disclaimer_and_merged_finding_ids()
    {
        RecommendationImproveLoopResult improveLoop = new()
        {
            Diff = new ArchitectureModelDiff
            {
                Entries =
                [
                    new ArchitectureModelDiffEntry
                    {
                        ElementId = "svc-1",
                        ChangeKind = "Modified",
                        Description = "Added encryption",
                    },
                ],
            },
            Impact = new ChangeImpactResult
            {
                RecommendationId = "rec-1",
                RequiresFullReReview = false,
            },
            PartialScopeDisclaimer = "Partial subgraph only.",
            ReReview = new IncrementalReReviewResult
            {
                FullReReviewTriggered = false,
                SpecialistResults =
                [
                    new SpecialistReviewResult
                    {
                        Findings =
                        [
                            new SpecialistReviewFinding { FindingId = "finding-a" },
                            new SpecialistReviewFinding { FindingId = "finding-b" },
                            new SpecialistReviewFinding { FindingId = "finding-a" },
                        ],
                    },
                ],
            },
        };

        RecommendationImproveLoopEvidenceResponse? response =
            RecommendationImproveLoopResponseMapper.ToEvidenceResponse(improveLoop);

        response.Should().NotBeNull();
        response!.DiffEntries.Should().ContainSingle(entry => entry.ElementId == "svc-1");
        response.Impact!.RecommendationId.Should().Be("rec-1");
        response.PartialScopeDisclaimer.Should().Be("Partial subgraph only.");
        response.MergedFindingIds.Should().BeEquivalentTo(["finding-a", "finding-b"]);
        response.FullReReviewTriggered.Should().BeFalse();
    }

    [Fact]
    public void ToEvidenceResponse_returns_null_when_improve_loop_missing()
    {
        RecommendationImproveLoopResponseMapper.ToEvidenceResponse(null).Should().BeNull();
    }
}
