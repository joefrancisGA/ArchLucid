using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tests.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
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
///     Async create complete must not enlist a unit of work across authority coordination
///     (that serializes later admits behind the pipeline and trips the 60s UI proxy).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunCreateOrchestratorAsyncCompleteTests
{
    private static readonly ScopeContext AuthorityTestScope = new()
    {
        TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        WorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        ProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff")
    };

    [Fact]
    public async Task CompleteAsyncAcceptedCreateRunAsync_coordinates_without_enlisted_unit_of_work()
    {
        Guid runId = Guid.NewGuid();
        string runIdText = runId.ToString("N");
        Mock<IArchitectureRunAuthorityCoordination> coordination = new();
        coordination
            .Setup(c => c.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IArchLucidUnitOfWork?>(),
                It.IsAny<Guid?>()))
            .ReturnsAsync(BuildSuccessfulCoordination("req-async-complete", runIdText));

        Mock<IEvidenceBundleRepository> evidence = new();
        evidence
            .Setup(e => e.CreateAsync(
                It.IsAny<EvidenceBundle>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(Task.CompletedTask);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(AuthorityTestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId, ArchitectureRequestId = "req-async-complete" });

        ArchitectureRunCreateOrchestrator sut = CreateSut(
            coordination.Object,
            runs.Object,
            evidence.Object);

        ArchitectureRequest request = new()
        {
            RequestId = "req-async-complete",
            SystemName = "Sys",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Description = "Detached coordination for async create complete."
        };

        await sut.CompleteAsyncAcceptedCreateRunAsync(
            runId,
            request,
            idempotency: null,
            CancellationToken.None);

        coordination.Verify(
            c => c.CreateRunAsync(
                request,
                It.IsAny<CancellationToken>(),
                null,
                runId),
            Times.Once);
        coordination.Verify(
            c => c.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                It.Is<IArchLucidUnitOfWork?>(uow => uow != null),
                It.IsAny<Guid?>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteAsyncAcceptedCreateRunAsync_opens_unit_of_work_after_coordination()
    {
        Guid runId = Guid.NewGuid();
        string runIdText = runId.ToString("N");
        List<string> sequence = [];
        Mock<IArchitectureRunAuthorityCoordination> coordination = new();
        coordination
            .Setup(c => c.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IArchLucidUnitOfWork?>(),
                It.IsAny<Guid?>()))
            .Callback(() => sequence.Add("coordinate"))
            .ReturnsAsync(BuildSuccessfulCoordination("req-async-uow-order", runIdText));

        IArchLucidUnitOfWorkFactory inner = ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory();
        Mock<IArchLucidUnitOfWorkFactory> factory = new();
        factory
            .Setup(f => f.CreateAsync(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken ct) =>
            {
                sequence.Add("uow");

                return inner.CreateAsync(ct);
            });

        Mock<IEvidenceBundleRepository> evidence = new();
        evidence
            .Setup(e => e.CreateAsync(
                It.IsAny<EvidenceBundle>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .Returns(Task.CompletedTask);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(AuthorityTestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId, ArchitectureRequestId = "req-async-uow-order" });

        ArchitectureRunCreateOrchestrator sut = CreateSut(
            coordination.Object,
            runs.Object,
            evidence.Object,
            factory.Object);

        await sut.CompleteAsyncAcceptedCreateRunAsync(
            runId,
            new ArchitectureRequest
            {
                RequestId = "req-async-uow-order",
                SystemName = "Sys",
                Environment = "prod",
                CloudProvider = CloudProvider.Azure,
                Description = "UoW must open after coordination."
            },
            idempotency: null,
            CancellationToken.None);

        sequence.Should().Equal("coordinate", "uow");
    }

    [Fact]
    public async Task CompleteAsyncAcceptedCreateRunAsync_marks_run_failed_when_persist_throws()
    {
        Guid runId = Guid.NewGuid();
        string runIdText = runId.ToString("N");
        Mock<IArchitectureRunAuthorityCoordination> coordination = new();
        coordination
            .Setup(c => c.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IArchLucidUnitOfWork?>(),
                It.IsAny<Guid?>()))
            .ReturnsAsync(BuildSuccessfulCoordination("req-async-persist-fail", runIdText));

        Mock<IEvidenceBundleRepository> evidence = new();
        evidence
            .Setup(e => e.CreateAsync(
                It.IsAny<EvidenceBundle>(),
                It.IsAny<CancellationToken>(),
                null,
                null))
            .ThrowsAsync(new InvalidOperationException("evidence persist failed"));

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(AuthorityTestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                ArchitectureRequestId = "req-async-persist-fail",
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
            });
        runs
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        ArchitectureRunCreateOrchestrator sut = CreateSut(
            coordination.Object,
            runs.Object,
            evidence.Object);

        Func<Task> act = () => sut.CompleteAsyncAcceptedCreateRunAsync(
            runId,
            new ArchitectureRequest
            {
                RequestId = "req-async-persist-fail",
                SystemName = "Sys",
                Environment = "prod",
                CloudProvider = CloudProvider.Azure,
                Description = "Persist failure should fail the admitted stub."
            },
            idempotency: null,
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("evidence persist failed");
        runs.Verify(
            r => r.UpdateAsync(
                It.Is<RunRecord>(row =>
                    row.RunId == runId
                    && row.LegacyRunStatus == nameof(ArchitectureRunStatus.Failed)),
                It.IsAny<CancellationToken>(),
                null,
                null),
            Times.Once);
        runs.Verify(
            r => r.ArchiveRunsByIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static CoordinationResult BuildSuccessfulCoordination(string requestId, string runId)
    {
        return new CoordinationResult
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
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
        IRunRepository runRepository,
        IEvidenceBundleRepository evidenceBundleRepository,
        IArchLucidUnitOfWorkFactory? unitOfWorkFactory = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(AuthorityTestScope);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("test-actor");

        return new ArchitectureRunCreateOrchestrator(
            coordination,
            Mock.Of<IArchitectureRequestRepository>(),
            runRepository,
            scope.Object,
            evidenceBundleRepository,
            Mock.Of<IAgentTaskRepository>(),
            Mock.Of<IArchitectureRunIdempotencyRepository>(),
            actor.Object,
            Mock.Of<IBaselineMutationAuditService>(),
            Mock.Of<IAuditService>(),
            unitOfWorkFactory ?? ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            Mock.Of<IUsageMeteringService>(),
            new InProcessCreateRunIdempotencyLock(),
            Options.Create(new ArchitectureRunCreateOptions()),
            new DisabledAsyncAuthorityPipelineModeResolver(),
            Mock.Of<IRunStateTransitionService>(),
            TimeProvider.System,
            new DefaultRequestContentSafetyPrecheck(),
            ArchitectureRunCreateOrchestratorTestSupport.CreatePolicyPackCloudBaselineApplicator(),
            WorkspaceSystemNameCollisionGuardTestDoubles.NoOp(),
            Mock.Of<IArchitectureIdentityService>(),
            NullLogger<ArchitectureRunCreateOrchestrator>.Instance);
    }
}
