using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class InMemoryArchitectureProjectRepositoryTests
{
    [Fact]
    public async Task Insert_list_soft_delete_restore_round_trip()
    {
        InMemoryArchitectureProjectRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        await sut.InsertAsync(projectId, tenantId, workspaceId, "  Pilot  ", CancellationToken.None);

        IReadOnlyList<ArchitectureProjectRecord> active =
            await sut.ListActiveByTenantAsync(tenantId, CancellationToken.None);

        active.Should().ContainSingle();
        active[0].Name.Should().Be("Pilot");

        (await sut.TrySoftDeleteAsync(tenantId, workspaceId, projectId, CancellationToken.None))
            .Should()
            .Be(ArchitectureProjectSoftDeleteResult.Deleted);

        (await sut.ListActiveByTenantAsync(tenantId, CancellationToken.None)).Should().BeEmpty();

        IReadOnlyList<ArchitectureProjectRecord> deleted =
            await sut.ListSoftDeletedByTenantAsync(tenantId, CancellationToken.None);

        deleted.Should().ContainSingle();
        deleted[0].DeletedUtc.Should().NotBeNull();

        (await sut.TryRestoreAsync(tenantId, workspaceId, projectId, CancellationToken.None))
            .Should()
            .Be(ArchitectureProjectRestoreResult.Restored);

        (await sut.ListActiveByTenantAsync(tenantId, CancellationToken.None)).Should().ContainSingle();
        (await sut.ListSoftDeletedByTenantAsync(tenantId, CancellationToken.None)).Should().BeEmpty();

        (await sut.TryRestoreAsync(tenantId, workspaceId, projectId, CancellationToken.None))
            .Should()
            .Be(ArchitectureProjectRestoreResult.AlreadyActive);

        (await sut.TrySoftDeleteAsync(tenantId, workspaceId, projectId, CancellationToken.None))
            .Should()
            .Be(ArchitectureProjectSoftDeleteResult.AlreadyDeleted);
    }

    [Fact]
    public async Task Insert_duplicate_id_throws()
    {
        InMemoryArchitectureProjectRepository sut = new();
        Guid projectId = Guid.NewGuid();

        await sut.InsertAsync(projectId, Guid.NewGuid(), Guid.NewGuid(), "one", CancellationToken.None);

        Func<Task> act = () => sut.InsertAsync(projectId, Guid.NewGuid(), Guid.NewGuid(), "two", CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task TryRestore_returns_collision_when_active_name_exists()
    {
        InMemoryArchitectureProjectRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid deletedId = Guid.NewGuid();
        Guid activeId = Guid.NewGuid();

        await sut.InsertAsync(deletedId, tenantId, workspaceId, "Shared", CancellationToken.None);
        await sut.TrySoftDeleteAsync(tenantId, workspaceId, deletedId, CancellationToken.None);
        await sut.InsertAsync(activeId, tenantId, workspaceId, "shared", CancellationToken.None);

        (await sut.TryRestoreAsync(tenantId, workspaceId, deletedId, CancellationToken.None))
            .Should()
            .Be(ArchitectureProjectRestoreResult.ActiveProjectNameCollision);
    }

    [Fact]
    public async Task TrySoftDelete_returns_false_for_unknown_project()
    {
        InMemoryArchitectureProjectRepository sut = new();

        ArchitectureProjectSoftDeleteResult deleted =
            await sut.TrySoftDeleteAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None);

        deleted.Should().Be(ArchitectureProjectSoftDeleteResult.NotFound);
    }
}
