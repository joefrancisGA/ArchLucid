using System.Security.Claims;

using ArchLucid.Application.Common;
using ArchLucid.Core.Authorization;

namespace ArchLucid.Host.Core.Auth.Services;

/// <inheritdoc cref="ICallerRoleAccessor" />
public sealed class HttpCallerRoleAccessor(IHttpContextAccessor httpContextAccessor) : ICallerRoleAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor =
        httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

    /// <inheritdoc />
    public bool IsInRole(string role)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(role);

        ClaimsPrincipal? user = _httpContextAccessor.HttpContext?.User;

        return user?.IsInRole(role) == true;
    }

    /// <inheritdoc />
    public bool IsTenantAdministrator() =>
        IsInRole(ArchLucidRoles.Admin) || IsInRole(ArchLucidRoles.WorkspaceAdmin);
}
