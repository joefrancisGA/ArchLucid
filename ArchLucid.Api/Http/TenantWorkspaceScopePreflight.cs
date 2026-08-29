using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Http;

/// <summary>
///     Shared tenant + workspace existence checks for scope-bound API reads (parity with
///     <see cref="Controllers.Tenancy.TenantWorkspacesController" />).
/// </summary>
internal static class TenantWorkspaceScopePreflight
{
    internal static async Task<IActionResult?> RequireTenantAndWorkspaceAsync(
        ControllerBase controller,
        IScopeContextProvider scopeProvider,
        ITenantRepository tenantRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(controller);
        ArgumentNullException.ThrowIfNull(scopeProvider);
        ArgumentNullException.ThrowIfNull(tenantRepository);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return controller.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        TenantWorkspaceListItem? currentWorkspace =
            await tenantRepository.GetWorkspaceByIdAsync(scope.TenantId, scope.WorkspaceId, cancellationToken).ConfigureAwait(false);

        if (currentWorkspace is null)
            return controller.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound);

        return null;
    }
}
