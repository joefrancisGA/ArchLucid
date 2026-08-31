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
using ArchLucid.Core.Transactions;
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
    public async Task SubmitApprovalRequestAsync_accepts_padded_manifest_version_when_manifest_is_in_scope()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new(MockBehavior.Strict);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        manifests
            .Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoldenManifest
            {
                RunId = "run-1",
                SystemName = "Sys",
                Services = [],
                Datastores = [],
                Relationships = [],
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow }
            });

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object,
            unifiedManifestReader: manifests.Object);

        GovernanceApprovalRequest result = await sut.SubmitApprovalRequestAsync(
            "run-1",
            "  v1  ",
            "dev",
            "test",
            "alice",
            null,
            null,
            dryRun: true);

        result.ManifestVersion.Should().Be("v1");
        approvalRepo.VerifyNoOtherCalls();
        manifests.VerifyAll();
    }

    [Fact]
    public async Task SubmitApprovalRequestAsync_accepts_padded_environments_when_promotion_is_valid()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new(MockBehavior.Strict);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        manifests
            .Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoldenManifest
            {
                RunId = "run-1",
                SystemName = "Sys",
                Services = [],
                Datastores = [],
                Relationships = [],
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow }
            });

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object,
            unifiedManifestReader: manifests.Object);

        GovernanceApprovalRequest result = await sut.SubmitApprovalRequestAsync(
            "run-1",
            "v1",
            " dev ",
            " test ",
            "alice",
            null,
            null,
            dryRun: true);

        result.SourceEnvironment.Should().Be("dev");
        result.TargetEnvironment.Should().Be("test");
        approvalRepo.VerifyNoOtherCalls();
        manifests.VerifyAll();
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

    [Fact]
    public async Task ActivateAsync_deactivates_existing_active_records_when_environment_is_padded()
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
                It.Is<GovernanceEnvironmentActivation>(activation => activation.Environment == "test"),
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

        GovernanceEnvironmentActivation activation = await sut.ActivateAsync("run-1", "v1", " test ", "operator");

        activation.Environment.Should().Be("test");
        existing.IsActive.Should().BeFalse();
        activationRepo.Verify(
            r => r.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ActivateAsync_trims_padded_manifest_version_when_manifest_is_in_scope()
    {
        Mock<IGovernanceEnvironmentActivationRepository> activationRepo = new();
        activationRepo
            .Setup(r => r.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        activationRepo
            .Setup(r => r.CreateAsync(
                It.Is<GovernanceEnvironmentActivation>(activation => activation.ManifestVersion == "v1"),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection>(),
                It.IsAny<IDbTransaction>()))
            .Returns(Task.CompletedTask);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        manifests
            .Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoldenManifest
            {
                RunId = "run-1",
                SystemName = "Sys",
                Services = [],
                Datastores = [],
                Relationships = [],
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow }
            });

        GovernanceWorkflowFacade sut = CreateFacade(
            activationRepo: activationRepo.Object,
            runDetail: runDetail.Object,
            unifiedManifestReader: manifests.Object);

        GovernanceEnvironmentActivation activation = await sut.ActivateAsync("run-1", "  v1  ", "test", "operator");

        activation.ManifestVersion.Should().Be("v1");
        manifests.VerifyAll();
    }

    [Fact]
    public async Task PromoteAsync_trims_padded_manifest_version_when_manifest_is_in_scope()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        manifests
            .Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoldenManifest
            {
                RunId = "run-1",
                SystemName = "Sys",
                Services = [],
                Datastores = [],
                Relationships = [],
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow }
            });

        GovernanceWorkflowFacade sut = CreateFacade(
            runDetail: runDetail.Object,
            unifiedManifestReader: manifests.Object);

        GovernancePromotionRecord record = await sut.PromoteAsync(
            "run-1",
            "  v1  ",
            "dev",
            "test",
            "operator",
            approvalRequestId: null,
            notes: null,
            dryRun: true);

        record.ManifestVersion.Should().Be("v1");
        manifests.VerifyAll();
    }

    [Fact]
    public async Task PromoteAsync_dry_run_accepts_padded_environments_when_promotion_is_valid()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        GovernanceWorkflowFacade sut = CreateFacade(runDetail: runDetail.Object);

        GovernancePromotionRecord record = await sut.PromoteAsync(
            "run-1",
            "v1",
            " dev ",
            " test ",
            "operator",
            approvalRequestId: null,
            notes: null,
            dryRun: true);

        record.SourceEnvironment.Should().Be("dev");
        record.TargetEnvironment.Should().Be("test");
    }

    [Theory]
    [InlineData(null, "v1", "dev", "test", "alice", "runId")]
    [InlineData("run-1", null, "dev", "test", "alice", "manifestVersion")]
    [InlineData("run-1", "v1", null, "test", "alice", "sourceEnvironment")]
    [InlineData("run-1", "v1", "dev", null, "alice", "targetEnvironment")]
    [InlineData("run-1", "v1", "dev", "test", null, "requestedBy")]
    public async Task SubmitApprovalRequestAsync_throws_when_required_argument_is_null(
        string? runId,
        string? manifestVersion,
        string? sourceEnvironment,
        string? targetEnvironment,
        string? requestedBy,
        string expectedParam)
    {
        GovernanceWorkflowFacade sut = CreateFacade();

        Func<Task> act = () => sut.SubmitApprovalRequestAsync(
            runId!,
            manifestVersion!,
            sourceEnvironment!,
            targetEnvironment!,
            requestedBy!,
            null,
            null,
            dryRun: true);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName(expectedParam);
    }

    [Theory]
    [InlineData("", "v1", "dev", "test", "alice", "runId")]
    [InlineData("   ", "v1", "dev", "test", "alice", "runId")]
    [InlineData("run-1", "", "dev", "test", "alice", "manifestVersion")]
    [InlineData("run-1", "v1", "", "test", "alice", "sourceEnvironment")]
    [InlineData("run-1", "v1", "dev", "", "alice", "targetEnvironment")]
    [InlineData("run-1", "v1", "dev", "test", "", "requestedBy")]
    public async Task SubmitApprovalRequestAsync_throws_when_required_argument_is_whitespace(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string requestedBy,
        string expectedParam)
    {
        GovernanceWorkflowFacade sut = CreateFacade();

        Func<Task> act = () => sut.SubmitApprovalRequestAsync(
            runId,
            manifestVersion,
            sourceEnvironment,
            targetEnvironment,
            requestedBy,
            null,
            null,
            dryRun: true);

        await act.Should().ThrowAsync<ArgumentException>().WithParameterName(expectedParam);
    }

    [Theory]
    [InlineData(null, "v1", "dev", "test", "operator", "runId")]
    [InlineData("run-1", null, "dev", "test", "operator", "manifestVersion")]
    [InlineData("run-1", "v1", null, "test", "operator", "sourceEnvironment")]
    [InlineData("run-1", "v1", "dev", null, "operator", "targetEnvironment")]
    [InlineData("run-1", "v1", "dev", "test", null, "promotedBy")]
    public async Task PromoteAsync_throws_when_required_argument_is_null(
        string? runId,
        string? manifestVersion,
        string? sourceEnvironment,
        string? targetEnvironment,
        string? promotedBy,
        string expectedParam)
    {
        GovernanceWorkflowFacade sut = CreateFacade();

        Func<Task> act = () => sut.PromoteAsync(
            runId!,
            manifestVersion!,
            sourceEnvironment!,
            targetEnvironment!,
            promotedBy!,
            approvalRequestId: null,
            notes: null,
            dryRun: true);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName(expectedParam);
    }

    [Theory]
    [InlineData("", "v1", "dev", "test", "operator", "runId")]
    [InlineData("run-1", "", "dev", "test", "operator", "manifestVersion")]
    [InlineData("run-1", "v1", "", "test", "operator", "sourceEnvironment")]
    [InlineData("run-1", "v1", "dev", "", "operator", "targetEnvironment")]
    [InlineData("run-1", "v1", "dev", "test", "", "promotedBy")]
    public async Task PromoteAsync_throws_when_required_argument_is_whitespace(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string promotedBy,
        string expectedParam)
    {
        GovernanceWorkflowFacade sut = CreateFacade();

        Func<Task> act = () => sut.PromoteAsync(
            runId,
            manifestVersion,
            sourceEnvironment,
            targetEnvironment,
            promotedBy,
            approvalRequestId: null,
            notes: null,
            dryRun: true);

        await act.Should().ThrowAsync<ArgumentException>().WithParameterName(expectedParam);
    }

    [Theory]
    [InlineData(null, "v1", "test", "operator", "runId")]
    [InlineData("run-1", null, "test", "operator", "manifestVersion")]
    [InlineData("run-1", "v1", null, "operator", "environment")]
    [InlineData("run-1", "v1", "test", null, "activatedBy")]
    public async Task ActivateAsync_throws_when_required_argument_is_null(
        string? runId,
        string? manifestVersion,
        string? environment,
        string? activatedBy,
        string expectedParam)
    {
        GovernanceWorkflowFacade sut = CreateFacade();

        Func<Task> act = () => sut.ActivateAsync(runId!, manifestVersion!, environment!, activatedBy!);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName(expectedParam);
    }

    [Theory]
    [InlineData("", "v1", "test", "operator", "runId")]
    [InlineData("run-1", "", "test", "operator", "manifestVersion")]
    [InlineData("run-1", "v1", "", "operator", "environment")]
    [InlineData("run-1", "v1", "test", "", "activatedBy")]
    public async Task ActivateAsync_throws_when_required_argument_is_whitespace(
        string runId,
        string manifestVersion,
        string environment,
        string activatedBy,
        string expectedParam)
    {
        GovernanceWorkflowFacade sut = CreateFacade();

        Func<Task> act = () => sut.ActivateAsync(runId, manifestVersion, environment, activatedBy);

        await act.Should().ThrowAsync<ArgumentException>().WithParameterName(expectedParam);
    }

    [Fact]
    public async Task PromoteAsync_persists_record_when_not_dry_run()
    {
        Mock<IGovernancePromotionRecordRepository> promotionRepo = new();
        promotionRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<GovernancePromotionRecord>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            promotionRepo: promotionRepo.Object,
            runDetail: runDetail.Object);

        GovernancePromotionRecord record = await sut.PromoteAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "operator",
            approvalRequestId: null,
            notes: "ship-it",
            dryRun: false);

        record.RunId.Should().Be("run-1");
        record.Notes.Should().Be("ship-it");
        promotionRepo.Verify(
            r => r.CreateAsync(
                It.Is<GovernancePromotionRecord>(promotion =>
                    promotion.RunId == "run-1"
                    && promotion.ManifestVersion == "v1"
                    && promotion.SourceEnvironment == "dev"
                    && promotion.TargetEnvironment == "test"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task PromoteAsync_throws_when_manifest_version_is_missing()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail { Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" } });

        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        manifests
            .Setup(m => m.GetByVersionAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((GoldenManifest?)null);

        GovernanceWorkflowFacade sut = CreateFacade(
            runDetail: runDetail.Object,
            unifiedManifestReader: manifests.Object);

        Func<Task> act = () => sut.PromoteAsync(
            "run-1",
            "missing",
            "dev",
            "test",
            "operator",
            approvalRequestId: null,
            notes: null,
            dryRun: true);

        await act.Should().ThrowAsync<GoldenManifestVersionNotFoundException>();
        manifests.VerifyAll();
    }

    [Fact]
    public async Task SubmitApprovalRequestAsync_throws_when_environment_ordering_is_invalid()
    {
        GovernanceWorkflowFacade sut = CreateFacade();

        Func<Task> act = () => sut.SubmitApprovalRequestAsync(
            "run-1",
            "v1",
            "test",
            "dev",
            "alice",
            null,
            null,
            dryRun: true);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*environment ordering*");
    }

    [Fact]
    public async Task PromoteAsync_throws_when_environment_ordering_is_invalid()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(runDetail: runDetail.Object);

        Func<Task> act = () => sut.PromoteAsync(
            "run-1",
            "v1",
            "prod",
            "test",
            "operator",
            approvalRequestId: null,
            notes: null,
            dryRun: true);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*environment ordering*");
    }

    [Fact]
    public async Task PromoteAsync_to_prod_with_non_approved_request_throws()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        approvalRepo
            .Setup(r => r.GetByIdAsync("ar-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = "ar-1",
                RunId = "run-1",
                ManifestVersion = "v1",
                TargetEnvironment = GovernanceEnvironment.Prod,
                Status = GovernanceApprovalStatus.Submitted,
            });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object);

        Func<Task> act = () => sut.PromoteAsync(
            "run-1",
            "v1",
            "test",
            GovernanceEnvironment.Prod,
            "operator",
            approvalRequestId: "ar-1",
            notes: null,
            dryRun: true,
            verbosePromotionValidationErrors: true);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*status*Submitted*");
    }

    [Fact]
    public async Task PromoteAsync_to_prod_when_approval_request_is_missing_throws()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        approvalRepo
            .Setup(r => r.GetByIdAsync("ar-missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((GovernanceApprovalRequest?)null);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object);

        Func<Task> act = () => sut.PromoteAsync(
            "run-1",
            "v1",
            "test",
            GovernanceEnvironment.Prod,
            "operator",
            approvalRequestId: "ar-missing",
            notes: null,
            dryRun: true,
            verbosePromotionValidationErrors: true);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    [Fact]
    public async Task PromoteAsync_to_prod_with_approval_manifest_mismatch_throws()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        approvalRepo
            .Setup(r => r.GetByIdAsync("ar-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = "ar-1",
                RunId = "run-1",
                ManifestVersion = "v-other",
                TargetEnvironment = GovernanceEnvironment.Prod,
                Status = GovernanceApprovalStatus.Approved,
            });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object);

        Func<Task> act = () => sut.PromoteAsync(
            "run-1",
            "v1",
            "test",
            GovernanceEnvironment.Prod,
            "operator",
            approvalRequestId: "ar-1",
            notes: null,
            dryRun: true,
            verbosePromotionValidationErrors: true);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*manifest version*");
    }

    [Fact]
    public async Task PromoteAsync_to_prod_with_approval_target_environment_mismatch_throws()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        approvalRepo
            .Setup(r => r.GetByIdAsync("ar-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = "ar-1",
                RunId = "run-1",
                ManifestVersion = "v1",
                TargetEnvironment = "test",
                Status = GovernanceApprovalStatus.Approved,
            });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object);

        Func<Task> act = () => sut.PromoteAsync(
            "run-1",
            "v1",
            "test",
            GovernanceEnvironment.Prod,
            "operator",
            approvalRequestId: "ar-1",
            notes: null,
            dryRun: true,
            verbosePromotionValidationErrors: true);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*target environment*");
    }

    [Fact]
    public async Task PromoteAsync_to_prod_persists_and_marks_approval_promoted_when_not_dry_run()
    {
        GovernanceApprovalRequest approval = new()
        {
            ApprovalRequestId = "ar-1",
            RunId = "run-1",
            ManifestVersion = "v1",
            TargetEnvironment = GovernanceEnvironment.Prod,
            Status = GovernanceApprovalStatus.Approved,
        };

        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        approvalRepo
            .Setup(r => r.GetByIdAsync("ar-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(approval);
        approvalRepo
            .Setup(r => r.UpdateAsync(approval, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IGovernancePromotionRecordRepository> promotionRepo = new();
        promotionRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<GovernancePromotionRecord>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            promotionRepo: promotionRepo.Object,
            runDetail: runDetail.Object);

        GovernancePromotionRecord record = await sut.PromoteAsync(
            "run-1",
            "v1",
            "test",
            GovernanceEnvironment.Prod,
            "operator",
            approvalRequestId: "ar-1",
            notes: null,
            dryRun: false);

        record.TargetEnvironment.Should().Be(GovernanceEnvironment.Prod);
        approval.Status.Should().Be(GovernanceApprovalStatus.Promoted);
        promotionRepo.Verify(
            r => r.CreateAsync(It.IsAny<GovernancePromotionRecord>(), It.IsAny<CancellationToken>()),
            Times.Once);
        approvalRepo.Verify(
            r => r.UpdateAsync(approval, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ActivateAsync_persists_activation_when_not_dry_run()
    {
        Mock<IGovernanceEnvironmentActivationRepository> activationRepo = new();
        activationRepo
            .Setup(r => r.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        activationRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<GovernanceEnvironmentActivation>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            activationRepo: activationRepo.Object,
            runDetail: runDetail.Object);

        GovernanceEnvironmentActivation activation = await sut.ActivateAsync("run-1", "v1", "test", "operator");

        activation.IsActive.Should().BeTrue();
        activationRepo.Verify(
            r => r.CreateAsync(
                It.Is<GovernanceEnvironmentActivation>(item => item.Environment == "test"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SubmitApprovalRequestAsync_reads_manifest_from_unified_reader_when_embedded_version_is_stale()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new(MockBehavior.Strict);
        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        manifests
            .Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoldenManifest
            {
                RunId = "run-1",
                SystemName = "Sys",
                Services = [],
                Datastores = [],
                Relationships = [],
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow },
            });

        ArchitectureRunDetail runDetail = GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1");
        runDetail.Run.CurrentManifestVersion = "v2";

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(runDetail);

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetailQuery.Object,
            unifiedManifestReader: manifests.Object);

        await sut.SubmitApprovalRequestAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "alice",
            null,
            null,
            dryRun: true);

        manifests.Verify(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()), Times.Once);
        approvalRepo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ActivateAsync_reads_manifest_from_unified_reader_when_embedded_version_is_stale()
    {
        Mock<IGovernanceEnvironmentActivationRepository> activationRepo = new();
        activationRepo
            .Setup(r => r.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        activationRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<GovernanceEnvironmentActivation>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        manifests
            .Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoldenManifest
            {
                RunId = "run-1",
                SystemName = "Sys",
                Services = [],
                Datastores = [],
                Relationships = [],
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow },
            });

        ArchitectureRunDetail runDetail = GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1");
        runDetail.Run.CurrentManifestVersion = "v2";

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(runDetail);

        GovernanceWorkflowFacade sut = CreateFacade(
            activationRepo: activationRepo.Object,
            runDetail: runDetailQuery.Object,
            unifiedManifestReader: manifests.Object);

        await sut.ActivateAsync("run-1", "v1", "test", "operator");

        manifests.Verify(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task PromoteAsync_to_prod_with_non_approved_request_throws_opaque_message_when_not_verbose()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        approvalRepo
            .Setup(r => r.GetByIdAsync("ar-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernanceApprovalRequest
            {
                ApprovalRequestId = "ar-1",
                RunId = "run-1",
                ManifestVersion = "v1",
                TargetEnvironment = GovernanceEnvironment.Prod,
                Status = GovernanceApprovalStatus.Submitted,
            });

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object);

        Func<Task> act = () => sut.PromoteAsync(
            "run-1",
            "v1",
            "test",
            GovernanceEnvironment.Prod,
            "operator",
            approvalRequestId: "ar-1",
            notes: null,
            dryRun: true,
            verbosePromotionValidationErrors: false);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*approved approval request*");
    }

    [Fact]
    public async Task SubmitApprovalRequestAsync_stamps_governance_scope_on_request()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new(MockBehavior.Strict);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object);

        GovernanceApprovalRequest request = await sut.SubmitApprovalRequestAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "alice",
            null,
            null,
            dryRun: true);

        request.TenantId.Should().Be(CallerScope.TenantId);
        request.WorkspaceId.Should().Be(CallerScope.WorkspaceId);
        request.ProjectId.Should().Be(CallerScope.ProjectId);
        approvalRepo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PromoteAsync_stamps_governance_scope_on_record()
    {
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(runDetail: runDetail.Object);

        GovernancePromotionRecord record = await sut.PromoteAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "operator",
            approvalRequestId: null,
            notes: null,
            dryRun: true);

        record.TenantId.Should().Be(CallerScope.TenantId);
        record.WorkspaceId.Should().Be(CallerScope.WorkspaceId);
        record.ProjectId.Should().Be(CallerScope.ProjectId);
    }

    [Fact]
    public async Task ActivateAsync_uses_external_transaction_path_when_outbox_enabled()
    {
        Mock<IGovernanceEnvironmentActivationRepository> activationRepo = new();
        activationRepo
            .Setup(r => r.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
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
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOptions = new();
        integrationOptions.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = true });

        GovernanceWorkflowFacade sut = CreateFacade(
            activationRepo: activationRepo.Object,
            runDetail: runDetail.Object,
            unitOfWorkFactory: ArchLucidUnitOfWorkTestDoubles.ExternalTransactionFactory(),
            integrationEventsOptions: integrationOptions.Object);

        await sut.ActivateAsync("run-1", "v1", "test", "operator");

        activationRepo.Verify(
            r => r.CreateAsync(
                It.IsAny<GovernanceEnvironmentActivation>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection>(),
                It.IsAny<IDbTransaction>()),
            Times.Once);
    }

    [Fact]
    public async Task ActivateAsync_reads_supplied_integration_options_monitor_per_call()
    {
        Mock<IGovernanceEnvironmentActivationRepository> activationRepo = new();
        activationRepo
            .Setup(r => r.GetByEnvironmentAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
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
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

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
                It.IsAny<IDbConnection>(),
                It.IsAny<IDbTransaction>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        IntegrationEventsOptions options = new() { TransactionalOutboxEnabled = false };
        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOptions = new();
        integrationOptions.Setup(m => m.CurrentValue).Returns(() => options);

        GovernanceWorkflowFacade sut = CreateFacade(
            activationRepo: activationRepo.Object,
            runDetail: runDetail.Object,
            unitOfWorkFactory: ArchLucidUnitOfWorkTestDoubles.ExternalTransactionFactory(),
            integrationEventsOptions: integrationOptions.Object,
            integrationEventPublisher: publisher.Object,
            integrationEventOutbox: outbox.Object);

        await sut.ActivateAsync("run-1", "v1", "test-a", "operator");

        options = new IntegrationEventsOptions { TransactionalOutboxEnabled = true };

        await sut.ActivateAsync("run-1", "v1", "test-b", "operator");

        publisher.Verify(
            p => p.PublishAsync(
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
        outbox.Verify(
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
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ActivateAsync_uses_fresh_external_transaction_unit_of_work_per_call()
    {
        List<(IDbConnection Connection, IDbTransaction Transaction)> transactions = [];
        Mock<IGovernanceEnvironmentActivationRepository> activationRepo = new();
        activationRepo
            .Setup(r => r.GetByEnvironmentAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        activationRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<GovernanceEnvironmentActivation>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection>(),
                It.IsAny<IDbTransaction>()))
            .Callback<GovernanceEnvironmentActivation, CancellationToken, IDbConnection, IDbTransaction>((_, _, connection, transaction) => transactions.Add((connection, transaction)))
            .Returns(Task.CompletedTask);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOptions = new();
        integrationOptions.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = true });

        GovernanceWorkflowFacade sut = CreateFacade(
            activationRepo: activationRepo.Object,
            runDetail: runDetail.Object,
            unitOfWorkFactory: ArchLucidUnitOfWorkTestDoubles.ExternalTransactionFactory(),
            integrationEventsOptions: integrationOptions.Object);

        await sut.ActivateAsync("run-1", "v1", "test-a", "operator");
        await sut.ActivateAsync("run-1", "v1", "test-b", "operator");

        transactions.Should().HaveCount(2);
        transactions[0].Connection.Should().NotBeSameAs(transactions[1].Connection);
        transactions[0].Transaction.Should().NotBeSameAs(transactions[1].Transaction);
        transactions[0].Transaction.Connection.Should().BeSameAs(transactions[0].Connection);
        transactions[1].Transaction.Connection.Should().BeSameAs(transactions[1].Connection);
    }

    [Fact]
    public async Task PromoteAsync_reads_manifest_from_unified_reader_when_embedded_version_is_stale()
    {
        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        manifests
            .Setup(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoldenManifest
            {
                RunId = "run-1",
                SystemName = "Sys",
                Services = [],
                Datastores = [],
                Relationships = [],
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow },
            });

        ArchitectureRunDetail runDetail = GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1");
        runDetail.Run.CurrentManifestVersion = "v2";

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(runDetail);

        GovernanceWorkflowFacade sut = CreateFacade(
            runDetail: runDetailQuery.Object,
            unifiedManifestReader: manifests.Object);

        await sut.PromoteAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "operator",
            approvalRequestId: null,
            notes: null,
            dryRun: true);

        manifests.Verify(m => m.GetByVersionAsync("v1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task PromoteAsync_uses_embedded_manifest_without_calling_unified_reader()
    {
        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            runDetail: runDetail.Object,
            unifiedManifestReader: manifests.Object);

        await sut.PromoteAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "operator",
            approvalRequestId: null,
            notes: null,
            dryRun: true);

        manifests.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitApprovalRequestAsync_uses_embedded_manifest_without_calling_unified_reader()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new(MockBehavior.Strict);
        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object,
            unifiedManifestReader: manifests.Object);

        await sut.SubmitApprovalRequestAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "alice",
            null,
            null,
            dryRun: true);

        manifests.VerifyNoOtherCalls();
        approvalRepo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ActivateAsync_uses_embedded_manifest_without_calling_unified_reader()
    {
        Mock<IGovernanceEnvironmentActivationRepository> activationRepo = new();
        activationRepo
            .Setup(r => r.GetByEnvironmentAsync("test", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        activationRepo
            .Setup(r => r.CreateAsync(
                It.IsAny<GovernanceEnvironmentActivation>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IUnifiedGoldenManifestReader> manifests = new(MockBehavior.Strict);
        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            activationRepo: activationRepo.Object,
            runDetail: runDetail.Object,
            unifiedManifestReader: manifests.Object);

        await sut.ActivateAsync("run-1", "v1", "test", "operator");

        manifests.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitApprovalRequestAsync_sets_sla_deadline_when_configured()
    {
        Mock<IGovernanceApprovalRequestRepository> approvalRepo = new();
        approvalRepo
            .Setup(r => r.CreateAsync(It.IsAny<GovernanceApprovalRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(s => s.GetRunDetailAsync("run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(GovernanceWorkflowTestComposition.CreateRunDetailWithManifest("run-1", "v1"));

        GovernanceWorkflowFacade sut = CreateFacade(
            approvalRepo.Object,
            runDetail: runDetail.Object,
            governanceGateOptions: Options.Create(new PreCommitGovernanceGateOptions { ApprovalSlaHours = 24 }));

        GovernanceApprovalRequest request = await sut.SubmitApprovalRequestAsync(
            "run-1",
            "v1",
            "dev",
            "test",
            "alice",
            null,
            null,
            dryRun: false);

        request.SlaDeadlineUtc.Should().NotBeNull();
        request.SlaDeadlineUtc.Should().BeAfter(request.RequestedUtc);
    }

    private static GovernanceWorkflowFacade CreateFacade(
        IGovernanceApprovalRequestRepository? approvalRepo = null,
        IGovernancePromotionRecordRepository? promotionRepo = null,
        IGovernanceEnvironmentActivationRepository? activationRepo = null,
        IRunDetailQueryService? runDetail = null,
        IAuditService? durableAudit = null,
        IUnifiedGoldenManifestReader? unifiedManifestReader = null,
        IOptions<PreCommitGovernanceGateOptions>? governanceGateOptions = null,
        IArchLucidUnitOfWorkFactory? unitOfWorkFactory = null,
        IOptionsMonitor<IntegrationEventsOptions>? integrationEventsOptions = null,
        IIntegrationEventPublisher? integrationEventPublisher = null,
        IIntegrationEventOutboxRepository? integrationEventOutbox = null)
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

        IOptionsMonitor<IntegrationEventsOptions> integrationOptions = integrationEventsOptions ?? CreateDefaultIntegrationOptions();

        return GovernanceWorkflowTestComposition.CreateFacade(
            approvalRepo ?? Mock.Of<IGovernanceApprovalRequestRepository>(),
            promotionRepo ?? Mock.Of<IGovernancePromotionRecordRepository>(),
            activationRepo ?? Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            runDetail ?? Mock.Of<IRunDetailQueryService>(),
            Mock.Of<ArchLucid.Application.Common.IBaselineMutationAuditService>(),
            durableAudit ?? audit.Object,
            scopeProvider.Object,
            integrationEventPublisher ?? publisher.Object,
            integrationEventOutbox ?? outbox.Object,
            integrationOptions,
            governanceGateOptions ?? Options.Create(new PreCommitGovernanceGateOptions()),
            unitOfWorkFactory ?? ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory(),
            unifiedManifestReader);

        static IOptionsMonitor<IntegrationEventsOptions> CreateDefaultIntegrationOptions()
        {
            Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOptions = new();
            integrationOptions.Setup(m => m.CurrentValue).Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });

            return integrationOptions.Object;
        }
    }
}
