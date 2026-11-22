using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class InMemoryArchitectureShareRepositoryIsolationTests
{
    private static readonly ScopeContext OwnerScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task Shares_are_not_visible_or_deletable_outside_the_full_scope()
    {
        InMemoryArchitectureShareRepository repository = new();
        Guid architectureId = Guid.NewGuid();
        ArchitectureShareRecord ownerShare = Share(architectureId, "admin", "admin");

        await repository.UpsertAsync(OwnerScope, ownerShare);

        ScopeContext[] otherScopes =
        [
            new() { TenantId = Guid.NewGuid(), WorkspaceId = OwnerScope.WorkspaceId, ProjectId = OwnerScope.ProjectId },
            new() { TenantId = OwnerScope.TenantId, WorkspaceId = Guid.NewGuid(), ProjectId = OwnerScope.ProjectId },
            new() { TenantId = OwnerScope.TenantId, WorkspaceId = OwnerScope.WorkspaceId, ProjectId = Guid.NewGuid() },
        ];

        foreach (ScopeContext otherScope in otherScopes)
        {
            (await repository.TryGetAsync(otherScope, architectureId, "admin")).Should().BeNull();
            (await repository.ListByArchitectureIdAsync(otherScope, architectureId)).Should().BeEmpty();
            (await repository.CountByArchitectureIdAsync(otherScope, architectureId)).Should().Be(0);
            (await repository.TryDeleteAsync(otherScope, architectureId, "admin")).Should().BeFalse();
        }

        (await repository.TryGetAsync(OwnerScope, architectureId, "admin"))!.Role.Should().Be("admin");
        (await repository.CountByArchitectureIdAsync(OwnerScope, architectureId)).Should().Be(1);
    }

    [Fact]
    public async Task Same_architecture_and_actor_ids_in_different_scopes_remain_independent()
    {
        InMemoryArchitectureShareRepository repository = new();
        Guid architectureId = Guid.NewGuid();
        ScopeContext anotherTenant = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = OwnerScope.WorkspaceId,
            ProjectId = OwnerScope.ProjectId,
        };

        await repository.UpsertAsync(OwnerScope, Share(architectureId, "viewer", "admin"));
        await repository.UpsertAsync(anotherTenant, Share(architectureId, "viewer", "view"));

        (await repository.TryGetAsync(OwnerScope, architectureId, "viewer"))!.Role.Should().Be("admin");
        (await repository.TryGetAsync(anotherTenant, architectureId, "viewer"))!.Role.Should().Be("view");
        (await repository.CountByArchitectureIdAsync(OwnerScope, architectureId)).Should().Be(1);
        (await repository.CountByArchitectureIdAsync(anotherTenant, architectureId)).Should().Be(1);

        (await repository.TryDeleteAsync(anotherTenant, architectureId, "viewer")).Should().BeTrue();
        (await repository.TryGetAsync(OwnerScope, architectureId, "viewer")).Should().NotBeNull();
        (await repository.TryGetAsync(anotherTenant, architectureId, "viewer")).Should().BeNull();
    }

    [Fact]
    public async Task Share_row_version_is_detached_on_insert_read_and_list()
    {
        InMemoryArchitectureShareRepository repository = new();
        Guid architectureId = Guid.NewGuid();
        ArchitectureShareRecord input = Share(architectureId, "viewer", "view");
        input.RowVersion = [1, 2, 3];

        await repository.UpsertAsync(OwnerScope, input);
        input.RowVersion[0] = 9;

        ArchitectureShareRecord read = (await repository.TryGetAsync(OwnerScope, architectureId, "viewer"))!;
        read.RowVersion.Should().Equal(1, 2, 3);
        read.RowVersion![1] = 8;

        ArchitectureShareRecord listed = (await repository.ListByArchitectureIdAsync(OwnerScope, architectureId)).Single();
        listed.RowVersion.Should().Equal(1, 2, 3);
        listed.RowVersion![2] = 7;

        (await repository.TryGetAsync(OwnerScope, architectureId, "viewer"))!.RowVersion.Should().Equal(1, 2, 3);
    }

    private static ArchitectureShareRecord Share(Guid architectureId, string actorOid, string role) =>
        new()
        {
            ArchitectureId = architectureId,
            ActorOid = actorOid,
            Role = role,
            GrantedBy = "owner",
            GrantedUtc = DateTime.UtcNow,
        };
}
