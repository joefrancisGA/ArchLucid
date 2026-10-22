using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryWorkspaceMembershipRepositoryCoverageTests
{
    [Fact]
    public async Task Upsert_list_and_privileged_count_cover_status_and_role_filters()
    {
        InMemoryWorkspaceMembershipRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid otherTenant = Guid.NewGuid();
        Guid userAdmin = Guid.NewGuid();
        Guid userWorkspaceAdmin = Guid.NewGuid();
        Guid userReader = Guid.NewGuid();
        Guid workspaceA = Guid.NewGuid();
        Guid workspaceB = Guid.NewGuid();
        DateTimeOffset t0 = TimeProvider.System.GetUtcNow();

        await sut.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userAdmin,
                TenantId = tenantId,
                WorkspaceId = workspaceA,
                Role = ArchLucidRoles.Admin,
                Status = WorkspaceMembershipStatus.Active,
            },
            t0,
            CancellationToken.None);

        await sut.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userWorkspaceAdmin,
                TenantId = tenantId,
                WorkspaceId = workspaceB,
                Role = ArchLucidRoles.WorkspaceAdmin,
                Status = WorkspaceMembershipStatus.Active,
            },
            t0.AddMinutes(1),
            CancellationToken.None);

        await sut.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userReader,
                TenantId = tenantId,
                WorkspaceId = workspaceA,
                Role = ArchLucidRoles.Reader,
                Status = WorkspaceMembershipStatus.Active,
            },
            t0.AddMinutes(2),
            CancellationToken.None);

        await sut.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = Guid.NewGuid(),
                TenantId = tenantId,
                WorkspaceId = Guid.NewGuid(),
                Role = ArchLucidRoles.Admin,
                Status = WorkspaceMembershipStatus.Suspended,
            },
            t0.AddMinutes(3),
            CancellationToken.None);

        await sut.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = Guid.NewGuid(),
                TenantId = otherTenant,
                WorkspaceId = Guid.NewGuid(),
                Role = ArchLucidRoles.Admin,
                Status = WorkspaceMembershipStatus.Active,
            },
            t0.AddMinutes(4),
            CancellationToken.None);

        await sut.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userAdmin,
                TenantId = tenantId,
                WorkspaceId = workspaceA,
                Role = ArchLucidRoles.Admin,
                Status = WorkspaceMembershipStatus.Active,
            },
            t0.AddMinutes(5),
            CancellationToken.None);

        (await sut.ListByUserIdAsync(userAdmin, CancellationToken.None)).Should().ContainSingle();
        (await sut.ListByUserAndTenantAsync(userAdmin, tenantId, CancellationToken.None)).Should().ContainSingle();
        (await sut.CountActivePrivilegedMembersByTenantAsync(tenantId, CancellationToken.None)).Should().Be(2);
    }
}
