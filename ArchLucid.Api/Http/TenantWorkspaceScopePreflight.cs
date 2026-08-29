using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Http;

/// <summary>
///     Outcome of <see cref="TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync" />.
/// </summary>
internal readonly struct TenantWorkspaceScopePreflightResult
{
    private TenantWorkspaceScopePreflightResult(IActionResult? problem, ScopeContext scope)
    {
        Problem = problem;
        Scope = scope;
    }

    public IActionResult? Problem { get; }

    public ScopeContext Scope { get; }

    public bool Succeeded => Problem is null;

    public static TenantWorkspaceScopePreflightResult Success(ScopeContext scope) =>
        new(null, scope);

    public static TenantWorkspaceScopePreflightResult Failure(IActionResult problem, ScopeContext scope) =>
        new(problem, scope);
}

/// <summary>
///     Shared tenant + workspace existence checks for scope-bound API reads (parity with
///     <see cref="Controllers.Tenancy.TenantWorkspacesController" />).
/// </summary>
internal static class TenantWorkspaceScopePreflight
{
    private const string ResourceNotFoundMessage = "Resource not found.";

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
        TenantRecord? tenant = await tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
        {
            return TenantWorkspaceScopePreflightResult.Failure(
                controller.NotFoundProblem(ResourceNotFoundMessage, ProblemTypes.ResourceNotFound),
                scope);
        }

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
