using System.Data;

using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.TestSupport.Governance;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

using CoreAuditEventTypes = ArchLucid.Core.Audit.AuditEventTypes;

namespace ArchLucid.Api.Tests;

/// <summary>TB-956 / ADR 0083: governance approve/reject and submit/promote/activate co-commit Required audit when SQL UoW is available.</summary>
[Trait("Category", "Unit")]
public sealed class GovernanceWorkflowServiceSameTxAuditTests
{
    [Fact]
    public async Task Approve_WhenSqlUnitOfWorkAvailable_LogsRequiredAuditInsideTransactionBeforeCommit()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        Mock<IAuditService> durableAudit = new();
        Mock<IArchLucidUnitOfWork> uow = new();
        Mock<IDbConnection> connection = new();
        Mock<IDbTransaction> transaction = new();
        int commitCount = 0;

        uow.SetupGet(x => x.SupportsExternalTransaction).Returns(true);
        uow.SetupGet(x => x.Connection).Returns(connection.Object);
        uow.SetupGet(x => x.Transaction).Returns(transaction.Object);
        uow.Setup(x => x.CommitAsync(It.IsAny<CancellationToken>()))
            .Callback(() => commitCount++)
            .Returns(Task.CompletedTask);
        uow.Setup(x => x.RollbackAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        uow.Setup(x => x.DisposeAsync()).Returns(ValueTask.CompletedTask);

        Mock<IArchLucidUnitOfWorkFactory> uowFactory = new();
        uowFactory.Setup(x => x.CreateAsync(It.IsAny<CancellationToken>())).ReturnsAsync(uow.Object);

        GovernanceApprovalRequest existing = new()
        {
            ApprovalRequestId = "apr-same-tx",
            RunId = "run-1",
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "alice",
        };

        approvalRepo.Setup(r => r.GetByIdAsync("apr-same-tx", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        approvalRepo
            .Setup(r => r.TryTransitionFromReviewableAsync(
                "apr-same-tx",
                GovernanceApprovalStatus.Approved,
                "bob",
                "bob",
                null,
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>(),
                connection.Object,
                transaction.Object))
            .ReturnsAsync(true);

        durableAudit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), uow.Object, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        GovernanceWorkflowService sut = BuildSut(approvalRepo, durableAudit, uowFactory);

        GovernanceApprovalRequest result = await sut.ApproveAsync("apr-same-tx", "bob", "bob", null);

        result.Status.Should().Be(GovernanceApprovalStatus.Approved);
        commitCount.Should().Be(1);
        durableAudit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == CoreAuditEventTypes.GovernanceApprovalApproved),
                uow.Object,
                It.IsAny<CancellationToken>()),
            Times.Once);
        durableAudit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Approve_WhenSqlUnitOfWorkAuditFails_RollsBackWithoutCommit()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        Mock<IAuditService> durableAudit = new();
        Mock<IArchLucidUnitOfWork> uow = new();
        Mock<IDbConnection> connection = new();
        Mock<IDbTransaction> transaction = new();
        int commitCount = 0;
        int rollbackCount = 0;

        uow.SetupGet(x => x.SupportsExternalTransaction).Returns(true);
        uow.SetupGet(x => x.Connection).Returns(connection.Object);
        uow.SetupGet(x => x.Transaction).Returns(transaction.Object);
        uow.Setup(x => x.CommitAsync(It.IsAny<CancellationToken>()))
            .Callback(() => commitCount++)
            .Returns(Task.CompletedTask);
        uow.Setup(x => x.RollbackAsync(It.IsAny<CancellationToken>()))
            .Callback(() => rollbackCount++)
            .Returns(Task.CompletedTask);
        uow.Setup(x => x.DisposeAsync()).Returns(ValueTask.CompletedTask);

        Mock<IArchLucidUnitOfWorkFactory> uowFactory = new();
        uowFactory.Setup(x => x.CreateAsync(It.IsAny<CancellationToken>())).ReturnsAsync(uow.Object);

        GovernanceApprovalRequest existing = new()
        {
            ApprovalRequestId = "apr-same-tx-fail",
            RunId = "run-1",
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "alice",
        };

        approvalRepo.Setup(r => r.GetByIdAsync("apr-same-tx-fail", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        approvalRepo
            .Setup(r => r.TryTransitionFromReviewableAsync(
                "apr-same-tx-fail",
                GovernanceApprovalStatus.Approved,
                "bob",
                "bob",
                null,
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>(),
                connection.Object,
                transaction.Object))
            .ReturnsAsync(true);

        durableAudit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), uow.Object, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit store unavailable"));

        GovernanceWorkflowService sut = BuildSut(approvalRepo, durableAudit, uowFactory);

        Func<Task<GovernanceApprovalRequest>> act = () => sut.ApproveAsync("apr-same-tx-fail", "bob", "bob", null);

        (await act.Should().ThrowAsync<DurableAuditWriteFailedException>())
            .Which.OperationLabel.Should().Contain("GovernanceApprovalApproved");
        commitCount.Should().Be(0);
        rollbackCount.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Submit_WhenSqlUnitOfWorkAvailable_LogsRequiredAuditInsideTransactionBeforeCommit()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        Mock<IAuditService> durableAudit = new();
        (Mock<IArchLucidUnitOfWork> uow, Mock<IDbConnection> connection, Mock<IDbTransaction> transaction, CommitCounter commitCounter) =
            CreateSqlUnitOfWorkMocks();
        Mock<IArchLucidUnitOfWorkFactory> uowFactory = CreateUnitOfWorkFactory(uow);

        approvalRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<GovernanceApprovalRequest>(),
                It.IsAny<CancellationToken>(),
                connection.Object,
                transaction.Object))
            .Returns(Task.CompletedTask);

        durableAudit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), uow.Object, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunDetailQueryService> runDetailQueryService = new();
        runDetailQueryService
            .Setup(r => r.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowService sut = BuildSut(approvalRepo, durableAudit, uowFactory, runDetailQueryService: runDetailQueryService);

        GovernanceApprovalRequest result = await sut.SubmitApprovalRequestAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "alice",
            null,
            null);

        result.Status.Should().Be(GovernanceApprovalStatus.Submitted);
        commitCounter.Value.Should().Be(1);
        durableAudit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == CoreAuditEventTypes.GovernanceApprovalSubmitted),
                uow.Object,
                It.IsAny<CancellationToken>()),
            Times.Once);
        durableAudit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Promote_WhenSqlUnitOfWorkAvailable_LogsRequiredAuditInsideTransactionBeforeCommit()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        Mock<IGovernancePromotionRecordRepository> promotionRepo = new();
        Mock<IAuditService> durableAudit = new();
        (Mock<IArchLucidUnitOfWork> uow, Mock<IDbConnection> connection, Mock<IDbTransaction> transaction, CommitCounter commitCounter) =
            CreateSqlUnitOfWorkMocks();
        Mock<IArchLucidUnitOfWorkFactory> uowFactory = CreateUnitOfWorkFactory(uow);

        promotionRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<GovernancePromotionRecord>(),
                It.IsAny<CancellationToken>(),
                connection.Object,
                transaction.Object))
            .Returns(Task.CompletedTask);

        durableAudit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), uow.Object, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunDetailQueryService> runDetailQueryService = new();
        runDetailQueryService
            .Setup(r => r.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowService sut = BuildSut(
            approvalRepo,
            durableAudit,
            uowFactory,
            promotionRepo: promotionRepo,
            runDetailQueryService: runDetailQueryService);

        GovernancePromotionRecord result = await sut.PromoteAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "alice",
            null,
            null);

        result.TargetEnvironment.Should().Be("test");
        commitCounter.Value.Should().Be(1);
        durableAudit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == CoreAuditEventTypes.GovernanceManifestPromoted),
                uow.Object,
                It.IsAny<CancellationToken>()),
            Times.Once);
        durableAudit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Promote_WhenSqlUnitOfWorkAuditFails_RollsBackWithoutCommit()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        Mock<IGovernancePromotionRecordRepository> promotionRepo = new();
        Mock<IAuditService> durableAudit = new();
        (Mock<IArchLucidUnitOfWork> uow, Mock<IDbConnection> connection, Mock<IDbTransaction> transaction, CommitCounter commitCounter) =
            CreateSqlUnitOfWorkMocks();
        int rollbackCount = 0;
        uow.Setup(x => x.RollbackAsync(It.IsAny<CancellationToken>()))
            .Callback(() => rollbackCount++)
            .Returns(Task.CompletedTask);
        Mock<IArchLucidUnitOfWorkFactory> uowFactory = CreateUnitOfWorkFactory(uow);

        promotionRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<GovernancePromotionRecord>(),
                It.IsAny<CancellationToken>(),
                connection.Object,
                transaction.Object))
            .Returns(Task.CompletedTask);

        durableAudit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), uow.Object, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit store unavailable"));

        Mock<IRunDetailQueryService> runDetailQueryService = new();
        runDetailQueryService
            .Setup(r => r.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowService sut = BuildSut(
            approvalRepo,
            durableAudit,
            uowFactory,
            promotionRepo: promotionRepo,
            runDetailQueryService: runDetailQueryService);

        Func<Task<GovernancePromotionRecord>> act = () => sut.PromoteAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "alice",
            null,
            null);

        (await act.Should().ThrowAsync<DurableAuditWriteFailedException>())
            .Which.OperationLabel.Should().Contain("GovernanceManifestPromoted");
        commitCounter.Value.Should().Be(0);
        rollbackCount.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Activate_WhenSqlUnitOfWorkAvailable_LogsRequiredAuditInsideTransactionBeforeCommit()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        Mock<IGovernanceEnvironmentActivationRepository> activationRepo = new();
        Mock<IAuditService> durableAudit = new();
        (Mock<IArchLucidUnitOfWork> uow, Mock<IDbConnection> connection, Mock<IDbTransaction> transaction, CommitCounter commitCounter) =
            CreateSqlUnitOfWorkMocks();
        Mock<IArchLucidUnitOfWorkFactory> uowFactory = CreateUnitOfWorkFactory(uow);

        activationRepo
            .Setup(r => r.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<GovernanceEnvironmentActivation>());
        activationRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<GovernanceEnvironmentActivation>(),
                It.IsAny<CancellationToken>(),
                connection.Object,
                transaction.Object))
            .Returns(Task.CompletedTask);

        durableAudit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), uow.Object, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunDetailQueryService> runDetailQueryService = new();
        runDetailQueryService
            .Setup(r => r.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowService sut = BuildSut(
            approvalRepo,
            durableAudit,
            uowFactory,
            activationRepo: activationRepo,
            runDetailQueryService: runDetailQueryService);

        GovernanceEnvironmentActivation result = await sut.ActivateAsync("run-1", "v1", "test", "alice");

        result.Environment.Should().Be("test");
        commitCounter.Value.Should().Be(1);
        durableAudit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == CoreAuditEventTypes.GovernanceEnvironmentActivated),
                uow.Object,
                It.IsAny<CancellationToken>()),
            Times.Once);
        durableAudit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private sealed class CommitCounter
    {
        public int Value { get; set; }
    }

    private static (Mock<IArchLucidUnitOfWork> Uow, Mock<IDbConnection> Connection, Mock<IDbTransaction> Transaction, CommitCounter CommitCounter)
        CreateSqlUnitOfWorkMocks()
    {
        Mock<IArchLucidUnitOfWork> uow = new();
        Mock<IDbConnection> connection = new();
        Mock<IDbTransaction> transaction = new();
        CommitCounter commitCounter = new();

        uow.SetupGet(x => x.SupportsExternalTransaction).Returns(true);
        uow.SetupGet(x => x.Connection).Returns(connection.Object);
        uow.SetupGet(x => x.Transaction).Returns(transaction.Object);
        uow.Setup(x => x.CommitAsync(It.IsAny<CancellationToken>()))
            .Callback(() => commitCounter.Value++)
            .Returns(Task.CompletedTask);
        uow.Setup(x => x.RollbackAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        uow.Setup(x => x.DisposeAsync()).Returns(ValueTask.CompletedTask);

        return (uow, connection, transaction, commitCounter);
    }

    private static Mock<IArchLucidUnitOfWorkFactory> CreateUnitOfWorkFactory(Mock<IArchLucidUnitOfWork> uow)
    {
        Mock<IArchLucidUnitOfWorkFactory> uowFactory = new();
        uowFactory.Setup(x => x.CreateAsync(It.IsAny<CancellationToken>())).ReturnsAsync(uow.Object);

        return uowFactory;
    }

    private static GovernanceWorkflowService BuildSut(
        Mock<IGovernanceApprovalRequestRepository> approvalRepo,
        Mock<IAuditService> durableAudit,
        Mock<IArchLucidUnitOfWorkFactory> uowFactory,
        Mock<IGovernancePromotionRecordRepository>? promotionRepo = null,
        Mock<IGovernanceEnvironmentActivationRepository>? activationRepo = null,
        Mock<IRunDetailQueryService>? runDetailQueryService = null)
    {
        Mock<IGovernancePromotionRecordRepository> promotionRepoMock = promotionRepo ?? new Mock<IGovernancePromotionRecordRepository>();
        Mock<IGovernanceEnvironmentActivationRepository> activationRepoMock = activationRepo ?? new Mock<IGovernanceEnvironmentActivationRepository>();
        Mock<IRunDetailQueryService> runDetailQueryServiceMock = runDetailQueryService ?? new Mock<IRunDetailQueryService>();
        Mock<IBaselineMutationAuditService> baselineAudit = new();
        Mock<IScopeContextProvider> scopeContext = new();
        Mock<IIntegrationEventPublisher> integrationEvents = new();
        Mock<IIntegrationEventOutboxRepository> integrationOutbox = new();
        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationEventOptions = new();

        scopeContext
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            });

        integrationEventOptions.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });

        return GovernanceWorkflowTestComposition.CreateService(
            approvalRepo.Object,
            promotionRepoMock.Object,
            activationRepoMock.Object,
            runDetailQueryServiceMock.Object,
            baselineAudit.Object,
            durableAudit.Object,
            scopeContext.Object,
            integrationEvents.Object,
            integrationOutbox.Object,
            integrationEventOptions.Object,
            Options.Create(new ArchLucid.Contracts.Governance.PreCommitGovernanceGateOptions()),
            uowFactory.Object);
    }
}
