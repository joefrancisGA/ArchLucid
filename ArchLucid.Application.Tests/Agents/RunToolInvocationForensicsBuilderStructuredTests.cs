using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;

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
}
