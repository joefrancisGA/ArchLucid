using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InMemoryArchitectureInventoryBindingRepositoryTests
{
    private static readonly ScopeContext OwnerScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task Same_architecture_id_can_hold_independent_bindings_across_all_scope_dimensions()
    {
        InMemoryArchitectureInventoryBindingRepository repository = new();
        Guid architectureId = Guid.NewGuid();

        ScopeContext[] scopes =
        [
            OwnerScope,
            new() { TenantId = Guid.NewGuid(), WorkspaceId = OwnerScope.WorkspaceId, ProjectId = OwnerScope.ProjectId },
            new() { TenantId = OwnerScope.TenantId, WorkspaceId = Guid.NewGuid(), ProjectId = OwnerScope.ProjectId },
            new() { TenantId = OwnerScope.TenantId, WorkspaceId = OwnerScope.WorkspaceId, ProjectId = Guid.NewGuid() },
        ];
        Guid[] snapshotIds = [Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()];

        for (int i = 0; i < scopes.Length; i++)
            await repository.UpsertAsync(Binding(scopes[i], architectureId, snapshotIds[i]));

        for (int i = 0; i < scopes.Length; i++)
            (await repository.TryGetByArchitectureIdAsync(scopes[i], architectureId))!.SnapshotId
                .Should().Be(snapshotIds[i]);

        (await repository.TryDeleteByArchitectureIdAsync(scopes[1], architectureId)).Should().BeTrue();
        (await repository.TryGetByArchitectureIdAsync(scopes[1], architectureId)).Should().BeNull();

        foreach (int i in new[] { 0, 2, 3 })
            (await repository.TryGetByArchitectureIdAsync(scopes[i], architectureId))!.SnapshotId
                .Should().Be(snapshotIds[i]);
    }

    [Fact]
    public async Task Other_scope_cannot_read_or_delete_an_existing_binding()
    {
        InMemoryArchitectureInventoryBindingRepository repository = new();
        Guid architectureId = Guid.NewGuid();
        ScopeContext otherTenant = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = OwnerScope.WorkspaceId,
            ProjectId = OwnerScope.ProjectId,
        };
        Guid snapshotId = Guid.NewGuid();
        await repository.UpsertAsync(Binding(OwnerScope, architectureId, snapshotId));

        (await repository.TryGetByArchitectureIdAsync(otherTenant, architectureId)).Should().BeNull();
        (await repository.TryDeleteByArchitectureIdAsync(otherTenant, architectureId)).Should().BeFalse();
        (await repository.TryGetByArchitectureIdAsync(OwnerScope, architectureId))!.SnapshotId
            .Should().Be(snapshotId);
    }

    [Fact]
    public async Task Returned_binding_and_original_input_do_not_alias_stored_row_version()
    {
        InMemoryArchitectureInventoryBindingRepository repository = new();
        Guid architectureId = Guid.NewGuid();
        ArchitectureInventoryBindingRecord input = Binding(OwnerScope, architectureId, Guid.NewGuid());
        byte[] rowVersion = [1, 2, 3];
        input = new ArchitectureInventoryBindingRecord
        {
            ArchitectureId = input.ArchitectureId,
            TenantId = input.TenantId,
            WorkspaceId = input.WorkspaceId,
            ScopeProjectId = input.ScopeProjectId,
            SnapshotId = input.SnapshotId,
            BoundBy = input.BoundBy,
            BoundUtc = input.BoundUtc,
            RowVersion = rowVersion,
        };
        await repository.UpsertAsync(input);
        rowVersion[0] = 9;

        ArchitectureInventoryBindingRecord firstRead =
            (await repository.TryGetByArchitectureIdAsync(OwnerScope, architectureId))!;
        firstRead.RowVersion.Should().Equal(1, 2, 3);
        firstRead.RowVersion![1] = 8;

        (await repository.TryGetByArchitectureIdAsync(OwnerScope, architectureId))!
            .RowVersion.Should().Equal(1, 2, 3);
    }

    private static ArchitectureInventoryBindingRecord Binding(ScopeContext scope, Guid architectureId, Guid snapshotId) =>
        new()
        {
            ArchitectureId = architectureId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            SnapshotId = snapshotId,
            BoundBy = "reviewer",
            BoundUtc = DateTime.UtcNow,
        };
}
