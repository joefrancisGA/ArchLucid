using Microsoft.AspNetCore.DataProtection;

namespace ArchLucid.Application.Notifications.Email;

/// <inheritdoc cref="IExecDigestSponsorDeepLinkTokenFactory" />
/// <remarks>Uses ASP.NET Core data protection; API and worker hosts must share key material in multi-process deployments.</remarks>
public sealed class ExecDigestSponsorDeepLinkTokenFactory(IDataProtectionProvider dataProtectionProvider)
    : IExecDigestSponsorDeepLinkTokenFactory
{
    private const string Purpose = "ArchLucid.ExecDigest.SponsorDeepLink.v1";
    private const char DashboardMarker = 'D';
    private const char RunCollateralMarker = 'R';

    private readonly IDataProtectionProvider _dataProtectionProvider =
        dataProtectionProvider ?? throw new ArgumentNullException(nameof(dataProtectionProvider));

    /// <inheritdoc />
    public string CreateDashboardToken(Guid tenantId, string isoWeekIdempotencyKey)
    {
        ValidateTenantAndIsoWeek(tenantId, isoWeekIdempotencyKey);
        string payload = $"{DashboardMarker}|{tenantId:N}|{NormalizeIsoWeekKey(isoWeekIdempotencyKey)}";
        return Protect(payload);
    }

    /// <inheritdoc />
    public string CreateRunCollateralToken(Guid tenantId, string runIdHex, string isoWeekIdempotencyKey)
    {
        ValidateTenantAndIsoWeek(tenantId, isoWeekIdempotencyKey);
        string normalizedRunIdHex = NormalizeRunIdHex(runIdHex);
        string payload = $"{RunCollateralMarker}|{tenantId:N}|{normalizedRunIdHex}|{NormalizeIsoWeekKey(isoWeekIdempotencyKey)}";
        return Protect(payload);
    }

    /// <inheritdoc />
    public bool TryParse(string token, out ExecDigestSponsorDeepLinkClaims claims)
    {
        ArgumentNullException.ThrowIfNull(token);
        claims = null!;
        if (string.IsNullOrWhiteSpace(token))
            return false;

        try
        {
            string raw = Unprotect(token);
            string[] parts = raw.Split('|');
            if (parts.Length < 3)
                return false;

            if (!Guid.TryParseExact(parts[1], "N", out Guid tenantId) || tenantId == Guid.Empty)
                return false;

            string isoWeekKey = NormalizeIsoWeekKey(parts[^1]);
            if (parts[0].Length != 1)
                return false;

            char marker = parts[0][0];
            switch (marker)
            {
                case DashboardMarker when parts.Length == 3:
                    claims = new ExecDigestSponsorDeepLinkClaims(
                        ExecDigestSponsorDeepLinkTarget.Dashboard,
                        tenantId,
                        isoWeekKey,
                        null);
                    return true;
                case RunCollateralMarker when parts.Length == 4:
                    string runIdHex = NormalizeRunIdHex(parts[2]);
                    claims = new ExecDigestSponsorDeepLinkClaims(
                        ExecDigestSponsorDeepLinkTarget.RunCollateral,
                        tenantId,
                        isoWeekKey,
                        runIdHex);
                    return true;
                default:
                    return false;
            }
        }
        catch
        {
            return false;
        }
    }

    private string Protect(string payload)
    {
        IDataProtector protector = _dataProtectionProvider.CreateProtector(Purpose);
        return protector.Protect(payload);
    }

    private string Unprotect(string token)
    {
        IDataProtector protector = _dataProtectionProvider.CreateProtector(Purpose);
        return protector.Unprotect(token);
    }

    private static void ValidateTenantAndIsoWeek(Guid tenantId, string isoWeekIdempotencyKey)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(isoWeekIdempotencyKey))
            throw new ArgumentException("ISO week key is required.", nameof(isoWeekIdempotencyKey));

        NormalizeIsoWeekKey(isoWeekIdempotencyKey);
    }

    private static string NormalizeIsoWeekKey(string isoWeekIdempotencyKey)
    {
        string trimmed = isoWeekIdempotencyKey.Trim();
        if (trimmed.Length == 0)
            throw new ArgumentException("ISO week key is required.", nameof(isoWeekIdempotencyKey));

        return trimmed;
    }

    private static string NormalizeRunIdHex(string runIdHex)
    {
        if (string.IsNullOrWhiteSpace(runIdHex))
            throw new ArgumentException("Run id is required.", nameof(runIdHex));

        string normalized = runIdHex.Trim().Replace("-", string.Empty, StringComparison.Ordinal);
        if (normalized.Length != 32)
            throw new ArgumentException("Run id must be a 32-character hex string.", nameof(runIdHex));

        return normalized.ToUpperInvariant();
    }
}
