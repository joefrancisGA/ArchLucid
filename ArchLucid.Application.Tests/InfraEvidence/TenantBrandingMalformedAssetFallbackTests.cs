using System.Text;

using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.ArtifactSynthesis.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

/// <summary>BR-09: malformed or missing brand assets must not 500 export surfaces.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
[Trait("BrandingShipGate", "BR-09")]
public sealed class TenantBrandingMalformedAssetFallbackTests
{
    private static readonly Guid TenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private static readonly byte[] MinimalPng =
        Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    private const string SampleMermaid = "flowchart TD\n  A --> B";

    [Fact]
    public async Task ResolveForExportAsync_with_missing_logo_bytes_does_not_throw()
    {
        Mock<ITenantBrandingService> branding = CreateActiveProfileWithoutLogoBytes("Fallback Co");

        TenantReportBrandingApplyHelper helper = new(branding.Object);

        TenantReportBrandingForExport? result = await helper.ResolveForExportAsync(
            TenantId,
            BrandingDisplayContext.ReportCover,
            apiBaseForLinks: null,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.CompanyDisplayName.Should().Be("Fallback Co");
        result.LogoBytes.Should().BeNull();
        result.LogoChecksumSha256Hex.Should().BeNull();
    }

    [Fact]
    public async Task WrapRenderedPngForExportAsync_without_logo_checksum_returns_original_png()
    {
        Mock<ITenantBrandingService> branding = CreateActiveProfileWithoutLogoBytes("Fallback Co");

        BrandedDiagramExportService service = new(
            branding.Object,
            new BrandedDiagramExportComposer());

        byte[]? wrapped = await service.WrapRenderedPngForExportAsync(
            TenantId,
            MinimalPng,
            BrandingDisplayContext.ArchitectureDiagram,
            CancellationToken.None);

        wrapped.Should().BeEquivalentTo(MinimalPng);
    }

    [Fact]
    public void BrandAssetUploadValidator_rejects_malicious_svg_without_executing()
    {
        byte[] maliciousSvg = Encoding.UTF8.GetBytes(
            "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>");

        BrandAssetValidationResult result = BrandAssetUploadValidator.Validate(maliciousSvg, "evil.svg");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("script");
    }

    [Fact]
    public void BrandAssetUploadValidator_rejects_truncated_png_magic_bytes()
    {
        byte[] truncated = [0x89, 0x50, 0x4E];

        BrandAssetValidationResult result = BrandAssetUploadValidator.Validate(truncated, "broken.png");

        result.Succeeded.Should().BeFalse();
    }

    [Fact]
    public async Task DecorateMermaidSourceForExportAsync_with_empty_company_name_leaves_graph_unchanged()
    {
        Mock<ITenantBrandingService> branding = new();

        branding
            .Setup(b => b.GetBrandingProfileAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ResolvedTenantBrandingProfile
            {
                TenantId = TenantId,
                IsProductBrand = false,
                CompanyDisplayName = "   ",
                SourceProfileStatus = BrandingProfileStatus.Active,
            });

        BrandedDiagramExportService service = new(
            branding.Object,
            new BrandedDiagramExportComposer());

        string result = await service.DecorateMermaidSourceForExportAsync(
            TenantId,
            SampleMermaid,
            BrandingDisplayContext.MermaidDiagram,
            CancellationToken.None);

        result.Should().Be(SampleMermaid);
    }

    private static Mock<ITenantBrandingService> CreateActiveProfileWithoutLogoBytes(string companyName)
    {
        Mock<ITenantBrandingService> branding = new();

        branding
            .Setup(b => b.GetBrandingProfileAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ResolvedTenantBrandingProfile
            {
                TenantId = TenantId,
                IsProductBrand = false,
                CompanyDisplayName = companyName,
                SourceProfileStatus = BrandingProfileStatus.Active,
            });

        branding
            .Setup(b => b.GetSurfacePresentationAsync(TenantId, It.IsAny<BrandingDisplayContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, BrandingDisplayContext context, CancellationToken _) =>
                TenantBrandingDisplayContextPolicy.Resolve(
                    context,
                    new ResolvedTenantBrandingProfile
                    {
                        TenantId = TenantId,
                        IsProductBrand = false,
                        CompanyDisplayName = companyName,
                    },
                    new TenantBrandingLogo { IsProductBrand = false }));

        branding
            .Setup(b => b.GetLogoAsync(TenantId, It.IsAny<BrandingDisplayContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBrandingLogo { IsProductBrand = false });

        return branding;
    }
}
