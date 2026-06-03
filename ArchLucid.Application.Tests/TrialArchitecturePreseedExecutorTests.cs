using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialArchitecturePreseedExecutorTests
{
    private readonly Guid _tenantId = Guid.Parse("11111111-2222-3333-4444-555555555555");
    private readonly Guid _workspaceId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private readonly Guid _projectId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task TryProcessTenantAsync_happy_path_marks_preseed_completed()
    {
        Guid welcomeRunId = Guid.Parse("ccccccccddddeeeeffff000011112222");
        string runId = welcomeRunId.ToString("N");
        (TrialArchitecturePreseedExecutor sut, Mock<ITenantRepository> repo) = CreateSut(runId);

        repo.Setup(r => r.GetFirstWorkspaceAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink { WorkspaceId = _workspaceId, DefaultProjectId = _projectId });

        repo.Setup(r => r.GetByIdAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateTenant());

        await sut.TryProcessTenantAsync(_tenantId, CancellationToken.None);

        repo.Verify(r => r.MarkTrialArchitecturePreseedCompletedAsync(_tenantId, welcomeRunId, It.IsAny<CancellationToken>()), Times.Once);
        repo.Verify(
            r => r.IncrementTrialArchitecturePreseedAttemptAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryProcessTenantAsync_without_workspace_does_not_create_run()
    {
        Mock<IArchitectureRunCreateOrchestrator> create = new();
        (TrialArchitecturePreseedExecutor sut, Mock<ITenantRepository> repo) = CreateSut("unused", create);

        repo.Setup(r => r.GetFirstWorkspaceAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantWorkspaceLink?)null);

        await sut.TryProcessTenantAsync(_tenantId, CancellationToken.None);

        create.Verify(
            c => c.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<ArchLucid.Application.Runs.CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryProcessTenantAsync_commit_failure_increments_attempt()
    {
        (TrialArchitecturePreseedExecutor sut, Mock<ITenantRepository> repo) = CreateSut(
            Guid.NewGuid().ToString("N"),
            commitThrows: true);

        repo.Setup(r => r.GetFirstWorkspaceAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink { WorkspaceId = _workspaceId, DefaultProjectId = _projectId });

        repo.Setup(r => r.GetByIdAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateTenant());

        repo.Setup(r => r.IncrementTrialArchitecturePreseedAttemptAsync(_tenantId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        await sut.TryProcessTenantAsync(_tenantId, CancellationToken.None);

        repo.Verify(r => r.IncrementTrialArchitecturePreseedAttemptAsync(_tenantId, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        repo.Verify(r => r.MarkTrialArchitecturePreseedCompletedAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TryProcessTenantAsync_non_guid_run_id_increments_attempt()
    {
        (TrialArchitecturePreseedExecutor sut, Mock<ITenantRepository> repo) = CreateSut("not-a-guid");

        repo.Setup(r => r.GetFirstWorkspaceAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink { WorkspaceId = _workspaceId, DefaultProjectId = _projectId });

        repo.Setup(r => r.GetByIdAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateTenant());

        repo.Setup(r => r.IncrementTrialArchitecturePreseedAttemptAsync(_tenantId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        await sut.TryProcessTenantAsync(_tenantId, CancellationToken.None);

        repo.Verify(
            r => r.IncrementTrialArchitecturePreseedAttemptAsync(
                _tenantId,
                It.Is<string>(e => e.Contains("non_guid_run_id", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryProcessTenantAsync_fifth_failure_emits_audit_event()
    {
        Mock<IAuditService> audit = new();
        (TrialArchitecturePreseedExecutor sut, Mock<ITenantRepository> repo) = CreateSut(
            Guid.NewGuid().ToString("N"),
            commitThrows: true,
            audit: audit.Object);

        repo.Setup(r => r.GetFirstWorkspaceAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink { WorkspaceId = _workspaceId, DefaultProjectId = _projectId });

        repo.Setup(r => r.GetByIdAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateTenant());

        repo.Setup(r => r.IncrementTrialArchitecturePreseedAttemptAsync(_tenantId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(5);

        await sut.TryProcessTenantAsync(_tenantId, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialArchitecturePreseedFailed),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private (TrialArchitecturePreseedExecutor sut, Mock<ITenantRepository> repo) CreateSut(
        string runId,
        Mock<IArchitectureRunCreateOrchestrator>? createOverride = null,
        bool commitThrows = false,
        IAuditService? audit = null)
    {
        Mock<ITenantRepository> repo = new();
        Mock<IArchitectureRunCreateOrchestrator> create = createOverride ?? new Mock<IArchitectureRunCreateOrchestrator>();
        Mock<IArchitectureRunExecuteOrchestrator> execute = new();
        Mock<IArchitectureRunCommitOrchestrator> commit = new();

        if (createOverride is null)
        {
            create.Setup(c => c.CreateRunAsync(
                    It.IsAny<ArchitectureRequest>(),
                    It.IsAny<ArchLucid.Application.Runs.CreateRunIdempotencyState?>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(
                    new CreateRunResult
                    {
                        Run = new ArchitectureRun { RunId = runId, RequestId = "req" }
                    });

            execute.Setup(e => e.ExecuteRunAsync(runId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ExecuteRunResult { RunId = runId });

            if (commitThrows)
            {
                commit.Setup(c => c.CommitRunAsync(runId, It.IsAny<CancellationToken>()))
                    .ThrowsAsync(new InvalidOperationException("commit failed"));
            }
            else
            {
                commit.Setup(c => c.CommitRunAsync(runId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(
                        new CommitRunResult
                        {
                            Manifest = new GoldenManifest
                            {
                                Metadata = new ManifestMetadata { ManifestVersion = "1" }
                            }
                        });
            }
        }

        TrialArchitecturePreseedExecutor sut = new(
            repo.Object,
            create.Object,
            execute.Object,
            commit.Object,
            audit ?? new Mock<IAuditService>().Object,
            NullLogger<TrialArchitecturePreseedExecutor>.Instance);

        return (sut, repo);
    }

    private TenantRecord CreateTenant() =>
        new()
        {
            Id = _tenantId,
            Name = "Trial",
            Slug = "trial",
            Tier = TenantTier.Free,
            CreatedUtc = DateTimeOffset.UtcNow,
            TrialStatus = TrialLifecycleStatus.Active,
            IndustryVertical = "Healthcare",
        };
}
