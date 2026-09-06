using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityServiceDisplayNameLifecycleTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task TryUpgradeUntitledDisplayNameFromDraftAsync_upgrades_once_when_system_name_arrives()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        DraftRequestResponse draft = await draftRepository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "actor",
            new DraftRequestDocument(),
            CancellationToken.None);

        ArchitectureIdentityRecord identity = await sut.EnsureForDraftAsync(
            Scope,
            draft.DraftId,
            ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture,
            CancellationToken.None);

        identity.DisplayName.Should().Be(ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture);

        draft.Document.SystemName = "Payments platform";
        await draftRepository.UpdateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            draft.DraftId,
            draft.Status,
            draft.Document,
            draft.RedirectReason,
            draft.SpawnedRunId,
            CancellationToken.None);

        await sut.TryUpgradeUntitledDisplayNameFromDraftAsync(Scope, draft.DraftId, CancellationToken.None);

        ArchitectureIdentityRecord? upgraded = await identityRepository.GetByIdAsync(Scope, identity.ArchitectureId);
        upgraded!.DisplayName.Should().Be("Payments platform");

        draft.Document.SystemName = "Changed again";
        await draftRepository.UpdateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            draft.DraftId,
            draft.Status,
            draft.Document,
            draft.RedirectReason,
            draft.SpawnedRunId,
            CancellationToken.None);

        await sut.TryUpgradeUntitledDisplayNameFromDraftAsync(Scope, draft.DraftId, CancellationToken.None);

        ArchitectureIdentityRecord? unchanged = await identityRepository.GetByIdAsync(Scope, identity.ArchitectureId);
        unchanged!.DisplayName.Should().Be("Payments platform");
    }

    [Fact]
    public async Task RenameAsync_survives_subsequent_draft_title_edits()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        DraftRequestResponse draft = await draftRepository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "actor",
            new DraftRequestDocument
            {
                SystemName = "Original",
                FreeTextIntent = "Initial intent long enough",
            },
            CancellationToken.None);

        ArchitectureIdentityRecord identity = await sut.EnsureForDraftAsync(
            Scope,
            draft.DraftId,
            "Original",
            CancellationToken.None);

        ArchitectureIdentityRecord? renamed = await sut.RenameAsync(Scope, identity.ArchitectureId, "Career name");
        renamed!.DisplayName.Should().Be("Career name");

        draft.Document.SystemName = "Draft title changed";
        await draftRepository.UpdateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            draft.DraftId,
            draft.Status,
            draft.Document,
            draft.RedirectReason,
            draft.SpawnedRunId,
            CancellationToken.None);

        await sut.TryUpgradeUntitledDisplayNameFromDraftAsync(Scope, draft.DraftId, CancellationToken.None);

        ArchitectureIdentityRecord? persisted = await identityRepository.GetByIdAsync(Scope, identity.ArchitectureId);
        persisted!.DisplayName.Should().Be("Career name");
    }

    [Fact]
    public async Task TryEnsureReviewRunLinkedAsync_ensures_identity_when_draft_fk_is_null()
    {
        Guid reviewRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        DraftRequestResponse draft = await draftRepository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "actor",
            new DraftRequestDocument
            {
                SystemName = "Platform",
                FreeTextIntent = "Review spawn draft with enough characters.",
            },
            CancellationToken.None);

        await runRepository.SaveAsync(
            new RunRecord
            {
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ScopeProjectId = Scope.ProjectId,
                RunId = reviewRunId,
                ProjectId = "platform-review",
                PackageOrigin = ArchitecturePackageOrigin.Reviewed,
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        ArchitectureRequest request = new()
        {
            RequestId = draft.DraftId.ToString("N"),
            Description = "Review spawned from architecture draft.",
            SystemName = "Platform",
            RequestSource = "draft-intake",
            WorkflowIntent = ArchitectureWorkflowIntent.StartReview,
        };

        ArchitectureIdentityRecord? linked = await sut.TryEnsureReviewRunLinkedAsync(Scope, reviewRunId, request);

        linked.Should().NotBeNull();

        DraftRequestResponse? reloadedDraft = await draftRepository.GetAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            draft.DraftId,
            CancellationToken.None);

        reloadedDraft!.ArchitectureId.Should().Be(linked!.ArchitectureId);

        RunRecord? reviewRun = await runRepository.GetByIdAsync(Scope, reviewRunId, CancellationToken.None);
        reviewRun!.ArchitectureId.Should().Be(linked.ArchitectureId);
    }
}
