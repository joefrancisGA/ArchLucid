using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Branding;

/// <summary>Hard and soft validation gates before a tenant branding profile can be activated.</summary>
public static class TenantBrandingActivationValidator
{
    public const int MinReportLogoWidthPx = 120;

    public const int MinReportLogoHeightPx = 32;

    public const double MaxLogoAspectRatio = 5.0d;

    public static TenantBrandingValidationResult Validate(
        TenantBrandingProfileRecord draft,
        IReadOnlyDictionary<Guid, BrandAssetRecord> assetsById)
    {
        ArgumentNullException.ThrowIfNull(draft);
        ArgumentNullException.ThrowIfNull(assetsById);

        List<TenantBrandingValidationIssue> issues = [];

        if (string.IsNullOrWhiteSpace(draft.CompanyDisplayName))
        {
            issues.Add(TenantBrandingValidationIssue.Error(
                "companyDisplayNameRequired",
                "Company display name is required before activation."));
        }

        if (draft.LogoPrimaryAssetId is not Guid primaryLogoId || primaryLogoId == Guid.Empty)
        {
            issues.Add(TenantBrandingValidationIssue.Error(
                "primaryLogoRequired",
                "A primary logo asset is required before activation."));
        }
        else if (assetsById.TryGetValue(primaryLogoId, out BrandAssetRecord? primaryLogo))
        {
            ValidatePrimaryLogo(primaryLogo, issues);
        }
        else
        {
            issues.Add(TenantBrandingValidationIssue.Error(
                "primaryLogoMissing",
                "The selected primary logo asset could not be found."));
        }

        ValidateColors(draft, issues);
        ValidateOptionalLogoVariants(draft, assetsById, issues);

        bool canActivate = issues.All(issue => issue.Severity != TenantBrandingValidationSeverity.Error);

        return new TenantBrandingValidationResult(canActivate, issues);
    }

    private static void ValidatePrimaryLogo(BrandAssetRecord primaryLogo, List<TenantBrandingValidationIssue> issues)
    {
        if (primaryLogo.Width is int width
            && primaryLogo.Height is int height
            && width > 0
            && height > 0)
        {
            if (width < MinReportLogoWidthPx || height < MinReportLogoHeightPx)
            {
                issues.Add(TenantBrandingValidationIssue.Warning(
                    "logoTooSmallForReports",
                    $"Primary logo is {width}×{height}px. Reports recommend at least {MinReportLogoWidthPx}×{MinReportLogoHeightPx}px."));
            }

            double aspectRatio = Math.Max(width, height) / (double)Math.Min(width, height);

            if (aspectRatio > MaxLogoAspectRatio)
            {
                issues.Add(TenantBrandingValidationIssue.Warning(
                    "logoExtremeAspectRatio",
                    "Primary logo has an extreme aspect ratio and may crop poorly in headers."));
            }
        }
        else
        {
            issues.Add(TenantBrandingValidationIssue.Warning(
                "logoDimensionsUnknown",
                "Primary logo dimensions could not be verified for report sizing."));
        }

        if (!IsSupportedLogoMimeType(primaryLogo.MimeType))
        {
            issues.Add(TenantBrandingValidationIssue.Error(
                "unsupportedLogoFormat",
                "Primary logo must be SVG, PNG, or JPEG."));
        }
    }

    private static void ValidateColors(TenantBrandingProfileRecord draft, List<TenantBrandingValidationIssue> issues)
    {
        if (!IsValidHexColor(draft.PrimaryColor))
        {
            issues.Add(TenantBrandingValidationIssue.Error(
                "primaryColorInvalid",
                "Primary color must be a valid hex color."));
        }

        if (!IsValidHexColor(draft.BackgroundColor) || !IsValidHexColor(draft.ForegroundColor))
        {
            issues.Add(TenantBrandingValidationIssue.Error(
                "surfaceColorsInvalid",
                "Background and foreground colors must be valid hex colors."));
        }
        else if (!TenantBrandContrastValidator.MeetsWcagAaMinimum(draft.ForegroundColor, draft.BackgroundColor))
        {
            issues.Add(TenantBrandingValidationIssue.Error(
                "poorContrast",
                "Foreground and background colors do not meet WCAG AA contrast (4.5:1)."));
        }
    }

    private static void ValidateOptionalLogoVariants(
        TenantBrandingProfileRecord draft,
        IReadOnlyDictionary<Guid, BrandAssetRecord> assetsById,
        List<TenantBrandingValidationIssue> issues)
    {
        if (draft.LogoDarkAssetId is null || draft.LogoDarkAssetId == Guid.Empty)
        {
            issues.Add(TenantBrandingValidationIssue.Warning(
                "missingDarkLogoVariant",
                "No dark-theme logo variant is configured."));
        }

        if (draft.LogoLightAssetId is null || draft.LogoLightAssetId == Guid.Empty)
        {
            issues.Add(TenantBrandingValidationIssue.Warning(
                "missingLightLogoVariant",
                "No light-theme logo variant is configured."));
        }

        foreach (Guid? assetId in new[]
                 {
                     draft.LogoDarkAssetId,
                     draft.LogoLightAssetId,
                     draft.LogoReportCoverAssetId,
                 })
        {
            if (assetId is not Guid id || id == Guid.Empty)
                continue;

            if (!assetsById.TryGetValue(id, out BrandAssetRecord? asset))
                continue;

            if (!IsSupportedLogoMimeType(asset.MimeType))
            {
                issues.Add(TenantBrandingValidationIssue.Warning(
                    "unsupportedOptionalLogoFormat",
                    $"Logo asset {asset.OriginalFileName} uses an unsupported format."));
            }
        }
    }

    private static bool IsSupportedLogoMimeType(string mimeType) =>
        mimeType.Equals("image/svg+xml", StringComparison.OrdinalIgnoreCase)
        || mimeType.Equals("image/png", StringComparison.OrdinalIgnoreCase)
        || mimeType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase);

    private static bool IsValidHexColor(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return false;

        string trimmed = raw.Trim();

        if (!trimmed.StartsWith('#'))
            trimmed = $"#{trimmed}";

        if (trimmed.Length is not (7 or 9))
            return false;

        for (int i = 1; i < trimmed.Length; i++)
        {
            if (!Uri.IsHexDigit(trimmed[i]))
                return false;
        }

        return true;
    }
}

public enum TenantBrandingValidationSeverity
{
    Warning = 0,
    Error = 1,
}

public sealed class TenantBrandingValidationIssue
{
    public required string Code
    {
        get;
        init;
    }

    public required TenantBrandingValidationSeverity Severity
    {
        get;
        init;
    }

    public required string Message
    {
        get;
        init;
    }

    public static TenantBrandingValidationIssue Error(string code, string message) =>
        new() { Code = code, Severity = TenantBrandingValidationSeverity.Error, Message = message };

    public static TenantBrandingValidationIssue Warning(string code, string message) =>
        new() { Code = code, Severity = TenantBrandingValidationSeverity.Warning, Message = message };
}

public sealed class TenantBrandingValidationResult
{
    public TenantBrandingValidationResult(bool canActivate, IReadOnlyList<TenantBrandingValidationIssue> issues)
    {
        CanActivate = canActivate;
        Issues = issues;
    }

    public bool CanActivate
    {
        get;
    }

    public IReadOnlyList<TenantBrandingValidationIssue> Issues
    {
        get;
    }
}
