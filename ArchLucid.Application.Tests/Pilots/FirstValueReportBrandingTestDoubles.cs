using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

internal static class FirstValueReportBrandingTestDoubles
{
    private static readonly byte[] TenantALogoBytes = [0x41, 0x2D, 0x4C, 0x4F, 0x47, 0x4F];
    private static readonly byte[] TenantBLogoBytes = [0x42, 0x2D, 0x4C, 0x4F, 0x47, 0x4F];

    public static ITenantReportBrandingApplyHelper CreateApplyHelper(ITenantBrandingService brandingService) =>
        new TenantReportBrandingApplyHelper(brandingService);

    public static Mock<ITenantBrandingService> CreateActiveTenantBrandService(
        string companyDisplayName = "Fabrikam Holdings",
        byte[]? logoBytes = null,
        string? logoHttpsUrl = null)
    {
        Mock<ITenantBrandingService> branding = new();
        byte[]? logo = logoBytes;
        string? httpsUrl = logoHttpsUrl;

        branding
            .Setup(b => b.GetBrandingProfileAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid tenantId, CancellationToken _) => new ResolvedTenantBrandingProfile
            {
                TenantId = tenantId,
                IsProductBrand = false,
                CompanyDisplayName = companyDisplayName,
                SourceProfileStatus = BrandingProfileStatus.Active,
            });

        branding
            .Setup(b => b.GetLogoAsync(It.IsAny<Guid>(), It.IsAny<BrandingDisplayContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBrandingLogo
            {
                IsProductBrand = false,
                AssetBytes = logo,
                HttpsUrl = httpsUrl,
                MimeType = "image/png",
            });

        branding
            .Setup(b => b.GetSurfacePresentationAsync(It.IsAny<Guid>(), It.IsAny<BrandingDisplayContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid tenantId, BrandingDisplayContext context, CancellationToken _) =>
            {
                ResolvedTenantBrandingProfile profile = new()
                {
                    TenantId = tenantId,
                    IsProductBrand = false,
                    CompanyDisplayName = companyDisplayName,
                };

                return TenantBrandingDisplayContextPolicy.Resolve(
                    context,
                    profile,
                    new TenantBrandingLogo
                    {
                        IsProductBrand = false,
                        AssetBytes = logo,
                        HttpsUrl = httpsUrl,
                    });
            });

        return branding;
    }

    public static byte[] TenantALogo => TenantALogoBytes;

    public static byte[] TenantBLogo => TenantBLogoBytes;
    public static Mock<ITenantBrandingService> CreateProductBrandService()
    {
        Mock<ITenantBrandingService> branding = new();

        branding
            .Setup(b => b.GetBrandingProfileAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid tenantId, CancellationToken _) => new ResolvedTenantBrandingProfile
            {
                TenantId = tenantId,
                IsProductBrand = true,
                CompanyDisplayName = ProductBrandingDefaults.CompanyDisplayName,
            });

        branding
            .Setup(b => b.GetLogoAsync(It.IsAny<Guid>(), It.IsAny<BrandingDisplayContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBrandingLogo { IsProductBrand = true });

        return branding;
    }
}
