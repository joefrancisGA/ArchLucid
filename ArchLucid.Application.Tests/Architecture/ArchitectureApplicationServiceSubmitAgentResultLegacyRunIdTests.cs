using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Common;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureApplicationServiceSubmitAgentResultLegacyRunIdTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CompareQuality_SubmitAgentResultAsync_merges_persisted_results_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        AgentResult criticResult = CommitReady(AgentType.Critic, canonicalRunId, "task-critic", "result-critic");

        List<AgentTask> tasks =
        [
            CommitReadyTask(AgentType.Topology, canonicalRunId, "task-topology"),
            CommitReadyTask(AgentType.Cost, canonicalRunId, "task-cost"),
            CommitReadyTask(AgentType.Compliance, canonicalRunId, "task-compliance"),
            CommitReadyTask(AgentType.Critic, canonicalRunId, "task-critic"),
        ];

        ArchitectureRun run = new()
        {
            RunId = canonicalRunId,
            RequestId = "req-1",
            Status = ArchitectureRunStatus.WaitingForResults,
        };

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = run,
                Tasks = tasks,
                Results =
                [
                    CommitReady(AgentType.Topology, legacyUpper, "task-topology", "result-topology"),
                    CommitReady(AgentType.Cost, legacyUpper, "task-cost", "result-cost"),
                    CommitReady(AgentType.Compliance, legacyUpper, "task-compliance", "result-compliance"),
                ],
                AuthorityPipelineComplete = false,
            });

        DateTime upstreamCreated = DateTime.UtcNow.AddMinutes(-5);
        DateTime criticCreated = DateTime.UtcNow;

        AgentResult topologyResult = CommitReady(AgentType.Topology, legacyUpper, "task-topology", "result-topology", upstreamCreated);
        AgentResult costResult = CommitReady(AgentType.Cost, legacyUpper, "task-cost", "result-cost", upstreamCreated);
        AgentResult complianceResult = CommitReady(AgentType.Compliance, legacyUpper, "task-compliance", "result-compliance", upstreamCreated);
        criticResult.CreatedUtc = criticCreated;
        AgentDownstreamConsistency.StampCriticResults([topologyResult, costResult, complianceResult, criticResult]);

        Mock<IAgentResultRepository> results = new();
        results
            .Setup(r => r.CreateAsync(criticResult, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        results
            .Setup(r => r.GetByRunIdAsync(TestScope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([topologyResult, costResult, complianceResult, criticResult]);
        results
            .Setup(r => r.GetByRunIdAsync(
                TestScope,
                It.Is<string>(id => id != canonicalRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        string? logText = null;
        Mock<ILogger<ArchitectureApplicationService>> logger = new();
        logger.Setup(l => l.IsEnabled(It.IsAny<LogLevel>())).Returns(true);
        logger
            .Setup(l => l.Log(
                It.IsAny<LogLevel>(),
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
            .Callback(new InvocationAction(invocation =>
            {
                Delegate formatter = (Delegate)invocation.Arguments[4];
                object state = invocation.Arguments[2];
                object? ex = invocation.Arguments[3];
                logText = formatter.DynamicInvoke(state, ex) as string;
            }));

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IAgentArchitectureFindingConfidenceEnricher> enricher = new();
        enricher
            .Setup(e => e.TryEnrichRunAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ArchitectureApplicationService sut = new(
            runDetail.Object,
            results.Object,
            Mock.Of<IUnifiedGoldenManifestReader>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IEvidenceBuilder>(),
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            Mock.Of<IRunRepository>(),
            scopeProvider.Object,
            new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build(),
            Mock.Of<IAuditService>(),
            Mock.Of<IActorContext>(),
            enricher.Object,
            new RunStateTransitionService(),
            logger.Object);

        SubmitResultResult submitResult = await sut.SubmitAgentResultAsync(canonicalRunId, criticResult);

        submitResult.Success.Should().BeTrue();
        results.Verify(
            r => r.GetByRunIdAsync(TestScope, canonicalRunId, It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
        logText.Should().NotBeNullOrWhiteSpace();
        logText.Should().Contain(nameof(ArchitectureRunStatus.ReadyForCommit));
    }

    private static AgentTask CommitReadyTask(AgentType agentType, string runId, string taskId)
    {
        return new AgentTask
        {
            RunId = runId,
            AgentType = agentType,
            TaskId = taskId,
        };
    }

    private static AgentResult CommitReady(
        AgentType agentType,
        string runId,
        string taskId,
        string resultId,
        DateTime? createdUtc = null)
    {
        return new AgentResult
        {
            ResultId = resultId,
            RunId = runId,
            TaskId = taskId,
            AgentType = agentType,
            Claims = ["ok"],
            CreatedUtc = createdUtc ?? TimeProvider.System.UtcNowDateTime(),
        };
    }
}
