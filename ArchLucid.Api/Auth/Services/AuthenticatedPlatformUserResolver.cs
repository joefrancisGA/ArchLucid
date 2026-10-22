using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Auth.Services;

public interface IAuthenticatedPlatformUserResolver
{
    Task<PlatformUserRecord?> ResolveAsync(ClaimsPrincipal principal, CancellationToken cancellationToken);
}

/// <summary>Resolves the canonical platform user from JWT claims (email OTP sub or future external identity keys).</summary>
public sealed class AuthenticatedPlatformUserResolver(IPlatformUserRepository platformUsers) : IAuthenticatedPlatformUserResolver
{
    private readonly IPlatformUserRepository _platformUsers =
        platformUsers ?? throw new ArgumentNullException(nameof(platformUsers));

    public async Task<PlatformUserRecord?> ResolveAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(principal);

        string? sub = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (Guid.TryParse(sub, out Guid platformUserId))
        {
            PlatformUserRecord? byId =
                await _platformUsers.GetByIdAsync(platformUserId, cancellationToken).ConfigureAwait(false);

            if (byId is not null)
            {
                return byId;
            }
        }

        return null;
    }
}
