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

    [Fact]
    public void Build_treats_null_engine_failures_and_findings_as_empty()
    {
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            GenerationStatus = FindingsSnapshotGenerationStatus.Complete,
            EngineFailures = null!,
            Findings = null!,
        };

        (bool degraded, RunFindingCoverageSummary? summary) = RunFindingCoverageProjection.Build(snapshot);

        degraded.Should().BeFalse();
        summary.Should().NotBeNull();
        summary!.EnginesFailed.Should().Be(0);
        summary.HasCommitBlockingFailures.Should().BeFalse();
    }

    [Fact]
    public void Build_does_not_count_partial_findings_or_repeated_failures_as_extra_engine_successes()
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
                new() { EngineType = "cost", Category = "Cost", ErrorMessage = "Timed out", ExceptionType = "TimeoutException" },
                new() { EngineType = "Cost", Category = "cost", ErrorMessage = "Retry failed", ExceptionType = "TimeoutException" },
            ],
            Findings =
            [
                new()
                {
                    FindingType = "CostFinding", EngineType = "COST", Category = "Cost",
                    Title = "Partial cost result", Rationale = "Observed before timeout.", Severity = FindingSeverity.Info,
                },
                new()
                {
                    FindingType = "RequirementFinding", EngineType = "requirement", Category = "Requirement",
                    Title = "Requirement result", Rationale = "Reported independently.", Severity = FindingSeverity.Info,
                },
            ],
        };

        (bool degraded, RunFindingCoverageSummary? summary) = RunFindingCoverageProjection.Build(snapshot);

        degraded.Should().BeTrue();
        summary!.EnginesAttempted.Should().Be(2);
        summary.EnginesSucceeded.Should().Be(1);
        summary.EnginesFailed.Should().Be(1);
        summary.FailedEngineLabels.Should().ContainSingle();
        snapshot.Findings.Should().HaveCount(2);
    }
}
