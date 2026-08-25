using System.Data;

using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.TestSupport;
using ArchLucid.TestSupport.Governance;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Decisioning.Tests.Governance;

internal static class GovernanceWorkflowTestFactory
{
    internal static GovernanceWorkflowService CreateForApprove(string status)
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "ar1",
            Status = status,
            RunId = "run1",
        };

        approvalRepo.Setup(r => r.GetByIdAsync("ar1", It.IsAny<CancellationToken>())).ReturnsAsync(request);
        approvalRepo
            .Setup(
                r => r.TryTransitionFromReviewableAsync(
                    "ar1",
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string?>(),
                    It.IsAny<string?>(),
                    It.IsAny<DateTime>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        return CreateWithApprovalRepo(approvalRepo);
    }

    internal static GovernanceWorkflowService CreateWithApprovalRepo(Mock<IGovernanceApprovalRequestRepository> approvalRepo)
    {
        Mock<IGovernancePromotionRecordRepository> promotionRepo = new();
        Mock<IGovernanceEnvironmentActivationRepository> activationRepo = new();
        Mock<IRunDetailQueryService> runDetail = new();

        runDetail
            .Setup(s => s.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArchitectureRunDetail
                {
                    Run = new ArchitectureRun { RunId = "run1", RequestId = "req1" },
                });

        Mock<IBaselineMutationAuditService> audit = new();
        audit
            .Setup(
                a => a.RecordAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string?>(),
                    It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> durableAudit = new();
        durableAudit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(p => p.GetCurrentScope())
            .Returns(
                new ScopeContext
                {
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                });

        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(), It.IsAny<IReadOnlyDictionary<string, object>?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ILogger<GovernanceWorkflowService>> logger = new();

        Mock<IIntegrationEventOutboxRepository> outbox = CreateIntegrationOutboxStub();
        Mock<IOptionsMonitor<IntegrationEventsOptions>> opts = CreateIntegrationEventsOptionsMonitor();

        return GovernanceWorkflowTestComposition.CreateService(
            approvalRepo.Object,
            promotionRepo.Object,
            activationRepo.Object,
            runDetail.Object,
            audit.Object,
            durableAudit.Object,
            scopeProvider.Object,
            publisher.Object,
            outbox.Object,
            opts.Object,
            Options.Create(new PreCommitGovernanceGateOptions()),
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory());
    }

    internal static GovernanceWorkflowService CreateWithActivationRepo(
        Mock<IGovernanceEnvironmentActivationRepository> activationRepo,
        Mock<IRunDetailQueryService> runDetail)
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        Mock<IGovernancePromotionRecordRepository> promotionRepo = new();

        Mock<IBaselineMutationAuditService> audit = new();
        audit
            .Setup(
                a => a.RecordAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string?>(),
                    It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> durableAudit = new();
        durableAudit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(p => p.GetCurrentScope())
            .Returns(
                new ScopeContext
                {
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                });

        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<string?>(), It.IsAny<IReadOnlyDictionary<string, object>?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ILogger<GovernanceWorkflowService>> logger = new();

        Mock<IIntegrationEventOutboxRepository> outbox = CreateIntegrationOutboxStub();
        Mock<IOptionsMonitor<IntegrationEventsOptions>> opts = CreateIntegrationEventsOptionsMonitor();

        return GovernanceWorkflowTestComposition.CreateService(
            approvalRepo.Object,
            promotionRepo.Object,
            activationRepo.Object,
            runDetail.Object,
            audit.Object,
            durableAudit.Object,
            scopeProvider.Object,
            publisher.Object,
            outbox.Object,
            opts.Object,
            Options.Create(new PreCommitGovernanceGateOptions()),
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory());
    }

    private static Mock<IIntegrationEventOutboxRepository> CreateIntegrationOutboxStub()
    {
        Mock<IIntegrationEventOutboxRepository> mock = new();
        mock.Setup(
                o => o.EnqueueAsync(
                    It.IsAny<Guid?>(),
                    It.IsAny<string>(),
                    It.IsAny<string?>(),
                    It.IsAny<ReadOnlyMemory<byte>>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        mock.Setup(
                o => o.EnqueueAsync(
                    It.IsAny<Guid?>(),
                    It.IsAny<string>(),
                    It.IsAny<string?>(),
                    It.IsAny<ReadOnlyMemory<byte>>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<IDbConnection>(),
                    It.IsAny<IDbTransaction>(),
                    It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return mock;
    }

    private static Mock<IOptionsMonitor<IntegrationEventsOptions>> CreateIntegrationEventsOptionsMonitor()
    {
        Mock<IOptionsMonitor<IntegrationEventsOptions>> mock = new();
        mock.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });

        return mock;
    }
}
