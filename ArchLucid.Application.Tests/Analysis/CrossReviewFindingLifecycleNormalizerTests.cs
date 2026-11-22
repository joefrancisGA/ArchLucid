using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class CrossReviewFindingLifecycleNormalizerTests
{
    [Fact]
    public void NormalizeOnReport_retains_both_records_when_resolution_basis_differs()
    {
        EndToEndReplayComparisonReport report = new()
        {
            FindingLifecycleRecords =
            [
                new CrossReviewFindingLifecycleRecord
                {
                    State = CrossReviewFindingLifecycleState.CandidateResolved,
                    ResolutionBasis = CrossReviewFindingResolutionBasis.ConfirmedByDisposition,
                    CorrelationMethod = FindingCorrelationMethod.MessageCategoryFuzzy,
                    Severity = FindingSeverity.Warning,
                    SourceAgent = AgentType.Compliance,
                    PriorFindingId = "f-1",
                    CurrentFindingId = null,
                    Category = "cost",
                    Message = "first",
                },
                new CrossReviewFindingLifecycleRecord
                {
                    State = CrossReviewFindingLifecycleState.CandidateResolved,
                    ResolutionBasis = CrossReviewFindingResolutionBasis.Unverified,
                    CorrelationMethod = FindingCorrelationMethod.MessageCategoryFuzzy,
                    Severity = FindingSeverity.Warning,
                    SourceAgent = AgentType.Compliance,
                    PriorFindingId = "f-1",
                    CurrentFindingId = null,
                    Category = "cost",
                    Message = "second",
                },
            ],
        };

        CrossReviewFindingLifecycleNormalizer.NormalizeOnReport(report);

        report.FindingLifecycleRecords.Should().HaveCount(2);
    }
}