using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityServiceRenameTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task RenameAsync_updates_display_name_without_changing_architecture_id()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        ArchitectureIdentityRecord created = await identityRepository.CreateAsync(Scope, "Original name", null);

        ArchitectureIdentityRecord? renamed = await sut.RenameAsync(Scope, created.ArchitectureId, "  Retail payments  ");

        renamed.Should().NotBeNull();
        renamed!.ArchitectureId.Should().Be(created.ArchitectureId);
        renamed.DisplayName.Should().Be("Retail payments");

        ArchitectureIdentityRecord? reloaded = await identityRepository.GetByIdAsync(Scope, created.ArchitectureId);
        reloaded!.DisplayName.Should().Be("Retail payments");
        reloaded.UpdatedUtc.Should().BeOnOrAfter(created.UpdatedUtc);
    }

    [Fact]
    public async Task RenameAsync_rejects_whitespace_only_display_name()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        ArchitectureIdentityRecord created = await identityRepository.CreateAsync(Scope, "Original name", null);

        Func<Task> act = () => sut.RenameAsync(Scope, created.ArchitectureId, "   ");

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task RenameAsync_returns_null_for_out_of_scope_architecture()
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

        ArchitectureIdentityRecord? renamed = await sut.RenameAsync(otherScope, created.ArchitectureId, "New name");

        renamed.Should().BeNull();
    }

    [Fact]
    public async Task PatchAsync_can_update_description_without_rewriting_display_name()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository identityRepository = new(draftRepository, runRepository);
        ArchitectureIdentityService sut = new(identityRepository, runRepository, draftRepository);

        ArchitectureIdentityRecord created = await identityRepository.CreateAsync(Scope, "Payments API", null);

        ArchitectureIdentityRecord? patched = await sut.PatchAsync(
            Scope,
            created.ArchitectureId,
            new PatchArchitectureIdentityRequest { Description = "Primary retail payments stack" });

        patched.Should().NotBeNull();
        patched!.DisplayName.Should().Be("Payments API");
        patched.Description.Should().Be("Primary retail payments stack");
    }
}
