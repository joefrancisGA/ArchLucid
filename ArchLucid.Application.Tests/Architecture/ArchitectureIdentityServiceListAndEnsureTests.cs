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
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityServiceListAndEnsureTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task ListIdentitiesAsync_returns_only_scoped_architectures()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        await identityRepository.CreateAsync(Scope, "Alpha", null);
        await identityRepository.CreateAsync(Scope, "Beta", null);

        ScopeContext otherScope = new()
        {
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
        };

        await identityRepository.CreateAsync(otherScope, "Other project", null);

        var page = await sut.ListIdentitiesAsync(Scope, page: 1, pageSize: 50);

        page.TotalCount.Should().Be(2);
        page.Items.Select(item => item.DisplayName).Should().BeEquivalentTo(["Alpha", "Beta"]);
    }

    [Fact]
    public async Task GetIdentityAsync_returns_null_for_out_of_scope_architecture()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        ArchitectureIdentityRecord created = await identityRepository.CreateAsync(Scope, "Scoped", null);

        ScopeContext otherScope = new()
        {
            TenantId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
        };

        ArchitectureIdentityDetail? detail = await sut.GetIdentityAsync(otherScope, created.ArchitectureId);

        detail.Should().BeNull();
    }

    [Fact]
    public async Task EnsureForDraftAsync_two_creates_produce_two_distinct_identities()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        DraftRequestResponse firstDraft = await draftRepository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "operator-1",
            new DraftRequestDocument { FreeTextIntent = "First platform draft with enough characters." },
            CancellationToken.None);

        DraftRequestResponse secondDraft = await draftRepository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "operator-1",
            new DraftRequestDocument { FreeTextIntent = "Second platform draft with enough characters." },
            CancellationToken.None);

        ArchitectureIdentityRecord firstIdentity = await sut.EnsureForDraftAsync(
            Scope,
            firstDraft.DraftId,
            "First platform",
            CancellationToken.None);
        ArchitectureIdentityRecord secondIdentity = await sut.EnsureForDraftAsync(
            Scope,
            secondDraft.DraftId,
            "Second platform",
            CancellationToken.None);

        firstIdentity.ArchitectureId.Should().NotBe(secondIdentity.ArchitectureId);

        DraftRequestResponse? reloadedFirst = await draftRepository.GetAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            firstDraft.DraftId,
            CancellationToken.None);
        DraftRequestResponse? reloadedSecond = await draftRepository.GetAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            secondDraft.DraftId,
            CancellationToken.None);

        reloadedFirst!.ArchitectureId.Should().Be(firstIdentity.ArchitectureId);
        reloadedSecond!.ArchitectureId.Should().Be(secondIdentity.ArchitectureId);
    }

    [Fact]
    public async Task EnsureForDraftAsync_second_call_is_idempotent_for_same_draft()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        DraftRequestResponse draft = await draftRepository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "operator-1",
            new DraftRequestDocument { FreeTextIntent = "Shared draft with enough characters for validation." },
            CancellationToken.None);

        ArchitectureIdentityRecord firstEnsure = await sut.EnsureForDraftAsync(
            Scope,
            draft.DraftId,
            "Shared platform",
            CancellationToken.None);
        ArchitectureIdentityRecord secondEnsure = await sut.EnsureForDraftAsync(
            Scope,
            draft.DraftId,
            "Renamed platform",
            CancellationToken.None);

        secondEnsure.ArchitectureId.Should().Be(firstEnsure.ArchitectureId);

        var page = await identityRepository.ListAsync(Scope, 1, 50, CancellationToken.None);

        page.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task TryEnsureReviewRunLinkedAsync_uses_draft_architecture_id_before_spawned_run()
    {
        Guid draftId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid reviewRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid architectureId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(Scope, reviewRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = reviewRunId });
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
                ArchitectureId = architectureId,
                SpawnedRunId = Guid.NewGuid().ToString("N"),
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
        runRepository.Verify(
            r => r.GetByIdAsync(Scope, It.Is<Guid>(id => id != reviewRunId), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
