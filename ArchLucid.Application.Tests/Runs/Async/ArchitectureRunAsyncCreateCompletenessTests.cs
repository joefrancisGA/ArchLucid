using ArchLucid.Application.Runs.Async;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Async;

[Trait("Category", "Unit")]
public sealed class ArchitectureRunAsyncCreateCompletenessTests
{
    [Fact]
    public void IsIncomplete_treats_missing_header_and_created_stub_as_incomplete()
    {
        ArchitectureRunAsyncCreateCompleteness.IsIncomplete(null).Should().BeTrue();
        ArchitectureRunAsyncCreateCompleteness.IsIncomplete(new RunRecord
        {
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
        }).Should().BeTrue();
    }

    [Fact]
    public void IsIncomplete_treats_failed_without_snapshot_as_incomplete()
    {
        ArchitectureRunAsyncCreateCompleteness.IsIncomplete(new RunRecord
        {
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            ContextSnapshotId = null
        }).Should().BeTrue();
    }

    [Fact]
    public void IsIncomplete_treats_tasks_generated_as_complete()
    {
        ArchitectureRunAsyncCreateCompleteness.IsIncomplete(new RunRecord
        {
            LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated)
        }).Should().BeFalse();
    }
}
