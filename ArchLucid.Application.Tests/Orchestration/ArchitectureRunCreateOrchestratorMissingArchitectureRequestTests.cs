using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tests.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

/// <summary>
/// Sync CreateRun must persist ArchitectureRequest before the early-committed Runs header (TB-2190).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunCreateOrchestratorMissingArchitectureRequestTests
{
    private static readonly ScopeContext AuthorityTestScope = new()
    {
        TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        WorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        ProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff")
    };

    [Fact]
    public async Task CreateRunAsync_sync_path_persists_architecture_request_before_coordination()
    {
        List<string> sequence = [];
        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);
        requests
            .Setup(r => r.CreateAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Callback(() => sequence.Add("request"))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureRunAuthorityCoordination> coordination = new();
        coordination
            .Setup(c => c.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IArchLucidUnitOfWork?>()))
            .Callback(() => sequence.Add("coordinate"))
            .ReturnsAsync(BuildSuccessfulCoordination("req-first"));

        Mock<IEvidenceBundleRepository> evidence = new();
        evidence
            .Setup(e => e.CreateAsync(It.IsAny<EvidenceBundle>(), It.IsAny<CancellationToken>(), null, null))
            .Callback(() => sequence.Add("evidence"))
            .Returns(Task.CompletedTask);

        ArchitectureRunCreateOrchestrator sut = CreateSut(
            coordination.Object,
            requests.Object,
            Mock.Of<IRunRepository>(),
            evidence.Object,
            Mock.Of<IAgentTaskRepository>());

        ArchitectureRequest request = new()
        {
            RequestId = "req-first",
            SystemName = "Sys",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Description = "ArchitectureRequest-first ordering coverage."
        };

        _ = await sut.CreateRunAsync(request, idempotency: null, CancellationToken.None);

        sequence.Should().Equal("request", "coordinate", "evidence");
        requests.Verify(
            r => r.CreateAsync(
                It.Is<ArchitectureRequest>(x => x.RequestId == "req-first"),
                It.IsAny<CancellationToken>(),
                null,
                null),
            Times.Once);
    }

    [Fact]
    public async Task CreateRunAsync_sync_path_does_not_reinsert_architecture_request_after_coordination()
    {
        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);
        requests
            .Setup(r => r.CreateAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureRunAuthorityCoordination> coordination = new();
        coordination
            .Setup(c => c.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IArchLucidUnitOfWork?>()))
            .ReturnsAsync(BuildSuccessfulCoordination("req-once"));

        Mock<IEvidenceBundleRepository> evidence = new();
        evidence
            .Setup(e => e.CreateAsync(It.IsAny<EvidenceBundle>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        ArchitectureRunCreateOrchestrator sut = CreateSut(
            coordination.Object,
            requests.Object,
            Mock.Of<IRunRepository>(),
            evidence.Object,
            Mock.Of<IAgentTaskRepository>());

        ArchitectureRequest request = new()
        {
            RequestId = "req-once",
            SystemName = "Sys",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Description = "Single ArchitectureRequest insert on sync path."
        };

        _ = await sut.CreateRunAsync(request, idempotency: null, CancellationToken.None);

        requests.Verify(
            r => r.CreateAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                null,
                null),
            Times.Once);
    }

    [Fact]
    public async Task CreateRunAsync_sync_path_archives_run_when_post_coordination_persist_fails()
    {
        string runId = Guid.NewGuid().ToString("N");
        Guid runGuid = Guid.ParseExact(runId, "N");

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);
        requests
            .Setup(r => r.CreateAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureRunAuthorityCoordination> coordination = new();
        coordination
            .Setup(c => c.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IArchLucidUnitOfWork?>()))
            .ReturnsAsync(BuildSuccessfulCoordination("req-compensate", runId));

        Mock<IEvidenceBundleRepository> evidence = new();
        evidence
            .Setup(e => e.CreateAsync(It.IsAny<EvidenceBundle>(), It.IsAny<CancellationToken>(), null, null))
            .ThrowsAsync(new InvalidOperationException("evidence persist failed"));

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ArchiveRunsByIdsAsync(
                It.Is<IReadOnlyList<Guid>>(ids => ids.Count == 1 && ids[0] == runGuid),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunArchiveByIdsResult
            {
                SucceededRunIds = [runGuid],
                Failed = []
            });

        ArchitectureRunCreateOrchestrator sut = CreateSut(
            coordination.Object,
            requests.Object,
            runs.Object,
            evidence.Object,
            Mock.Of<IAgentTaskRepository>());

        ArchitectureRequest request = new()
        {
            RequestId = "req-compensate",
            SystemName = "Sys",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Description = "Compensate soft-archive on persist failure."
        };

        Func<Task> act = async () => await sut.CreateRunAsync(request, idempotency: null, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*evidence persist failed*");

        runs.Verify(
            r => r.ArchiveRunsByIdsAsync(
                It.Is<IReadOnlyList<Guid>>(ids => ids.Count == 1 && ids[0] == runGuid),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static CoordinationResult BuildSuccessfulCoordination(string requestId, string? runId = null)
    {
        string resolvedRunId = runId ?? Guid.NewGuid().ToString("N");

        return new CoordinationResult
        {
            Run = new ArchitectureRun
            {
                RunId = resolvedRunId,
                RequestId = requestId,
                Status = ArchitectureRunStatus.TasksGenerated,
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            },
            EvidenceBundle = new EvidenceBundle { EvidenceBundleId = "eb-" + requestId },
            Tasks = []
        };
    }

    private static ArchitectureRunCreateOrchestrator CreateSut(
        IArchitectureRunAuthorityCoordination coordination,
        IArchitectureRequestRepository requestRepository,
        IRunRepository runRepository,
        IEvidenceBundleRepository evidenceBundleRepository,
        IAgentTaskRepository taskRepository)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(AuthorityTestScope);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("test-actor");

        return new ArchitectureRunCreateOrchestrator(
            coordination,
            requestRepository,
            runRepository,
            scope.Object,
            evidenceBundleRepository,
            taskRepository,
            Mock.Of<IArchitectureRunIdempotencyRepository>(),
            actor.Object,
            Mock.Of<IBaselineMutationAuditService>(),
            Mock.Of<IAuditService>(),
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            Mock.Of<IUsageMeteringService>(),
            new InProcessCreateRunIdempotencyLock(),
            Options.Create(new ArchitectureRunCreateOptions()),
            new DisabledAsyncAuthorityPipelineModeResolver(),
            Mock.Of<IRunStateTransitionService>(),
            TimeProvider.System,
            new DefaultRequestContentSafetyPrecheck(),
            ArchitectureRunCreateOrchestratorTestSupport.CreatePolicyPackCloudBaselineApplicator(),
            WorkspaceSystemNameCollisionGuardTestDoubles.NoOp(),
            NullLogger<ArchitectureRunCreateOrchestrator>.Instance);
    }
}
