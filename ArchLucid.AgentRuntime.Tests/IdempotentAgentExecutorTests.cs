using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class IdempotentAgentExecutorTests
{
    [SkippableFact]
    public async Task ExecuteAsync_when_persisted_successful_result_exists_skips_simulator_for_that_task()
    {
        InMemoryAgentResultRepository resultRepository = new(new InMemoryAgentResultEnrichmentRepository());
        string runId = Guid.NewGuid().ToString("N");

        AgentResult persistedTopology = new()
        {
            ResultId = "res-topo",
            TaskId = "task-topo",
            RunId = runId,
            AgentType = AgentType.Topology,
            Confidence = 0.9,
            Claims = ["already done"],
            EvidenceRefs = [],
            Findings = [],
        };

        await resultRepository.CreateAsync(persistedTopology, CancellationToken.None);

        CountingInnerExecutor inner = new();
        IdempotentAgentExecutor sut = CreateSut(resultRepository, inner);
        ArchitectureRequest request = MinimalRequest();
        AgentEvidencePackage evidence = new();
        AgentTask taskTopology = new() { TaskId = "task-topo", RunId = runId, AgentType = AgentType.Topology };
        AgentTask taskCompliance = new() { TaskId = "task-comp", RunId = runId, AgentType = AgentType.Compliance };

        IReadOnlyList<AgentResult> results = await sut.ExecuteAsync(
            runId,
            request,
            evidence,
            [taskTopology, taskCompliance],
            CancellationToken.None);

        inner.InvocationCount.Should().Be(1);
        inner.LastTaskBatch.Should().ContainSingle(t => t.TaskId == "task-comp");
        results.Should().HaveCount(2);
        results.Single(r => r.TaskId == "task-topo").Claims.Should().Contain("already done");
        results.Single(r => r.TaskId == "task-comp").Claims.Should().NotBeEmpty();
    }

    private static IdempotentAgentExecutor CreateSut(InMemoryAgentResultRepository resultRepository, IAgentExecutor inner) =>
        new(
            inner,
            resultRepository,
            new FixedScopeProvider(
                new ScopeContext
                {
                    TenantId = ScopeIds.DefaultTenant,
                    WorkspaceId = ScopeIds.DefaultWorkspace,
                    ProjectId = ScopeIds.DefaultProject,
                }),
            NullLogger<IdempotentAgentExecutor>.Instance);

    private static ArchitectureRequest MinimalRequest() =>
        new()
        {
            RequestId = "r1",
            Description = "1234567890ab",
            SystemName = "S",
            Environment = "prod",
        };

    private sealed class FixedScopeProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }

    private sealed class CountingInnerExecutor : IAgentExecutor
    {
        public int InvocationCount { get; private set; }

        public IReadOnlyList<AgentTask> LastTaskBatch { get; private set; } = [];

        public Task<IReadOnlyList<AgentResult>> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            IReadOnlyCollection<AgentTask> tasks,
            CancellationToken cancellationToken = default)
        {
            InvocationCount++;
            LastTaskBatch = tasks.ToList();

            List<AgentResult> results = tasks
                .Select(task => new AgentResult
                {
                    ResultId = Guid.NewGuid().ToString("N"),
                    TaskId = task.TaskId,
                    RunId = runId,
                    AgentType = task.AgentType,
                    Confidence = 0.5,
                    Claims = ["simulated"],
                    EvidenceRefs = [],
                    Findings = [],
                })
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentResult>>(results);
        }
    }
}
