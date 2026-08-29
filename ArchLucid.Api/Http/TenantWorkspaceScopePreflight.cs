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
    private const string ResourceNotFoundMessage = "Resource not found.";

    // Ghost tenant/workspace JWT scope returns the same 404 detail intentionally (parity with
    // TenantWorkspacesController; avoids distinguishing missing tenant vs missing workspace).

    internal static async Task<TenantWorkspaceScopePreflightResult> RequireTenantAndWorkspaceAsync(
        ControllerBase controller,
        IScopeContextProvider scopeProvider,
        ITenantRepository tenantRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(controller);
        ArgumentNullException.ThrowIfNull(scopeProvider);
        ArgumentNullException.ThrowIfNull(tenantRepository);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        bool workspaceExists = await tenantRepository
            .WorkspaceExistsAsync(scope.TenantId, scope.WorkspaceId, cancellationToken)
            .ConfigureAwait(false);

        if (!workspaceExists)
        {
            return TenantWorkspaceScopePreflightResult.Failure(
                controller.NotFoundProblem(ResourceNotFoundMessage, ProblemTypes.ResourceNotFound),
                scope);
        }

        return TenantWorkspaceScopePreflightResult.Success(scope);
    }
}
