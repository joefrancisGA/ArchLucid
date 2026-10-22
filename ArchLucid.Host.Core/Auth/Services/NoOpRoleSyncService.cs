using System.Security.Claims;

namespace ArchLucid.Host.Core.Auth.Services;

/// <summary>
///     Default <see cref="IRoleSyncService" /> when SCIM directory integration is not registered: leaves bearer role
///     claims unchanged (JWT / Entra remain authoritative).
/// </summary>
public sealed class NoOpRoleSyncService : IRoleSyncService
{
    /// <inheritdoc />
    public Task ApplyEntraJwtAndDirectoryOverridesAsync(ClaimsPrincipal bearerPrincipal, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(bearerPrincipal);

        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }
}
