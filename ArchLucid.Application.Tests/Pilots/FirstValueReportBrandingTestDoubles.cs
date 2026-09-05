using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

internal static class FirstValueReportBrandingTestDoubles
{
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
