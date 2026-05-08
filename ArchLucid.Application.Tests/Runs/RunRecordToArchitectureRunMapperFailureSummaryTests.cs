using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Mapping;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunRecordToArchitectureRunMapperFailureSummaryTests
{
    [Fact]
    public void ToArchitectureRun_maps_LastFailureReason_JSON_to_LastAgentExecutionFailure_for_failed_run()
    {
        Guid runGuid = Guid.Parse("77777777-7777-7777-7777-777777777777");
        AgentExecutionFailureSummary summary = new()
        {
            SchemaVersion = 1,
            AgentTypeKey = AgentTypeKeys.Topology,
            AgentType = nameof(AgentType.Topology),
            FailureClass = AgentExecutionFailureClasses.InvalidOperation
        };

        string json = AgentExecutionFailureSummaryJson.Serialize(summary);
        RunRecord record = new()
        {
            RunId = runGuid,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ScopeProjectId = Guid.NewGuid(),
            ProjectId = "p",
            ArchitectureRequestId = "req",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            LastFailureReason = json
        };

        ArchitectureRun mapped = RunRecordToArchitectureRunMapper.ToArchitectureRun(record, []);

        mapped.Status.Should().Be(ArchitectureRunStatus.Failed);
        mapped.LastAgentExecutionFailure.Should().NotBeNull();
        mapped.LastAgentExecutionFailure!.AgentTypeKey.Should().Be(AgentTypeKeys.Topology);
        mapped.LastAgentExecutionFailure.FailureClass.Should().Be(AgentExecutionFailureClasses.InvalidOperation);
    }

    [Fact]
    public void ToArchitectureRun_legacy_plain_text_LastFailureReason_yields_null_LastAgentExecutionFailure()
    {
        Guid runGuid = Guid.Parse("77777777-7777-7777-7777-777777777777");
        RunRecord record = new()
        {
            RunId = runGuid,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ScopeProjectId = Guid.NewGuid(),
            ProjectId = "p",
            ArchitectureRequestId = "req",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            LastFailureReason = "System.InvalidOperationException"
        };

        ArchitectureRun mapped = RunRecordToArchitectureRunMapper.ToArchitectureRun(record, []);

        mapped.LastAgentExecutionFailure.Should().BeNull();
    }
}
