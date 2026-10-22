using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentResultSchemaViolationAuditCoverageTests
{
    [Fact]
    public async Task ScheduleLog_persists_audit_event_for_schema_violation()
    {
        Mock<IAuditService> audit = new();
        TaskCompletionSource<bool> logged = new(TaskCreationOptions.RunContinuationsAsynchronously);
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) =>
            {
                evt.EventType.Should().Be(AuditEventTypes.AgentResultSchemaViolation);
                logged.TrySetResult(true);
            })
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });

        AgentResultSchemaViolationException ex = new(
            "schema violation",
            ["error-1", "error-2", "error-3", "error-4"],
            """{"invalid":true}""",
            AgentType.Topology);
        string runId = Guid.NewGuid().ToString("N");

        AgentResultSchemaViolationAudit.ScheduleLog(
            audit.Object,
            scopeProvider.Object,
            ex,
            runId,
            taskId: "task-1",
            modelDeploymentName: "gpt-4o",
            modelVersion: "2024-08-06");

        await logged.Task.WaitAsync(TimeSpan.FromSeconds(5));

        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
