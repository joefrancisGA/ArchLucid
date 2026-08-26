using System.Data;

using ArchLucid.Application;
using ArchLucid.Application.Governance.Workflow;
using ArchLucid.Application.Governance.Workflow.Stages;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.TestSupport;
using ArchLucid.TestSupport.Governance;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceWorkflowFacadeTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task SubmitApprovalRequestAsync_dry_run_does_not_persist()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new(MockBehavior.Strict);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        GovernanceWorkflowFacade sut = CreateFacade(approvalRepo.Object, runDetail: runDetail.Object);

        GovernanceApprovalRequest result = await sut.SubmitApprovalRequestAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "alice",
            null,
            null,
            dryRun: true);

        result.Status.Should().Be(GovernanceApprovalStatus.Submitted);
        result.RunId.Should().Be("run-1");
        approvalRepo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ApproveAsync_throws_self_approval_when_reviewer_matches_requester()
    {
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "ar-1",
            Status = GovernanceApprovalStatus.Submitted,
            RunId = "run-1",
            RequestedBy = "alice@contoso.com",
            RequestedByActorKey = "jwt:tenant:alice-oid",
        };

        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        approvalRepo
            .Setup(r => r.GetByIdAsync("ar-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IAuditService> durableAudit = new();
        durableAudit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        GovernanceWorkflowFacade sut = CreateFacade(approvalRepo.Object, durableAudit: durableAudit.Object);

        Func<Task> act = () => sut.ApproveAsync("ar-1", "alice@contoso.com", "jwt:tenant:alice-oid", null);

        await act.Should().ThrowAsync<GovernanceSelfApprovalException>();
        approvalRepo.Verify(
            r => r.TryTransitionFromReviewableAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PromoteAsync_throws_when_non_prod_approval_request_run_mismatch()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        approvalRepo
            .Setup(r => r.GetByIdAsync("ar-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = "ar-1",
                RunId = "run-other",
                ManifestVersion = "v1",
                TargetEnvironment = "test",
                Status = GovernanceApprovalStatus.Submitted,
            });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object);

        Func<Task> act = () => sut.PromoteAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "operator",
            approvalRequestId: "ar-1",
            notes: null);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*does not match*");
    }

    [Fact]
    public async Task PromoteAsync_throws_when_manifest_version_belongs_to_another_run()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        Mock<IUnifiedGoldenManifestReader> manifests = new();
        manifests
            .Setup(m => m.GetByVersionAsync("v-foreign", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoldenManifest
            {
                RunId = "run-other",
                SystemName = "Sys",
                Services = [],
                Datastores = [],
                Relationships = [],
                Metadata = new ManifestMetadata { ManifestVersion = "v-foreign", CreatedUtc = DateTime.UtcNow }
            });

        GovernanceWorkflowFacade sut = CreateFacade(
            runDetail: runDetail.Object,
            unifiedManifestReader: manifests.Object);

        Func<Task> act = () => sut.PromoteAsync(
            "run-1",
            "v-foreign",
            "dev",
            "test",
            "operator",
            approvalRequestId: null,
            notes: null);

        await act.Should().ThrowAsync<GoldenManifestVersionNotFoundException>();
    }

    [Fact]
    public async Task PromoteAsync_to_prod_without_approval_request_id_throws()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        GovernanceWorkflowFacade sut = CreateFacade(runDetail: runDetail.Object);

        Func<Task> act = () => sut.PromoteAsync(
            "run-1",
            "v1",
            "test",
            GovernanceEnvironment.Prod,
            "bob",
            approvalRequestId: null,
            notes: null);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*approvalRequestId*");
    }

    [Fact]
    public async Task SubmitApprovalRequestAsync_throws_when_manifest_version_belongs_to_another_run()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new(MockBehavior.Strict);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        Mock<IUnifiedGoldenManifestReader> manifests = new();
        manifests
            .Setup(m => m.GetByVersionAsync("v-foreign", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoldenManifest
            {
                RunId = "run-other",
                SystemName = "Sys",
                Services = [],
                Datastores = [],
                Relationships = [],
                Metadata = new ManifestMetadata { ManifestVersion = "v-foreign", CreatedUtc = DateTime.UtcNow }
            });

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object,
            unifiedManifestReader: manifests.Object);

        Func<Task> act = () => sut.SubmitApprovalRequestAsync(
            "run-1",
            "v-foreign",
            "dev",
            "test",
            "alice",
            null,
            null,
            dryRun: false);

        await act.Should().ThrowAsync<GoldenManifestVersionNotFoundException>();
        approvalRepo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ActivateAsync_throws_when_manifest_version_belongs_to_another_run()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        Mock<IUnifiedGoldenManifestReader> manifests = new();
        manifests
            .Setup(m => m.GetByVersionAsync("v-foreign", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoldenManifest
            {
                RunId = "run-other",
                SystemName = "Sys",
                Services = [],
                Datastores = [],
                Relationships = [],
                Metadata = new ManifestMetadata { ManifestVersion = "v-foreign", CreatedUtc = DateTime.UtcNow }
            });

        GovernanceWorkflowFacade sut = CreateFacade(
            runDetail: runDetail.Object,
            unifiedManifestReader: manifests.Object);

        Func<Task> act = () => sut.ActivateAsync("run-1", "v-foreign", "test", "operator");

        await act.Should().ThrowAsync<GoldenManifestVersionNotFoundException>();
    }

    [Fact]
    public async Task ActivateAsync_deactivates_existing_active_records()
    {
        GovernanceEnvironmentActivation existing = new()
        {
            ActivationId = "act-existing",
            RunId = "run-old",
            ManifestVersion = "v0",
            Environment = "test",
            IsActive = true,
        };

        Mock<IGovernanceEnvironmentActivationRepository> activationRepo = new();
        activationRepo
            .Setup(r => r.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()))
            .ReturnsAsync([existing]);
        activationRepo
            .Setup(r => r.UpdateAsync(
                It.IsAny<GovernanceEnvironmentActivation>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection>(),
                It.IsAny<IDbTransaction>()))
            .Returns(Task.CompletedTask)
            .Callback<GovernanceEnvironmentActivation, CancellationToken, IDbConnection?, IDbTransaction?>(
                (activation, _, _, _) =>
                {
                    if (activation.ActivationId == existing.ActivationId)
                        activation.IsActive = false;
                });
        activationRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<GovernanceEnvironmentActivation>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection>(),
                It.IsAny<IDbTransaction>()))
            .Returns(Task.CompletedTask);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        GovernanceWorkflowFacade sut = CreateFacade(
            activationRepo: activationRepo.Object,
            runDetail: runDetail.Object);

        GovernanceEnvironmentActivation activation = await sut.ActivateAsync("run-1", "v1", "test", "operator");

        activation.IsActive.Should().BeTrue();
        existing.IsActive.Should().BeFalse();
        activationRepo.Verify(
            r => r.CreateAsync(
                It.IsAny<GovernanceEnvironmentActivation>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection>(),
                It.IsAny<IDbTransaction>()),
            Times.Once);
    }

    private static GovernanceWorkflowFacade CreateFacade(
        IGovernanceApprovalRequestRepository? approvalRepo = null,
        IGovernancePromotionRecordRepository? promotionRepo = null,
        IGovernanceEnvironmentActivationRepository? activationRepo = null,
        IRunDetailQueryService? runDetail = null,
        IAuditService? durableAudit = null,
        IUnifiedGoldenManifestReader? unifiedManifestReader = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p => p.PublishAsync(
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.EnqueueAsync(
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        outbox
            .Setup(o => o.EnqueueAsync(
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

        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOptions = new();
        integrationOptions.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });

        return GovernanceWorkflowTestComposition.CreateFacade(
            approvalRepo ?? Mock.Of<IGovernanceApprovalRequestRepository>(),
            promotionRepo ?? Mock.Of<IGovernancePromotionRecordRepository>(),
            activationRepo ?? Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            runDetail ?? Mock.Of<IRunDetailQueryService>(),
            Mock.Of<ArchLucid.Application.Common.IBaselineMutationAuditService>(),
            durableAudit ?? audit.Object,
            scopeProvider.Object,
            publisher.Object,
            outbox.Object,
            integrationOptions.Object,
            Options.Create(new PreCommitGovernanceGateOptions()),
            ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            unifiedManifestReader);
    }
}
