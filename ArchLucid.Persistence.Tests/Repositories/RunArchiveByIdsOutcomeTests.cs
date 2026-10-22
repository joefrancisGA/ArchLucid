using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunArchiveByIdsOutcomeTests
{
    private static readonly Guid FirstRunId = Guid.Parse("11111111-0000-0000-0000-000000000001");
    private static readonly Guid SecondRunId = Guid.Parse("11111111-0000-0000-0000-000000000002");
    private static readonly Guid ThirdRunId = Guid.Parse("11111111-0000-0000-0000-000000000003");

    [Fact]
    public void DistinctInRequestOrder_keeps_the_first_occurrence_of_each_id() =>
        RunArchiveByIdsOutcome.DistinctInRequestOrder([SecondRunId, FirstRunId, SecondRunId])
            .Should()
            .Equal(SecondRunId, FirstRunId);

    [Fact]
    public void DistinctInRequestOrder_returns_an_empty_list_for_no_ids() =>
        RunArchiveByIdsOutcome.DistinctInRequestOrder([]).Should().BeEmpty();

    [Fact]
    public void Assemble_reports_newly_archived_runs_as_succeeded()
    {
        RunArchiveByIdsResult result = RunArchiveByIdsOutcome.Assemble(
            [FirstRunId],
            [ArchivedRow(FirstRunId)],
            alreadyArchivedRunIds: [],
            Cascade());

        result.SucceededRunIds.Should().Equal(FirstRunId);
        result.Failed.Should().BeEmpty();
    }

    /// <summary>
    ///     Already-archived is the expected outcome of a retried purge, so it must be distinguishable from a bad id.
    /// </summary>
    [Fact]
    public void Assemble_separates_already_archived_from_missing_runs()
    {
        RunArchiveByIdsResult result = RunArchiveByIdsOutcome.Assemble(
            [FirstRunId, SecondRunId, ThirdRunId],
            [ArchivedRow(FirstRunId)],
            alreadyArchivedRunIds: [SecondRunId],
            Cascade());

        result.SucceededRunIds.Should().Equal(FirstRunId);
        result.Failed.Should().HaveCount(2);
        result.Failed.Single(failure => failure.RunId == SecondRunId).Reason.Should().Be("Run already archived.");
        result.Failed.Single(failure => failure.RunId == ThirdRunId).Reason.Should().Be("Run not found.");
    }

    [Fact]
    public void Assemble_reports_failures_in_request_order()
    {
        RunArchiveByIdsResult result = RunArchiveByIdsOutcome.Assemble(
            [ThirdRunId, SecondRunId, FirstRunId],
            archived: [],
            alreadyArchivedRunIds: [],
            Cascade());

        result.Failed.Select(static failure => failure.RunId).Should().Equal(ThirdRunId, SecondRunId, FirstRunId);
    }

    [Fact]
    public void Assemble_carries_the_scope_rows_and_child_cascade_through()
    {
        RunArchiveChildCascadeCounts cascade = new()
        {
            GoldenManifests = 2,
            FindingsSnapshots = 3,
        };

        RunArchiveByIdsResult result = RunArchiveByIdsOutcome.Assemble(
            [FirstRunId],
            [ArchivedRow(FirstRunId)],
            alreadyArchivedRunIds: [],
            cascade);

        result.ArchivedRuns.Should().ContainSingle();
        result.ChildCascade.Should().Be(cascade);
    }

    /// <summary>A run reported as archived is a success even if it also appears in the already-archived set.</summary>
    [Fact]
    public void Assemble_treats_a_newly_archived_run_as_succeeded_over_already_archived()
    {
        RunArchiveByIdsResult result = RunArchiveByIdsOutcome.Assemble(
            [FirstRunId],
            [ArchivedRow(FirstRunId)],
            alreadyArchivedRunIds: [FirstRunId],
            Cascade());

        result.SucceededRunIds.Should().Equal(FirstRunId);
        result.Failed.Should().BeEmpty();
    }

    private static ArchivedRunScopeRow ArchivedRow(Guid runId) =>
        new()
        {
            RunId = runId,
        };

    private static RunArchiveChildCascadeCounts Cascade() => new();
}
