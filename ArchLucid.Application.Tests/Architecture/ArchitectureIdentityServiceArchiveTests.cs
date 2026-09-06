using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityServiceArchiveTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task ListIdentitiesAsync_hides_archived_identities_by_default()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        ArchitectureIdentityRecord active = await identityRepository.CreateAsync(Scope, "Active", null);
        ArchitectureIdentityRecord archived = await identityRepository.CreateAsync(Scope, "Archived", null);
        await identityRepository.TrySetArchivedAsync(Scope, archived.ArchitectureId, archived: true);

        ArchitectureIdentityListPage page = await sut.ListIdentitiesAsync(Scope, page: 1, pageSize: 50);

        page.TotalCount.Should().Be(1);
        page.Items.Should().ContainSingle(item => item.ArchitectureId == active.ArchitectureId);
        page.ArchivedHiddenCount.Should().Be(1);
    }

    [Fact]
    public async Task ListIdentitiesAsync_includeArchived_returns_archived_rows()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        ArchitectureIdentityRecord active = await identityRepository.CreateAsync(Scope, "Active", null);
        ArchitectureIdentityRecord archived = await identityRepository.CreateAsync(Scope, "Archived", null);
        await identityRepository.TrySetArchivedAsync(Scope, archived.ArchitectureId, archived: true);

        ArchitectureIdentityListPage page = await sut.ListIdentitiesAsync(
            Scope,
            page: 1,
            pageSize: 50,
            includeArchived: true);

        page.TotalCount.Should().Be(2);
        page.Items.Select(item => item.ArchitectureId).Should().BeEquivalentTo([active.ArchitectureId, archived.ArchitectureId]);
        page.ArchivedHiddenCount.Should().Be(0);
    }

    [Fact]
    public async Task GetIdentityAsync_still_returns_archived_identity()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        ArchitectureIdentityRecord archived = await identityRepository.CreateAsync(Scope, "Archived", null);
        await identityRepository.TrySetArchivedAsync(Scope, archived.ArchitectureId, archived: true);

        ArchitectureIdentityDetail? detail = await sut.GetIdentityAsync(Scope, archived.ArchitectureId);

        detail.Should().NotBeNull();
        detail!.ArchivedUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task PatchAsync_archive_and_restore_round_trip()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        ArchitectureIdentityRecord created = await identityRepository.CreateAsync(Scope, "Payments", null);

        ArchitectureIdentityRecord? archived = await sut.PatchAsync(
            Scope,
            created.ArchitectureId,
            new PatchArchitectureIdentityRequest { Archived = true });

        archived.Should().NotBeNull();
        archived!.ArchivedUtc.Should().NotBeNull();

        ArchitectureIdentityRecord? restored = await sut.PatchAsync(
            Scope,
            created.ArchitectureId,
            new PatchArchitectureIdentityRequest { Archived = false });

        restored.Should().NotBeNull();
        restored!.ArchivedUtc.Should().BeNull();
    }

    [Fact]
    public async Task PatchAsync_archive_returns_null_for_out_of_scope_architecture()
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

        ArchitectureIdentityRecord? archived = await sut.PatchAsync(
            otherScope,
            created.ArchitectureId,
            new PatchArchitectureIdentityRequest { Archived = true });

        archived.Should().BeNull();
    }
}
