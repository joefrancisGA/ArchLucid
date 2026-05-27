using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Queries;

[Trait("Category", "Unit")]
public sealed class RunFindingCoverageProjectionTests
{
    [Fact]
    public void Build_marks_advisory_partial_failures_as_degraded_not_blocking()
    {
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete,
            EngineFailures =
            [
                new FindingEngineFailure
                {
                    EngineType = "cost",
                    Category = "Cost",
                    ErrorMessage = "offline",
                    ExceptionType = nameof(InvalidOperationException),
                    DurationMs = 1,
                    OccurredUtc = DateTime.UtcNow,
                },
            ],
            Findings =
            [
                new Finding
                {
                    FindingType = "RequirementFinding",
                    Category = "Requirement",
                    EngineType = "requirement",
                    Title = "r",
                    Rationale = "r",
                    Severity = FindingSeverity.Info,
                },
            ],
        };

        (bool degraded, RunFindingCoverageSummary? summary) = RunFindingCoverageProjection.Build(snapshot);

        degraded.Should().BeTrue();
        summary.Should().NotBeNull();
        summary!.IsDegraded.Should().BeTrue();
        summary.HasCommitBlockingFailures.Should().BeFalse();
        summary.FailedEngineLabels.Should().ContainSingle().Which.Should().Be("cost/Cost");
    }
}
