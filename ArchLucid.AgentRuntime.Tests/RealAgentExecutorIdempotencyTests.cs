using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.AgentRuntime.Tests.Support;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RealAgentExecutorIdempotencyTests
{
    [SkippableFact]
    public async Task ExecuteAsync_when_persisted_successful_result_exists_skips_handler_for_that_task()
    {
        CountingStubHandler topology = new(AgentType.Topology);
        CountingStubHandler compliance = new(AgentType.Compliance);
        InMemoryAgentResultRepository resultRepository = new();
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

        RealAgentExecutor sut = CreateSut(resultRepository, topology, compliance);
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

        topology.InvocationCount.Should().Be(0);
        compliance.InvocationCount.Should().Be(1);
        results.Should().HaveCount(2);
        results.Single(r => r.TaskId == "task-topo").Claims.Should().Contain("already done");
        results.Single(r => r.TaskId == "task-comp").Claims.Should().Contain("stub");
    }

    [SkippableFact]
    public async Task ExecuteAsync_when_persisted_degraded_result_exists_reinvokes_handler()
    {
        CountingStubHandler topology = new(AgentType.Topology);
        InMemoryAgentResultRepository resultRepository = new();
        string runId = Guid.NewGuid().ToString("N");

        AgentResult degraded = new()
        {
            ResultId = "res-degraded",
            TaskId = "task-topo",
            RunId = runId,
            AgentType = AgentType.Topology,
            Confidence = 0,
            Claims = ["degraded placeholder"],
            EvidenceRefs = [],
            Findings = [],
            DegradationReasonCode = AgentHandlerDegradationReasonCodes.CircuitOpen,
        };

        await resultRepository.CreateAsync(degraded, CancellationToken.None);

        RealAgentExecutor sut = CreateSut(resultRepository, topology);
        AgentTask taskTopology = new() { TaskId = "task-topo", RunId = runId, AgentType = AgentType.Topology };

        await sut.ExecuteAsync(runId, MinimalRequest(), new AgentEvidencePackage(), [taskTopology], CancellationToken.None);

        topology.InvocationCount.Should().Be(1);
    }

    private static RealAgentExecutor CreateSut(InMemoryAgentResultRepository resultRepository, params IAgentHandler[] handlers)
    {
        IOptions<AgentExecutionResilienceOptions> ro = Options.Create(
            new AgentExecutionResilienceOptions { MaxConcurrentHandlers = 0, PerHandlerTimeoutSeconds = 0 });

        return new RealAgentExecutor(
            handlers,
            NullLogger<RealAgentExecutor>.Instance,
            new StubPromptMonitor(new AgentPromptCatalogOptions()),
            new FixedScopeProvider(
                new ScopeContext
                {
                    TenantId = ScopeIds.DefaultTenant,
                    WorkspaceId = ScopeIds.DefaultWorkspace,
                    ProjectId = ScopeIds.DefaultProject
                }),
            new AgentHandlerConcurrencyGate(ro),
            ro,
            Options.Create(new StagedCriticAgentOptions()),
            Options.Create(new AgentOutputQualityGateOptions()),
            new NoOpPromptRedactor(),
            new FixedValueOptionsMonitor<ArchLucidLlmOptions>(new ArchLucidLlmOptions()),
            resultRepository);
    }

    private static ArchitectureRequest MinimalRequest() =>
        new()
        {
            RequestId = "r1",
            Description = "1234567890ab",
            SystemName = "S",
            Environment = "prod"
        };

    private sealed class CountingStubHandler(AgentType agentType) : IAgentHandler
    {
        public int InvocationCount { get; private set; }

        public AgentType AgentType => agentType;

        public string AgentTypeKey => AgentTypeKeys.ResolveDispatchKey(agentType);

        public Task<AgentResult> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            AgentTask task,
            CancellationToken cancellationToken = default)
        {
            InvocationCount++;

            return Task.FromResult(new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                TaskId = task.TaskId,
                RunId = runId,
                AgentType = agentType,
                Confidence = 0.5,
                Claims = ["stub"],
                EvidenceRefs = [],
                Findings = [],
            });
        }
    }
}
