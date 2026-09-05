using System.Security.Cryptography;

using ArchLucid.ArtifactSynthesis.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Branding;

/// <inheritdoc cref="IBrandedDiagramExportService" />
public sealed class BrandedDiagramExportService(
    ITenantBrandingService tenantBrandingService,
    IBrandedDiagramExportComposer brandedDiagramExportComposer) : IBrandedDiagramExportService
{
    private readonly ITenantBrandingService _tenantBrandingService =
        tenantBrandingService ?? throw new ArgumentNullException(nameof(tenantBrandingService));

    private readonly IBrandedDiagramExportComposer _brandedDiagramExportComposer =
        brandedDiagramExportComposer ?? throw new ArgumentNullException(nameof(brandedDiagramExportComposer));

    public async Task<string> DecorateMermaidSourceForExportAsync(
        Guid tenantId,
        string mermaidSource,
        BrandingDisplayContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(mermaidSource);

        ResolvedTenantBrandingProfile profile =
            await _tenantBrandingService.GetBrandingProfileAsync(tenantId, cancellationToken);

        if (profile.IsProductBrand || !TenantBrandingDisplayContextPolicy.UsesTenantVisualBrand(context))
            return mermaidSource;

        return _brandedDiagramExportComposer.DecorateMermaidSource(mermaidSource, profile.CompanyDisplayName);
    }

    public async Task<byte[]?> WrapRenderedPngForExportAsync(
        Guid tenantId,
        byte[]? renderedPng,
        BrandingDisplayContext context,
        CancellationToken cancellationToken = default)
    {
        if (renderedPng is null || renderedPng.Length == 0)
            return renderedPng;

        ResolvedTenantBrandingProfile profile =
            await _tenantBrandingService.GetBrandingProfileAsync(tenantId, cancellationToken);

        if (profile.IsProductBrand || !TenantBrandingDisplayContextPolicy.UsesTenantVisualBrand(context))
            return renderedPng;

        TenantBrandingLogo logo = await _tenantBrandingService.GetLogoAsync(tenantId, context, cancellationToken);
        byte[]? logoChecksum = TryResolveLogoChecksumSha256(logo);

        if (logoChecksum is null)
            return renderedPng;

        return _brandedDiagramExportComposer.WrapRenderedPng(
            renderedPng,
            profile.CompanyDisplayName,
            logoChecksum);
    }

    private static byte[]? TryResolveLogoChecksumSha256(TenantBrandingLogo logo)
    {
        if (logo.AssetBytes is { Length: > 0 } assetBytes)
            return SHA256.HashData(assetBytes);

        if (!string.IsNullOrWhiteSpace(logo.HttpsUrl))
            return SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(logo.HttpsUrl.Trim()));

        return null;
    }
}
