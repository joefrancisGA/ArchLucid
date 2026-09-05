using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.InfraEvidence.Branding;

public sealed class TenantBrandingService(
    ITenantBrandingProfileRepository brandingProfileRepository,
    ITenantFirstValueReportBrandingRepository legacyBrandingRepository,
    IBrandAssetService brandAssetService,
    TenantBrandingResolvedProfileCache resolvedProfileCache) : ITenantBrandingService
{
    public async Task<ResolvedTenantBrandingProfile> GetBrandingProfileAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        ResolvedTenantBrandingProfile cached = await GetOrLoadResolvedProfileAsync(tenantId, cancellationToken);
        return cached;
    }

    public async Task<string> GetCompanyDisplayNameAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        ResolvedTenantBrandingProfile profile = await GetBrandingProfileAsync(tenantId, cancellationToken);
        return profile.CompanyDisplayName;
    }

    public async Task<TenantBrandingLogo> GetLogoAsync(
        Guid tenantId,
        BrandingDisplayContext context,
        CancellationToken cancellationToken = default)
    {
        ResolvedTenantBrandingProfile profile = await GetBrandingProfileAsync(tenantId, cancellationToken);

        if (profile.IsProductBrand)
        {
            return new TenantBrandingLogo { IsProductBrand = true };
        }

        if (!string.IsNullOrWhiteSpace(profile.LegacyLogoHttpsUrl))
        {
            return new TenantBrandingLogo
            {
                IsProductBrand = false,
                HttpsUrl = profile.LegacyLogoHttpsUrl,
            };
        }

        Guid? assetId = TenantBrandingLogoAssetSelector.SelectAssetId(profile, context);

        if (assetId is null || assetId == Guid.Empty)
            return new TenantBrandingLogo { IsProductBrand = false };

        BrandAssetReadResult? asset = await GetBrandAssetAsync(tenantId, assetId.Value, cancellationToken);

        if (asset?.Succeeded != true || asset.Asset is null)
            return new TenantBrandingLogo { IsProductBrand = false };

        return new TenantBrandingLogo
        {
            IsProductBrand = false,
            AssetId = asset.Asset.AssetId,
            MimeType = asset.Asset.MimeType,
            AssetBytes = asset.AssetBytes,
        };
    }

    public async Task<TenantBrandColors> GetBrandColorsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        TenantBrandingProfileRecord? active =
            await brandingProfileRepository.TryGetActiveAsync(tenantId, cancellationToken);

        TenantBrandingProfileRecord? source = active
            ?? await brandingProfileRepository.TryGetDefaultAsync(tenantId, cancellationToken);

        if (source is null)
        {
            return new TenantBrandColors
            {
                IsProductBrand = true,
                Primary = ProductBrandingDefaults.PrimaryColor,
                Secondary = ProductBrandingDefaults.SecondaryColor,
                Accent = ProductBrandingDefaults.AccentColor,
                Background = ProductBrandingDefaults.BackgroundColor,
                Foreground = ProductBrandingDefaults.ForegroundColor,
            };
        }

        return new TenantBrandColors
        {
            IsProductBrand = false,
            Primary = source.PrimaryColor,
            Secondary = source.SecondaryColor,
            Accent = source.AccentColor,
            Background = source.BackgroundColor,
            Foreground = source.ForegroundColor,
        };
    }

    public async Task<BrandAssetReadResult?> GetBrandAssetAsync(
        Guid tenantId,
        Guid assetId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = new() { TenantId = tenantId };
        BrandAssetReadResult result = await brandAssetService.TryGetAssetAsync(scope, assetId, cancellationToken);
        return result.Succeeded ? result : null;
    }

    private async Task<ResolvedTenantBrandingProfile> GetOrLoadResolvedProfileAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (resolvedProfileCache.TryGet(tenantId, out ResolvedTenantBrandingProfile? cached) && cached is not null)
            return cached;

        TenantBrandingProfileRecord? active =
            await brandingProfileRepository.TryGetActiveAsync(tenantId, cancellationToken);

        TenantBrandingProfileRecord? defaultProfile =
            await brandingProfileRepository.TryGetDefaultAsync(tenantId, cancellationToken);

        TenantFirstValueReportBrandingRow? legacy =
            await legacyBrandingRepository.TryGetAsync(tenantId, cancellationToken);

        ResolvedTenantBrandingProfile resolved =
            TenantBrandingResolver.Resolve(tenantId, active, defaultProfile, legacy);

        resolvedProfileCache.Set(tenantId, resolved);
        return resolved;
    }
}
