using System.Security.Claims;
using ArchLucid.Api.Security;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using FluentAssertions;
using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ScimProjectEvidenceEntitlementAuthorityTests
{
    private static readonly Guid Tenant = Guid.NewGuid();
    private static readonly Guid Workspace = Guid.NewGuid();
    private static readonly Guid Project = Guid.NewGuid();
    private static readonly Guid Evidence = Guid.NewGuid();
    private static readonly Guid UserId = Guid.NewGuid();

    private static ClaimsPrincipal Principal(bool directoryIdentity = true) =>
        new(new ClaimsIdentity(directoryIdentity
            ? [new Claim("oid", "directory-user")]
            : [new Claim(ClaimTypes.NameIdentifier, "unlinked-user")], "test"));

    private static (ScimProjectEvidenceEntitlementAuthority Authority,
        Mock<IScimUserRepository> Users, Mock<IProjectRoleAssignmentRepository> Roles)
        Setup(ProjectScopedEffectiveRole role = ProjectScopedEffectiveRole.Reader,
              bool active = true, bool removed = false)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        { TenantId = Tenant, WorkspaceId = Workspace, ProjectId = Project });
        Mock<IScimUserRepository> users = new();
        users.Setup(s => s.GetByExternalIdAsync(Tenant, "directory-user",
            It.IsAny<CancellationToken>())).ReturnsAsync(new ScimUserRecord
            {
                Id = UserId, TenantId = Tenant, ExternalId = "directory-user",
                Active = active,
                DirectoryRemovedUtc = removed ? DateTimeOffset.UtcNow : null
            });
        Mock<IProjectRoleAssignmentRepository> roles = new();
        roles.Setup(r => r.GetHighestRoleAsync(Tenant, Workspace, Project, UserId,
            It.IsAny<CancellationToken>())).ReturnsAsync(role);
        return (new ScimProjectEvidenceEntitlementAuthority(
            scope.Object, users.Object, roles.Object), users, roles);
    }

    private static EvidenceReadResource Resource(Guid? tenant = null) =>
        new(tenant ?? Tenant, Workspace, Project, Evidence);

    [Fact]
    public async Task Current_project_reader_is_allowed()
    {
        var (authority, _, _) = Setup();
        (await authority.HasCurrentReadEntitlementAsync(
            Principal(), Resource(), CancellationToken.None)).Should().BeTrue();
    }

    [Fact]
    public async Task Foreign_tenant_is_denied_without_acl_query()
    {
        var (authority, users, roles) = Setup();
        (await authority.HasCurrentReadEntitlementAsync(
            Principal(), Resource(Guid.NewGuid()), CancellationToken.None)).Should().BeFalse();
        users.VerifyNoOtherCalls();
        roles.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Revoked_project_role_is_denied()
    {
        var (authority, _, _) = Setup(ProjectScopedEffectiveRole.None);
        (await authority.HasCurrentReadEntitlementAsync(
            Principal(), Resource(), CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task Deactivated_scim_user_is_denied()
    {
        var (authority, _, roles) = Setup(active: false);
        (await authority.HasCurrentReadEntitlementAsync(
            Principal(), Resource(), CancellationToken.None)).Should().BeFalse();
        roles.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Deleted_scim_user_is_denied()
    {
        var (authority, _, roles) = Setup(removed: true);
        (await authority.HasCurrentReadEntitlementAsync(
            Principal(), Resource(), CancellationToken.None)).Should().BeFalse();
        roles.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Unlinked_identity_is_denied()
    {
        var (authority, users, _) = Setup();
        (await authority.HasCurrentReadEntitlementAsync(
            Principal(false), Resource(), CancellationToken.None)).Should().BeFalse();
        users.VerifyNoOtherCalls();
    }
}
