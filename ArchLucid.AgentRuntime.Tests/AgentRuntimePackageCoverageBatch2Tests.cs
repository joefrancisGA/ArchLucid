using ArchLucid.AgentRuntime.Safety;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch2Tests
{
    [Fact]
    public async Task ContentSafetyEnabledButUnconfiguredGuard_throws_on_input_and_output_checks()
    {
        ContentSafetyEnabledButUnconfiguredGuard sut = new();

        Func<Task> input = () => sut.CheckInputAsync("text", CancellationToken.None);
        Func<Task> output = () => sut.CheckOutputAsync("text", CancellationToken.None);

        await input.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*ContentSafety:Enabled is true*");
        await output.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*IContentSafetyGuard*");
    }

    [Fact]
    public void LlmTelemetryLabelOptions_exposes_default_provider_labels()
    {
        LlmTelemetryLabelOptions options = new();

        options.ProviderId.Should().Be("unknown");
        options.ModelDeploymentLabel.Should().Be("unknown");
        options.ProviderId = "azure-openai";
        options.ModelDeploymentLabel = "gpt-4o";

        options.ProviderId.Should().Be("azure-openai");
        options.ModelDeploymentLabel.Should().Be("gpt-4o");
    }

    [Fact]
    public void AgentResultSchemaViolationAudit_schedules_audit_without_throwing()
    {
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        AgentResultSchemaViolationException violation = new(
            "schema failed",
            ["error-1", "error-2", "error-3", "error-4"],
            """{"findings":[]}""",
            AgentType.Critic);

        Action act = () => AgentResultSchemaViolationAudit.ScheduleLog(
            audit.Object,
            scopeProvider.Object,
            violation,
            runId: Guid.NewGuid().ToString("N"),
            taskId: "task-1",
            modelDeploymentName: "gpt",
            modelVersion: "2024");

        act.Should().NotThrow();
        audit.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.AgentResultSchemaViolation), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
