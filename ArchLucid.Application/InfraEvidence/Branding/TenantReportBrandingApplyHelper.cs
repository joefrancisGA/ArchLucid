using System.Security.Cryptography;
using System.Text;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Branding;

/// <inheritdoc cref="ITenantReportBrandingApplyHelper" />
public sealed class TenantReportBrandingApplyHelper(ITenantBrandingService tenantBrandingService)
    : ITenantReportBrandingApplyHelper
{
    private readonly ITenantBrandingService _tenantBrandingService =
        tenantBrandingService ?? throw new ArgumentNullException(nameof(tenantBrandingService));

    public async Task<TenantReportBrandingForExport?> ResolveForExportAsync(
        Guid tenantId,
        BrandingDisplayContext context,
        string? apiBaseForLinks,
        CancellationToken cancellationToken = default)
    {
        ResolvedTenantBrandingProfile profile =
            await _tenantBrandingService.GetBrandingProfileAsync(tenantId, cancellationToken);

        if (profile.IsProductBrand)
            return null;

        TenantBrandingSurfacePresentation presentation =
            await _tenantBrandingService.GetSurfacePresentationAsync(tenantId, context, cancellationToken);

        if (!presentation.UsesTenantVisualBrand)
            return null;

        TenantBrandingLogo logo = presentation.Logo;
        string? logoUrl = logo.HttpsUrl;

        if (logoUrl is null && logo.AssetId is Guid assetId && !string.IsNullOrWhiteSpace(apiBaseForLinks))
        {
            string baseUrl = apiBaseForLinks.Trim().TrimEnd('/');
            logoUrl = $"{baseUrl}/v1/infra-evidence/branding/assets/{assetId:D}/content";
        }

        TenantFirstValueReportBrandingForExport? sanitized =
            FirstValueReportBrandingSanitizer.TryBuildExportModel(logoUrl, profile.CompanyDisplayName);

        byte[]? logoBytes = logo.AssetBytes is { Length: > 0 } bytes ? bytes : null;
        string? logoChecksumHex = TryResolveLogoChecksumHex(logoBytes, logoUrl);

        if (sanitized is null && logoBytes is null && logoChecksumHex is null)
            return null;

        return new TenantReportBrandingForExport
        {
            CompanyDisplayName = sanitized?.CompanyDisplayName ?? SanitizeOptionalText(profile.CompanyDisplayName),
            LogoHttpsUrl = sanitized?.LogoHttpsUrl,
            LogoBytes = logoBytes,
            LogoChecksumSha256Hex = logoChecksumHex,
            Tagline = SanitizeOptionalText(profile.Tagline),
            WebsiteUrl = SanitizeHttpsUrl(profile.WebsiteUrl),
            SupportUrl = SanitizeHttpsUrl(profile.SupportUrl),
            ShowPoweredByArchLucid = presentation.ShowPoweredByArchLucid,
            UsesTenantVisualBrand = true,
        };
    }

    public ConsultingDocxExportBranding MergeConsultingDocxBranding(
        TenantReportBrandingForExport? tenantBranding,
        ConsultingDocxExportBranding? callerBranding)
    {
        if (tenantBranding is null)
            return callerBranding ?? new ConsultingDocxExportBranding(null, null, null);

        string? firm = callerBranding?.FirmDisplayName?.Trim();

        if (string.IsNullOrWhiteSpace(firm))
            firm = tenantBranding.CompanyDisplayName;

        string? engagement = callerBranding?.EngagementTitle?.Trim();

        byte[]? logoBytes = callerBranding?.LogoBytes is { Length: > 0 } callerLogo
            ? callerLogo
            : tenantBranding.LogoBytes;

        return new ConsultingDocxExportBranding(firm, engagement, logoBytes);
    }

    private static string? TryResolveLogoChecksumHex(byte[]? logoBytes, string? logoUrl)
    {
        if (logoBytes is { Length: > 0 })
            return Convert.ToHexString(SHA256.HashData(logoBytes));

        if (!string.IsNullOrWhiteSpace(logoUrl))
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(logoUrl.Trim())));

        return null;
    }

    private static string? SanitizeOptionalText(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        string trimmed = raw.Trim();

        return trimmed.Length == 0 ? null : trimmed;
    }

    private static string? SanitizeHttpsUrl(string? raw) =>
        FirstValueReportBrandingSanitizer.TryBuildExportModel(raw, null)?.LogoHttpsUrl;
}
