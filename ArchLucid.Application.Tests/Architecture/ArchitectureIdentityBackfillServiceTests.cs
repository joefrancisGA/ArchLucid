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
public sealed class ArchitectureIdentityBackfillServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private static readonly ScopeContext OtherTenantScope = new()
    {
        TenantId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
        WorkspaceId = Scope.WorkspaceId,
        ProjectId = Scope.ProjectId,
    };

    [Fact]
    public async Task BackfillScopeAsync_two_same_named_drafts_create_two_distinct_identities()
    {
        (ArchitectureIdentityBackfillService sut, InMemoryDraftRequestRepository draftRepository, InMemoryArchitectureIdentityRepository identityRepository, _, _) = CreateSut();

        DraftRequestResponse firstDraft = await CreateDraftAsync(
            draftRepository,
            "Platform",
            "First platform draft with enough characters.");
        DraftRequestResponse secondDraft = await CreateDraftAsync(
            draftRepository,
            "Platform",
            "Second platform draft with enough characters.");

        ArchitectureIdentityBackfillReport report = await sut.BackfillScopeAsync(Scope, CancellationToken.None);

        report.OrphanDraftsLinked.Should().Be(2);
        report.TotalMutations.Should().Be(2);

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

        reloadedFirst!.ArchitectureId.Should().NotBeNull();
        reloadedSecond!.ArchitectureId.Should().NotBeNull();
        reloadedFirst.ArchitectureId!.Value.Should().NotBe(reloadedSecond.ArchitectureId!.Value);

        var page = await identityRepository.ListAsync(Scope, 1, 50, includeArchived: true, CancellationToken.None);
        page.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task BackfillScopeAsync_links_spawned_draft_to_existing_run_architecture()
    {
        (ArchitectureIdentityBackfillService sut, InMemoryDraftRequestRepository draftRepository, InMemoryArchitectureIdentityRepository identityRepository, InMemoryRunRepository runRepository, _) = CreateSut();

        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        ArchitectureIdentityRecord identity = await identityRepository.CreateAsync(Scope, "Payments API", null);

        await runRepository.SaveAsync(
            new RunRecord
            {
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ScopeProjectId = Scope.ProjectId,
                RunId = runId,
                ProjectId = "payments-api",
                PackageOrigin = ArchitecturePackageOrigin.Created,
                ArchitectureId = identity.ArchitectureId,
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        DraftRequestResponse draft = await draftRepository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "operator-1",
            new DraftRequestDocument
            {
                SystemName = "Payments API",
                FreeTextIntent = "Spawned draft with enough characters for validation.",
            },
            CancellationToken.None);

        await draftRepository.UpdateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            draft.DraftId,
            DraftRequestStatus.RunSpawned,
            draft.Document,
            redirectReason: null,
            spawnedRunId: runId.ToString("N"),
            CancellationToken.None);

        ArchitectureIdentityBackfillReport report = await sut.BackfillScopeAsync(Scope, CancellationToken.None);

        report.SpawnedDraftsLinked.Should().Be(1);
        report.OrphanDraftsLinked.Should().Be(0);

        DraftRequestResponse? reloaded = await draftRepository.GetAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            draft.DraftId,
            CancellationToken.None);

        reloaded!.ArchitectureId.Should().Be(identity.ArchitectureId);
    }

    [Fact]
    public async Task BackfillScopeAsync_second_run_is_idempotent()
    {
        (ArchitectureIdentityBackfillService sut, InMemoryDraftRequestRepository draftRepository, _, _, _) = CreateSut();

        await CreateDraftAsync(draftRepository, "Platform", "Draft with enough characters for validation.");

        ArchitectureIdentityBackfillReport first = await sut.BackfillScopeAsync(Scope, CancellationToken.None);
        ArchitectureIdentityBackfillReport second = await sut.BackfillScopeAsync(Scope, CancellationToken.None);

        first.OrphanDraftsLinked.Should().Be(1);
        second.TotalMutations.Should().Be(0);
    }

    [Fact]
    public async Task BackfillScopeAsync_does_not_attach_cross_tenant_spawned_run()
    {
        (ArchitectureIdentityBackfillService sut, InMemoryDraftRequestRepository draftRepository, InMemoryArchitectureIdentityRepository identityRepository, InMemoryRunRepository runRepository, _) = CreateSut();

        ArchitectureIdentityRecord otherTenantIdentity =
            await identityRepository.CreateAsync(OtherTenantScope, "Foreign platform", null);
        Guid foreignRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        await runRepository.SaveAsync(
            new RunRecord
            {
                TenantId = OtherTenantScope.TenantId,
                WorkspaceId = OtherTenantScope.WorkspaceId,
                ScopeProjectId = OtherTenantScope.ProjectId,
                RunId = foreignRunId,
                ProjectId = "foreign",
                PackageOrigin = ArchitecturePackageOrigin.Created,
                ArchitectureId = otherTenantIdentity.ArchitectureId,
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        DraftRequestResponse draft = await draftRepository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "operator-1",
            new DraftRequestDocument
            {
                SystemName = "Platform",
                FreeTextIntent = "Local draft with enough characters for validation.",
            },
            CancellationToken.None);

        await draftRepository.UpdateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            draft.DraftId,
            DraftRequestStatus.RunSpawned,
            draft.Document,
            redirectReason: null,
            spawnedRunId: foreignRunId.ToString("N"),
            CancellationToken.None);

        ArchitectureIdentityBackfillReport report = await sut.BackfillScopeAsync(Scope, CancellationToken.None);

        report.SpawnedDraftsLinked.Should().Be(0);
        report.OrphanDraftsLinked.Should().Be(1);

        DraftRequestResponse? reloaded = await draftRepository.GetAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            draft.DraftId,
            CancellationToken.None);

        reloaded!.ArchitectureId.Should().NotBe(otherTenantIdentity.ArchitectureId);
    }

    private static async Task<DraftRequestResponse> CreateDraftAsync(
        InMemoryDraftRequestRepository draftRepository,
        string systemName,
        string freeTextIntent)
    {
        return await draftRepository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "operator-1",
            new DraftRequestDocument
            {
                SystemName = systemName,
                FreeTextIntent = freeTextIntent,
            },
            CancellationToken.None);
    }

    private static (
        ArchitectureIdentityBackfillService Sut,
        InMemoryDraftRequestRepository DraftRepository,
        InMemoryArchitectureIdentityRepository IdentityRepository,
        InMemoryRunRepository RunRepository,
        InMemoryArchitectureRequestRepository RequestRepository) CreateSut()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        InMemoryArchitectureRequestRepository requestRepository = new();
        ArchitectureIdentityService identityService = new(identityRepository, runRepository, draftRepository);
        ArchitectureIdentityBackfillService sut = new(
            identityService,
            identityRepository,
            runRepository,
            draftRepository,
            requestRepository);

        return (sut, draftRepository, identityRepository, runRepository, requestRepository);
    }
}
