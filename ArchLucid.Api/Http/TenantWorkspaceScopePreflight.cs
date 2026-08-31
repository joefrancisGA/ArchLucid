using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Http;

/// <summary>
///     Shared tenant + workspace existence checks for scope-bound API reads (parity with
///     <see cref="ArchLucid.Api.Controllers.Tenancy.TenantWorkspacesController" />).
/// </summary>
internal static class TenantWorkspaceScopePreflight
{
    internal static async Task<(IActionResult? Problem, ScopeContext Scope)> RequireTenantAndWorkspaceAsync(
        ControllerBase controller,
        IScopeContextProvider scopeProvider,
        ITenantRepository tenantRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(controller);
        ArgumentNullException.ThrowIfNull(scopeProvider);
        ArgumentNullException.ThrowIfNull(tenantRepository);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        IActionResult? problem = await RequireTenantAndWorkspaceAsync(
            controller,
            scope,
            tenantRepository,
            cancellationToken).ConfigureAwait(false);

        return (problem, scope);
    }

    internal static async Task<IActionResult?> RequireTenantAndWorkspaceAsync(
        ControllerBase controller,
        ScopeContext scope,
        ITenantRepository tenantRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(controller);
        ArgumentNullException.ThrowIfNull(tenantRepository);

        TenantRecord? tenant = await tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return controller.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        bool workspaceExists =
            await WorkspaceExistsAsync(tenantRepository, scope.TenantId, scope.WorkspaceId, cancellationToken)
                .ConfigureAwait(false);

        if (!workspaceExists)
            return controller.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

        return null;
    }

    internal static async Task<bool> WorkspaceExistsAsync(
        ITenantRepository tenantRepository,
        Guid tenantId,
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        if (tenantRepository is IWorkspaceQueryTenantRepository workspaceQuery)
            return await workspaceQuery.WorkspaceExistsAsync(tenantId, workspaceId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await tenantRepository.ListWorkspacesAsync(tenantId, cancellationToken).ConfigureAwait(false);

        return workspaces.Any(workspace => workspace.WorkspaceId == workspaceId);
    }
}
