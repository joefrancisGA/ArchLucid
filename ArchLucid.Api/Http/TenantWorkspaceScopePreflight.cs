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

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await tenantRepository.ListWorkspacesAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        TenantWorkspaceListItem? currentWorkspace =
            workspaces.FirstOrDefault(workspace => workspace.WorkspaceId == scope.WorkspaceId);

        if (currentWorkspace is null)
            return controller.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

        return null;
    }
}
