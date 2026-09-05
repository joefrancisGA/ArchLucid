using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityServiceTests
{
  private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task TryEnsureReviewRunLinkedAsync_links_review_to_source_architecture_id()
    {
        Guid sourceRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid reviewRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid architectureId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(Scope, reviewRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = reviewRunId });
        runRepository
            .Setup(r => r.GetByIdAsync(Scope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = sourceRunId,
                ArchitectureId = architectureId,
                PackageOrigin = ArchitecturePackageOrigin.Created,
            });
        runRepository
            .Setup(r => r.UpdateAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureIdentityRepository> identityRepository = new();
        identityRepository
            .Setup(r => r.GetByIdAsync(Scope, architectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord { ArchitectureId = architectureId });

        ArchitectureIdentityService sut = new(
            identityRepository.Object,
            runRepository.Object,
            Mock.Of<IDraftRequestRepository>());

        ArchitectureRequest request = new()
        {
            RequestId = "draft-request",
            Description = "Second review of the platform.",
            SystemName = "Platform",
            WorkflowIntent = ArchitectureWorkflowIntent.StartReview,
            PriorRunId = sourceRunId.ToString("D"),
        };

        ArchitectureIdentityRecord? linked = await sut.TryEnsureReviewRunLinkedAsync(Scope, reviewRunId, request);

        linked.Should().NotBeNull();
        linked!.ArchitectureId.Should().Be(architectureId);
        runRepository.Verify(
            r => r.UpdateAsync(
                It.Is<RunRecord>(run => run.RunId == reviewRunId && run.ArchitectureId == architectureId),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()),
            Times.Once);
    }

    [Fact]
    public async Task TryEnsureReviewRunLinkedAsync_attaches_legacy_created_source_then_links_review()
    {
        Guid sourceRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid reviewRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid architectureId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(Scope, reviewRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = reviewRunId });
        runRepository
            .Setup(r => r.GetByIdAsync(Scope, sourceRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = sourceRunId,
                PackageOrigin = ArchitecturePackageOrigin.Created,
            });

        runRepository
            .Setup(r => r.UpdateAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureIdentityRepository> identityRepository = new();
        identityRepository
            .Setup(r => r.CreateAsync(Scope, It.IsAny<string>(), "model-2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord
            {
                ArchitectureId = architectureId,
                CurrentModelId = "model-2",
            });
        identityRepository
            .Setup(r => r.GetByIdAsync(Scope, architectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord { ArchitectureId = architectureId });

        ArchitectureIdentityService sut = new(
            identityRepository.Object,
            runRepository.Object,
            Mock.Of<IDraftRequestRepository>());

        ArchitectureRequest request = new()
        {
            RequestId = "recurrence-" + sourceRunId.ToString("N") + "-20260101120000",
            Description = "Scheduled follow-up review.",
            SystemName = "Platform",
            RequestSource = "recurrence",
        };

        ArchitectureIdentityRecord? linked = await sut.TryEnsureReviewRunLinkedAsync(
            Scope,
            reviewRunId,
            request,
            knowledgeModelId: "model-2");

        linked.Should().NotBeNull();
        runRepository.Verify(
            r => r.UpdateAsync(
                It.Is<RunRecord>(run => run.RunId == sourceRunId && run.ArchitectureId == architectureId),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()),
            Times.Once);
        runRepository.Verify(
            r => r.UpdateAsync(
                It.Is<RunRecord>(run => run.RunId == reviewRunId && run.ArchitectureId == architectureId),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()),
            Times.Once);
        identityRepository.Verify(
            r => r.UpdateCurrentModelAsync(Scope, architectureId, "model-2", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryEnsureReviewRunLinkedAsync_uses_spawned_run_from_matching_draft_request_id()
    {
        Guid draftId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid spawnedRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid reviewRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid architectureId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(Scope, reviewRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = reviewRunId });
        runRepository
            .Setup(r => r.GetByIdAsync(Scope, spawnedRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = spawnedRunId,
                ArchitectureId = architectureId,
                PackageOrigin = ArchitecturePackageOrigin.Created,
            });
        runRepository
            .Setup(r => r.UpdateAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask);

        Mock<IDraftRequestRepository> draftRepository = new();
        draftRepository
            .Setup(r => r.GetAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, draftId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DraftRequestResponse
            {
                DraftId = draftId,
                SpawnedRunId = spawnedRunId.ToString("N"),
                Status = DraftRequestStatus.RunSpawned,
            });

        Mock<IArchitectureIdentityRepository> identityRepository = new();
        identityRepository
            .Setup(r => r.GetByIdAsync(Scope, architectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord { ArchitectureId = architectureId });

        ArchitectureIdentityService sut = new(
            identityRepository.Object,
            runRepository.Object,
            draftRepository.Object);

        ArchitectureRequest request = new()
        {
            RequestId = draftId.ToString("N"),
            Description = "Review spawned from architecture draft.",
            SystemName = "Platform",
            RequestSource = "draft-intake",
            WorkflowIntent = ArchitectureWorkflowIntent.StartReview,
        };

        ArchitectureIdentityRecord? linked = await sut.TryEnsureReviewRunLinkedAsync(Scope, reviewRunId, request);

        linked.Should().NotBeNull();
        linked!.ArchitectureId.Should().Be(architectureId);
    }
}
