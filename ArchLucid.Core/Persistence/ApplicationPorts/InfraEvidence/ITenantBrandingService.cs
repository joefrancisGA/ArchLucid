using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ITenantBrandingService
{
    Task<ResolvedTenantBrandingProfile> GetBrandingProfileAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<string> GetCompanyDisplayNameAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<TenantBrandingLogo> GetLogoAsync(
        Guid tenantId,
        BrandingDisplayContext context,
        CancellationToken cancellationToken = default);

    Task<TenantBrandColors> GetBrandColorsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<BrandAssetReadResult?> GetBrandAssetAsync(
        Guid tenantId,
        Guid assetId,
        CancellationToken cancellationToken = default);

    Task<TenantBrandingSurfacePresentation> GetSurfacePresentationAsync(
        Guid tenantId,
        BrandingDisplayContext context,
        CancellationToken cancellationToken = default);
}
