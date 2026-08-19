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

        // Platform-user JWTs use Guid subjects. Opaque CI/test subjects are not stamp-checked.
        if (!Guid.TryParse(subject, out Guid userId))
        {
            return true;
        }

        // Fail closed for platform users: identity-removal rotation only works when the claim is present.
        if (string.IsNullOrWhiteSpace(authVersionClaim)
            || !Guid.TryParse(authVersionClaim, out Guid tokenAuthVersion))
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
