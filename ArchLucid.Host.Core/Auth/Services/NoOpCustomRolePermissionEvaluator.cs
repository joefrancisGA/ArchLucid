using ArchLucid.Application.Authorization;

namespace ArchLucid.Host.Core.Auth.Services;

/// <summary>
///     Default <see cref="ICustomRolePermissionEvaluator" /> when custom-role storage is not registered.
/// </summary>
public sealed class NoOpCustomRolePermissionEvaluator : ICustomRolePermissionEvaluator
{
    private static readonly IReadOnlyList<string> EmptyPermissions = Array.Empty<string>();

    /// <inheritdoc />
    public Task<IReadOnlyList<string>> GetEffectivePermissionsAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = userId;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(EmptyPermissions);
    }
}
