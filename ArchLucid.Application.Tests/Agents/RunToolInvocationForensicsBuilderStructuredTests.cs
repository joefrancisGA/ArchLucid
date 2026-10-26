using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class RunToolInvocationForensicsBuilderStructuredTests
{
    [Fact]
    public void Build_prefers_structured_ledger_when_rows_exist()
    {
        DateTime invoked = new(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc);

        IReadOnlyList<AgentToolInvocationRecord> structured =
        [
            new AgentToolInvocationRecord
            {
                TenantId = Guid.NewGuid(),
                RunId = Guid.NewGuid(),
                TraceId = "trace-1",
                TaskId = "task-1",
                SortOrder = 0,
                ToolName = "topology-agent",
                ArgsPreview = "summarize topology",
                Outcome = "Succeeded",
                InvokedAtUtc = invoked,
            },
        ];

        RunToolInvocationForensicsResponse response = RunToolInvocationForensicsBuilder.Build(
            "run-structured",
            traces: [],
            structuredRecords: structured);

        response.HasStructuredToolCallLog.Should().BeTrue();
        response.Rows.Should().ContainSingle();
        response.Rows[0].ToolName.Should().Be("topology-agent");
    }

    [Fact]
    public void Build_skips_null_structured_record_entries()
    {
        DateTime invoked = new(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc);

        IReadOnlyList<AgentToolInvocationRecord> structured =
        [
            null!,
            new AgentToolInvocationRecord
            {
                TenantId = Guid.NewGuid(),
                RunId = Guid.NewGuid(),
                TraceId = "trace-2",
                TaskId = "task-2",
                SortOrder = 0,
                ToolName = "compliance-agent",
                ArgsPreview = "check controls",
                Outcome = "Succeeded",
                InvokedAtUtc = invoked,
            },
        ];

        RunToolInvocationForensicsResponse response = RunToolInvocationForensicsBuilder.Build(
            "run-structured",
            traces: [],
            structuredRecords: structured);

        response.HasStructuredToolCallLog.Should().BeTrue();
        response.Rows.Should().ContainSingle();
        response.Rows[0].ToolName.Should().Be("compliance-agent");
    }

    [Fact]
    public void Build_falls_back_to_traces_when_structured_records_are_all_null()
    {
        DateTime invoked = new(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc);

        IReadOnlyList<AgentToolInvocationRecord> structured = [null!];

        IReadOnlyList<AgentExecutionTrace> traces =
        [
            new AgentExecutionTrace
            {
                TraceId = "trace-fallback",
                RunId = "run-fallback",
                TaskId = "task-fallback",
                AgentType = AgentType.Topology,
                UserPrompt = "fallback prompt",
                ParseSucceeded = true,
                CreatedUtc = invoked,
            },
        ];

        RunToolInvocationForensicsResponse response = RunToolInvocationForensicsBuilder.Build(
            "run-fallback",
            traces,
            structuredRecords: structured);

        response.HasStructuredToolCallLog.Should().BeFalse();
        response.Rows.Should().ContainSingle();
        response.Rows[0].TraceId.Should().Be("trace-fallback");
    }
}
