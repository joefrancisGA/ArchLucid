using ArchLucid.Core.Scoping;

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
