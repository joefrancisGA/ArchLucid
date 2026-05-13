using System.Security.Claims;

using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;

using ArchLucid.Host.Core.Auth.Services;

using ArchLucid.Persistence.Data.Repositories;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;

namespace ArchLucid.Host.Core.Authorization;

/// <summary>
///     Augments coarse tenant JWT roles with <c>dbo.ProjectRoleAssignments</c> when callers map through SCIM-linked
///     directory principals.
/// </summary>
public sealed class TenantOrProjectCapabilityAuthorizationHandler(
    IHttpContextAccessor httpContextAccessor,
    IScopeContextProvider scopeProvider,
    IScimUserRepository scimUsers,
    IProjectRoleAssignmentRepository projectRoles)
    : AuthorizationHandler<TenantOrProjectCapabilityRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor =
        httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

    private readonly IProjectRoleAssignmentRepository _projectRoles =
        projectRoles ?? throw new ArgumentNullException(nameof(projectRoles));

    private readonly IScimUserRepository _scimUsers = scimUsers ?? throw new ArgumentNullException(nameof(scimUsers));

    private readonly IScopeContextProvider _scopeProvider = scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <inheritdoc />
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        TenantOrProjectCapabilityRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true)
            return;

        CancellationToken cancellationToken = ResolveCancellation(context);

        bool ok = requirement.Mode switch
        {
            TenantOrProjectCapabilityMode.Read => TenantHasReadJwt(context.User) ||
                                                  await SatisfiesProjectAsync(context.User, ProjectScopedEffectiveRole.Reader, cancellationToken),
            TenantOrProjectCapabilityMode.Execute => TenantHasExecuteJwt(context.User) ||
                                                     await SatisfiesProjectAsync(context.User, ProjectScopedEffectiveRole.Operator, cancellationToken),
            TenantOrProjectCapabilityMode.TenantAdminOnly => TenantHasAdminJwt(context.User),
            TenantOrProjectCapabilityMode.PolicyPackMutation => TenantHasAdminJwt(context.User) ||
                                                                await SatisfiesProjectAsync(context.User, ProjectScopedEffectiveRole.ProjectAdmin,
                                                                    cancellationToken),
            TenantOrProjectCapabilityMode.CommitRun =>
                context.User.HasClaim("permission", "commit:run") ||
                await SatisfiesProjectAsync(context.User, ProjectScopedEffectiveRole.Operator, cancellationToken),
            TenantOrProjectCapabilityMode.ArchitectureDefinitionImport => TenantHasArchitectureImportJwt(context.User) ||
                                                                          await SatisfiesProjectAsync(context.User, ProjectScopedEffectiveRole.Operator,
                                                                              cancellationToken),
            _ => false
        };

        if (ok)
            context.Succeed(requirement);
    }

    private CancellationToken ResolveCancellation(AuthorizationHandlerContext context)
    {
        if (context.Resource is HttpContext httpContext)
            return httpContext.RequestAborted;

        HttpContext? ambient = _httpContextAccessor.HttpContext;

        return ambient?.RequestAborted ?? CancellationToken.None;
    }

    private static bool TenantHasReadJwt(ClaimsPrincipal user)
    {
        foreach (string r in JwtReadRoles)
            if (user.IsInRole(r))
                return true;

        return false;
    }

    private static bool TenantHasExecuteJwt(ClaimsPrincipal user)
    {
        foreach (string r in JwtExecuteRoles)
            if (user.IsInRole(r))
                return true;

        return false;
    }

    private static bool TenantHasAdminJwt(ClaimsPrincipal user)
    {
        foreach (string r in JwtAdminRoles)
            if (user.IsInRole(r))
                return true;

        return false;
    }

    private static bool TenantHasArchitectureImportJwt(ClaimsPrincipal user)
    {
        foreach (string r in JwtArchitectureImportRoles)
            if (user.IsInRole(r))
                return true;

        return false;
    }

    /// <remarks>Reads stay aligned with the historical ASP.NET authorization role lists.</remarks>
    private static readonly string[] JwtReadRoles =
    [
        ArchLucidRoles.Reader,
        ArchLucidRoles.Operator,
        ArchLucidRoles.Architect,
        ArchLucidRoles.Reviewer,
        ArchLucidRoles.WorkspaceAdmin,
        ArchLucidRoles.Admin,
        ArchLucidRoles.Auditor
    ];

    private static readonly string[] JwtExecuteRoles =
    [
        ArchLucidRoles.Operator,
        ArchLucidRoles.Architect,
        ArchLucidRoles.Reviewer,
        ArchLucidRoles.WorkspaceAdmin,
        ArchLucidRoles.Admin
    ];

    private static readonly string[] JwtAdminRoles =
    [
        ArchLucidRoles.Admin,
        ArchLucidRoles.WorkspaceAdmin
    ];

    private static readonly string[] JwtArchitectureImportRoles =
    [
        ArchLucidRoles.Operator,
        ArchLucidRoles.Architect,
        ArchLucidRoles.WorkspaceAdmin,
        ArchLucidRoles.Admin
    ];

    private async Task<bool> SatisfiesProjectAsync(
        ClaimsPrincipal user,
        ProjectScopedEffectiveRole minimum,
        CancellationToken cancellationToken)
    {
        string? oid = RoleSyncService.TryDirectoryObjectKey(user);

        if (string.IsNullOrWhiteSpace(oid))
            return false;

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ScimUserRecord? row =
            await _scimUsers.GetByExternalIdAsync(scope.TenantId, oid.Trim(), cancellationToken).ConfigureAwait(false);

        if (row is null || row.DirectoryRemovedUtc is not null)
            return false;

        ProjectScopedEffectiveRole effective =
            await _projectRoles
                .GetHighestRoleAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, row.Id, cancellationToken).ConfigureAwait(false);

        return effective >= minimum;
    }
}
