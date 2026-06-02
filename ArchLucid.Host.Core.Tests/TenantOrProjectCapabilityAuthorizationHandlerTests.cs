using System.Security.Claims;

using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;

using ArchLucid.Host.Core.Authorization;

using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;

using Moq;

namespace ArchLucid.Host.Core.Tests;

/// <summary>TB-199: security-critical authorization handler scenarios for tenant JWT vs project SCIM overlays.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TenantOrProjectCapabilityAuthorizationHandlerTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid ScimUserId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private const string DirectoryOid = "oid-tenant-capability-test";

    [Fact]
    public async Task HandleRequirementAsync_unauthenticated_user_does_not_succeed()
    {
        TenantOrProjectCapabilityAuthorizationHandler handler = CreateHandler(
            out Mock<IScimUserRepository> scimMock,
            out Mock<IProjectRoleAssignmentRepository> projectMock);

        AuthorizationHandlerContext context = await InvokeAsync(
            handler,
            new ClaimsPrincipal(new ClaimsIdentity()),
            new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.Read));

        context.HasSucceeded.Should().BeFalse();
        scimMock.Verify(
            r => r.GetByExternalIdAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        projectMock.Verify(
            r => r.GetHighestRoleAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleRequirementAsync_reader_jwt_succeeds_read_without_project_lookup()
    {
        TenantOrProjectCapabilityAuthorizationHandler handler = CreateHandler(
            out Mock<IScimUserRepository> scimMock,
            out Mock<IProjectRoleAssignmentRepository> projectMock);

        ClaimsPrincipal user = AuthenticatedUser(new Claim(ClaimTypes.Role, ArchLucidRoles.Reader));

        AuthorizationHandlerContext context = await InvokeAsync(
            handler,
            user,
            new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.Read));

        context.HasSucceeded.Should().BeTrue();
        scimMock.Verify(
            r => r.GetByExternalIdAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        projectMock.Verify(
            r => r.GetHighestRoleAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleRequirementAsync_project_operator_succeeds_execute_when_jwt_lacks_execute_roles()
    {
        Mock<IScimUserRepository> scimMock = new();
        scimMock
            .Setup(r => r.GetByExternalIdAsync(TenantId, DirectoryOid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ScimUserRecord
            {
                Id = ScimUserId,
                TenantId = TenantId,
                ExternalId = DirectoryOid,
                UserName = "operator@example.com",
                Active = true
            });

        Mock<IProjectRoleAssignmentRepository> projectMock = new();
        projectMock
            .Setup(r => r.GetHighestRoleAsync(TenantId, WorkspaceId, ProjectId, ScimUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ProjectScopedEffectiveRole.Operator);

        TenantOrProjectCapabilityAuthorizationHandler handler = CreateHandler(scimMock, projectMock);

        ClaimsPrincipal user = AuthenticatedUser(new Claim("oid", DirectoryOid));

        AuthorizationHandlerContext context = await InvokeAsync(
            handler,
            user,
            new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.Execute));

        context.HasSucceeded.Should().BeTrue();
    }

    [Fact]
    public async Task HandleRequirementAsync_without_directory_oid_fails_execute_even_when_repos_would_allow()
    {
        Mock<IProjectRoleAssignmentRepository> projectMock = new();
        projectMock
            .Setup(r => r.GetHighestRoleAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ProjectScopedEffectiveRole.Operator);

        TenantOrProjectCapabilityAuthorizationHandler handler = CreateHandler(new Mock<IScimUserRepository>(), projectMock);

        ClaimsPrincipal user = AuthenticatedUser(new Claim(ClaimTypes.Name, "no-oid"));

        AuthorizationHandlerContext context = await InvokeAsync(
            handler,
            user,
            new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.Execute));

        context.HasSucceeded.Should().BeFalse();
        projectMock.Verify(
            r => r.GetHighestRoleAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task HandleRequirementAsync_missing_scim_user_fails_project_execute_path()
    {
        Mock<IScimUserRepository> scimMock = new();
        scimMock
            .Setup(r => r.GetByExternalIdAsync(TenantId, DirectoryOid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScimUserRecord?)null);

        TenantOrProjectCapabilityAuthorizationHandler handler = CreateHandler(scimMock, new Mock<IProjectRoleAssignmentRepository>());

        ClaimsPrincipal user = AuthenticatedUser(new Claim("oid", DirectoryOid));

        AuthorizationHandlerContext context = await InvokeAsync(
            handler,
            user,
            new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.Execute));

        context.HasSucceeded.Should().BeFalse();
    }

    [Fact]
    public async Task HandleRequirementAsync_commit_run_permission_claim_succeeds_without_project_role()
    {
        TenantOrProjectCapabilityAuthorizationHandler handler = CreateHandler(
            out Mock<IScimUserRepository> scimMock,
            out Mock<IProjectRoleAssignmentRepository> projectMock);

        ClaimsPrincipal user = AuthenticatedUser(new Claim("permission", "commit:run"));

        AuthorizationHandlerContext context = await InvokeAsync(
            handler,
            user,
            new TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode.CommitRun));

        context.HasSucceeded.Should().BeTrue();
        scimMock.Verify(
            r => r.GetByExternalIdAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        projectMock.Verify(
            r => r.GetHighestRoleAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static TenantOrProjectCapabilityAuthorizationHandler CreateHandler(
        out Mock<IScimUserRepository> scimMock,
        out Mock<IProjectRoleAssignmentRepository> projectMock)
    {
        scimMock = new Mock<IScimUserRepository>();
        projectMock = new Mock<IProjectRoleAssignmentRepository>();

        return CreateHandler(scimMock, projectMock);
    }

    private static TenantOrProjectCapabilityAuthorizationHandler CreateHandler(
        Mock<IScimUserRepository> scimMock,
        Mock<IProjectRoleAssignmentRepository> projectMock)
    {
        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock
            .Setup(p => p.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId
            });

        HttpContextAccessor accessor = new();

        return new TenantOrProjectCapabilityAuthorizationHandler(
            accessor,
            scopeMock.Object,
            scimMock.Object,
            projectMock.Object);
    }

    private static ClaimsPrincipal AuthenticatedUser(params Claim[] extraClaims)
    {
        List<Claim> claims = [new Claim("tenant_id", TenantId.ToString("D")), ..extraClaims];

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
    }

    private static async Task<AuthorizationHandlerContext> InvokeAsync(
        TenantOrProjectCapabilityAuthorizationHandler handler,
        ClaimsPrincipal user,
        TenantOrProjectCapabilityRequirement requirement)
    {
        DefaultHttpContext http = new() { User = user };
        AuthorizationHandlerContext context = new([requirement], user, http);

        await handler.HandleAsync(context);

        return context;
    }
}
