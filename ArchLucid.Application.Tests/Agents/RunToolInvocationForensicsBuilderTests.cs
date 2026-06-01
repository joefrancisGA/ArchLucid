using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunToolInvocationForensicsBuilderTests
{
    [Fact]
    public void Build_orders_traces_and_sets_duration_from_prior_row()
    {
        DateTime t0 = new(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc);
        DateTime t1 = t0.AddSeconds(30);

        IReadOnlyList<AgentExecutionTrace> traces =
        [
            new AgentExecutionTrace
            {
                TraceId = "b",
                RunId = "run-1",
                TaskId = "task-2",
                AgentType = AgentType.Cost,
                UserPrompt = "second prompt body",
                ParseSucceeded = false,
                ErrorMessage = "parse failed",
                CreatedUtc = t1
            },
            new AgentExecutionTrace
            {
                TraceId = "a",
                RunId = "run-1",
                TaskId = "task-1",
                AgentType = AgentType.Topology,
                UserPrompt = "first",
                ParseSucceeded = true,
                CreatedUtc = t0
            }
        ];

        RunToolInvocationForensicsResponse response = RunToolInvocationForensicsBuilder.Build("run-1", traces);

        response.RunId.Should().Be("run-1");
        response.HasStructuredToolCallLog.Should().BeFalse();
        response.Rows.Should().HaveCount(2);
        response.Rows[0].TraceId.Should().Be("a");
        response.Rows[0].DurationMs.Should().BeNull();
        response.Rows[1].TraceId.Should().Be("b");
        response.Rows[1].DurationMs.Should().Be(30_000);
        response.Rows[1].Outcome.Should().Be("Failed");
        response.Rows[1].CompletenessNote.Should().Be("parse failed");
    }

    [Fact]
    public void Build_sets_blob_persistence_failure_flag()
    {
        IReadOnlyList<AgentExecutionTrace> traces =
        [
            new AgentExecutionTrace
            {
                TraceId = "t1",
                RunId = "run-2",
                TaskId = "task-1",
                AgentType = AgentType.Topology,
                UserPrompt = "x",
                ParseSucceeded = true,
                BlobUploadFailed = true,
                CreatedUtc = DateTime.UtcNow
            }
        ];

        RunToolInvocationForensicsResponse response = RunToolInvocationForensicsBuilder.Build("run-2", traces);

        response.HasTraceBlobPersistenceFailure.Should().BeTrue();
        response.Rows[0].BlobUploadFailed.Should().BeTrue();
        response.Rows[0].CompletenessNote.Should().Contain("blobUploadFailed");
    }
}
