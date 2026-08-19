using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Contracts.Admin;

using Microsoft.IdentityModel.Tokens;

namespace ArchLucid.Api.Services.Admin;

/// <inheritdoc cref="ITokenClaimsDiagnosticService" />
public sealed class TokenClaimsDiagnosticService(
    ArchLucidRoleClaimsTransformation roleClaimsTransformation) : ITokenClaimsDiagnosticService
{
    private const string SignatureNotValidatedWarning =
        "Token signature, issuer, and audience were not validated.";

    private readonly ArchLucidRoleClaimsTransformation _roleClaimsTransformation =
        roleClaimsTransformation ?? throw new ArgumentNullException(nameof(roleClaimsTransformation));

    /// <inheritdoc />
    public async Task<AdminTokenClaimsDiagnosticResponse> DiagnoseAsync(
        string bearerToken,
        CancellationToken cancellationToken)
    {
        List<string> warnings = [SignatureNotValidatedWarning];

        string normalizedToken = NormalizeBearerToken(bearerToken);

        if (string.IsNullOrWhiteSpace(normalizedToken))
        {
            warnings.Add("Bearer token is required.");

            return new AdminTokenClaimsDiagnosticResponse
            {
                Warnings = warnings,
            };
        }

        if (!TryCreatePrincipal(normalizedToken, out ClaimsPrincipal principal, out string? parseWarning))
        {
            if (!string.IsNullOrWhiteSpace(parseWarning))
                warnings.Add(parseWarning);

            return new AdminTokenClaimsDiagnosticResponse
            {
                Warnings = warnings,
            };
        }

        AppendExpiryWarnings(principal, warnings);

        HashSet<string> rawRoles = ArchLucidRoleClaimExtractor.ExtractRoleValues(principal);

        List<string> resolvedRoles = rawRoles
            .Where(static role => ArchLucidRoleClaimExtractor.KnownArchLucidMappedRoles.Contains(role))
            .OrderBy(static role => role, StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<string> unmappedValues = rawRoles
            .Where(static role => !ArchLucidRoleClaimExtractor.KnownArchLucidMappedRoles.Contains(role))
            .OrderBy(static role => role, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (resolvedRoles.Count == 0)
            warnings.Add("No recognized ArchLucid role claims were found in the token.");

        ClaimsPrincipal transformed =
            await _roleClaimsTransformation.TransformAsync(principal).ConfigureAwait(false);

        bool mappedPermissions = transformed.Claims.Any(static claim =>
            string.Equals(claim.Type, "permission", StringComparison.OrdinalIgnoreCase));

        if (resolvedRoles.Count > 0 && !mappedPermissions)
        {
            warnings.Add(
                "Recognized role claims did not map to ArchLucid permissions; authenticated requests may return 403.");
        }

        if (unmappedValues.Count > 0)
            warnings.Add("One or more role claim values do not match a known ArchLucid role.");

        return new AdminTokenClaimsDiagnosticResponse
        {
            ResolvedRoles = resolvedRoles,
            UnmappedValues = unmappedValues,
            Warnings = warnings,
        };
    }

    private static string NormalizeBearerToken(string bearerToken)
    {
        if (string.IsNullOrWhiteSpace(bearerToken))
            return string.Empty;

        string trimmed = bearerToken.Trim();

        if (trimmed.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return trimmed["Bearer ".Length..].Trim();

        return trimmed;
    }

    private static bool TryCreatePrincipal(
        string jwt,
        out ClaimsPrincipal principal,
        out string? warning)
    {
        principal = null!;
        warning = null;

        try
        {
            JwtSecurityTokenHandler handler = new();
            JwtSecurityToken token = handler.ReadJwtToken(jwt);
            ClaimsIdentity identity = new(token.Claims, authenticationType: "Bearer");
            principal = new ClaimsPrincipal(identity);

            return true;
        }
        catch (ArgumentException)
        {
            warning = "Token is not a readable JWT payload.";

            return false;
        }
        catch (FormatException)
        {
            warning = "Token is not a readable JWT payload.";

            return false;
        }
        catch (SecurityTokenException)
        {
            warning = "Token is not a readable JWT payload.";

            return false;
        }
    }

    private static void AppendExpiryWarnings(ClaimsPrincipal principal, List<string> warnings)
    {
        string? expRaw = principal.FindFirst("exp")?.Value
            ?? principal.FindFirst(JwtRegisteredClaimNames.Exp)?.Value;

        if (!long.TryParse(expRaw, out long expUnix))
            return;

        DateTimeOffset expires = DateTimeOffset.FromUnixTimeSeconds(expUnix);

        if (expires <= TimeProvider.System.GetUtcNow())
            warnings.Add("Token exp claim is in the past.");
    }
}
