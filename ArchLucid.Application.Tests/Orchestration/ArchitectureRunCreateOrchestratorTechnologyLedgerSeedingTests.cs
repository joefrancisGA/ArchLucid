using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
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
///     Technology Ledger seeding after successful <see cref="ArchitectureRunCreateOrchestrator.CreateRunAsync" />.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunCreateOrchestratorTechnologyLedgerSeedingTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [SkippableFact]
    public async Task CreateRunAsync_does_not_seed_ledger_when_coordination_is_mocked()
    {
        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        string runId = Guid.NewGuid().ToString("N");

        Mock<IArchitectureRunAuthorityCoordination> coordination = new();
        Mock<IArchitectureRequestRepository> requestRepo = new();
        Mock<IRunRepository> runRepo = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);
        Mock<IEvidenceBundleRepository> evidenceRepo = new();
        Mock<IAgentTaskRepository> taskRepo = new();
        Mock<IArchitectureRunIdempotencyRepository> idempotencyRepo = new();
        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("ledger-seed-actor");
        Mock<IBaselineMutationAuditService> baselineAudit = new();
        baselineAudit
            .Setup(b => b.RecordAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IUsageMeteringService> metering = new();
        metering
            .Setup(m => m.RecordAsync(It.IsAny<UsageEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        requestRepo
            .Setup(r => r.CreateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        evidenceRepo
            .Setup(r => r.CreateAsync(It.IsAny<EvidenceBundle>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        taskRepo
            .Setup(r => r.CreateManyAsync(It.IsAny<IEnumerable<AgentTask>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ArchitectureRun run = new()
        {
            RunId = runId,
            RequestId = "req-ledger-seed",
            Status = ArchitectureRunStatus.Created,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };
        EvidenceBundle bundle = new() { EvidenceBundleId = "eb-ledger" };
        List<AgentTask> tasks =
        [
            new()
            {
                TaskId = "t-ledger",
                RunId = runId,
                EvidenceBundleRef = "eb-ledger",
                AgentType = AgentType.Topology,
                Objective = "obj",
                Status = AgentTaskStatus.Created,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
        ];

        coordination
            .Setup(c => c.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<ArchLucid.Core.Transactions.IArchLucidUnitOfWork?>()))
            .ReturnsAsync(new CoordinationResult { Run = run, EvidenceBundle = bundle, Tasks = tasks });

        ArchitectureRequest request = new()
        {
            RequestId = "req-ledger-seed",
            Description = new string('y', 12),
            SystemName = "SysLedger",
            Environment = "prod",
            CloudProvider = CloudProvider.Aws,
            RequestSource = "draft-intake",
        };

        ArchitectureRunCreateOrchestrator sut = CreateSut(
            coordination.Object,
            requestRepo.Object,
            runRepo.Object,
            scopeProvider.Object,
            evidenceRepo.Object,
            taskRepo.Object,
            idempotencyRepo.Object,
            actorContext.Object,
            baselineAudit.Object,
            auditService.Object,
            metering.Object,
            ledgerRepository);

        CreateRunResult result = await sut.CreateRunAsync(request, null, CancellationToken.None);

        result.Run.RunId.Should().Be(runId);
        result.IdempotentReplay.Should().BeFalse();

        IReadOnlyList<TechnologyLedgerEntry> entries = await ledgerRepository.GetByRunIdAsync(
            TestScope,
            runId,
            CancellationToken.None);

        entries.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task CreateRunAsync_when_idempotent_replay_does_not_seed_ledger_entries()
    {
        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        byte[] keyHash = new byte[32];
        Array.Fill(keyHash, (byte)9);
        byte[] fingerprint = new byte[32];
        Array.Fill(fingerprint, (byte)10);
        CreateRunIdempotencyState idempotency = new(tenantId, workspaceId, projectId, keyHash, fingerprint);

        string runId = Guid.NewGuid().ToString("N");
        Mock<IArchitectureRunIdempotencyRepository> idempotencyRepository = new();
        idempotencyRepository
            .Setup(x => x.TryGetAsync(tenantId, workspaceId, projectId, keyHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunIdempotencyLookup { RunId = runId, RequestFingerprint = fingerprint });

        ArchitectureRun run = new() { RunId = runId, RequestId = "prior-req" };
        EvidenceBundle bundle = new() { EvidenceBundleId = "eb-replay" };
        List<AgentTask> tasks =
        [
            new()
            {
                TaskId = "t1",
                RunId = runId,
                EvidenceBundleRef = "eb-replay",
                AgentType = AgentType.Topology,
                Objective = "o",
                Status = AgentTaskStatus.Created,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
        ];

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<IRunRepository> runRepo = new();
        Guid runGuid = Guid.ParseExact(runId, "N");
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "ledger-replay-proj",
                ArchitectureRequestId = "prior-req",
                LegacyRunStatus = ArchitectureRunStatus.Created.ToString(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            });

        Mock<IAgentTaskRepository> taskRepository = new();
        taskRepository
            .Setup(x => x.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);

        Mock<IEvidenceBundleRepository> evidenceBundleRepository = new();
        evidenceBundleRepository
            .Setup(x => x.GetByIdAsync("eb-replay", It.IsAny<CancellationToken>()))
            .ReturnsAsync(bundle);

        Mock<IArchitectureRunAuthorityCoordination> coordination = new();

        ArchitectureRunCreateOrchestrator sut = CreateSut(
            coordination.Object,
            Mock.Of<IArchitectureRequestRepository>(),
            runRepo.Object,
            scopeProvider.Object,
            evidenceBundleRepository.Object,
            taskRepository.Object,
            idempotencyRepository.Object,
            Mock.Of<IActorContext>(),
            Mock.Of<IBaselineMutationAuditService>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IUsageMeteringService>(),
            ledgerRepository);

        ArchitectureRequest request = new()
        {
            RequestId = "req-replay",
            Description = new string('z', 12),
            SystemName = "SysReplay",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };

        CreateRunResult result = await sut.CreateRunAsync(request, idempotency, CancellationToken.None);

        result.IdempotentReplay.Should().BeTrue();
        coordination.Verify(
            c => c.CreateRunAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>(), It.IsAny<ArchLucid.Core.Transactions.IArchLucidUnitOfWork?>()),
            Times.Never);

        IReadOnlyList<TechnologyLedgerEntry> entries = await ledgerRepository.GetByRunIdAsync(
            TestScope,
            runId,
            CancellationToken.None);

        entries.Should().BeEmpty();
    }

    private static ArchitectureRunCreateOrchestrator CreateSut(
        IArchitectureRunAuthorityCoordination coordination,
        IArchitectureRequestRepository requestRepository,
        IRunRepository runRepository,
        IScopeContextProvider scopeContextProvider,
        IEvidenceBundleRepository evidenceBundleRepository,
        IAgentTaskRepository taskRepository,
        IArchitectureRunIdempotencyRepository idempotencyRepository,
        IActorContext actorContext,
        IBaselineMutationAuditService baselineAudit,
        IAuditService auditService,
        IUsageMeteringService metering,
        InMemoryTechnologyLedgerRepository ledgerRepository)
    {
        return new ArchitectureRunCreateOrchestrator(
            coordination,
            requestRepository,
            runRepository,
            scopeContextProvider,
            evidenceBundleRepository,
            taskRepository,
            idempotencyRepository,
            actorContext,
            baselineAudit,
            auditService,
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            metering,
            new InProcessCreateRunIdempotencyLock(),
            Options.Create(new ArchitectureRunCreateOptions()),
            new DisabledAsyncAuthorityPipelineModeResolver(),
            Mock.Of<IRunStateTransitionService>(),
            TimeProvider.System,
            new DefaultRequestContentSafetyPrecheck(),
            ArchitectureRunCreateOrchestratorTestSupport.CreatePolicyPackCloudBaselineApplicator(),
            NullLogger<ArchitectureRunCreateOrchestrator>.Instance);
    }
}
