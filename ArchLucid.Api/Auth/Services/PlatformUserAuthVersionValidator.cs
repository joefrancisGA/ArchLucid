using ArchLucid.Core.Identity;

using Microsoft.Extensions.Options;

using ArchLucid.Core.Configuration;

namespace ArchLucid.Api.Auth.Services;

/// <summary>Validates <see cref="PlatformIdentityClaimTypes.AuthVersion" /> on ArchLucid-issued JWTs.</summary>
public sealed class PlatformUserAuthVersionValidator(
    IPlatformUserRepository users,
    IOptions<TrialAuthOptions> trialOptions)
{
    private readonly IPlatformUserRepository _users =
        users ?? throw new ArgumentNullException(nameof(users));

    private readonly TrialAuthOptions _trialOptions =
        trialOptions?.Value ?? throw new ArgumentNullException(nameof(trialOptions));

    public async Task<bool> ValidateAsync(string? issuer, string? subject, string? authVersionClaim, CancellationToken cancellationToken)
    {
        string localIssuer = _trialOptions.LocalIdentity.JwtIssuer.Trim();

        if (string.IsNullOrEmpty(localIssuer) || !string.Equals(issuer, localIssuer, StringComparison.Ordinal))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(authVersionClaim))
        {
            return true;
        }

        if (!Guid.TryParse(subject, out Guid userId))
        {
            return false;
        }

        if (!Guid.TryParse(authVersionClaim, out Guid tokenAuthVersion))
        {
            return false;
        }

        PlatformUserRecord? user = await _users.GetByIdAsync(userId, cancellationToken).ConfigureAwait(false);

        if (user is null)
        {
            return false;
        }

        return user.AuthVersion == tokenAuthVersion;
    }
}
