using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Branding;

/// <summary>
///     Applies tenant branding wrappers to generated diagram exports without mutating graph semantics.
/// </summary>
public interface IBrandedDiagramExportService
{
    Task<string> DecorateMermaidSourceForExportAsync(
        Guid tenantId,
        string mermaidSource,
        BrandingDisplayContext context,
        CancellationToken cancellationToken = default);

    Task<byte[]?> WrapRenderedPngForExportAsync(
        Guid tenantId,
        byte[]? renderedPng,
        BrandingDisplayContext context,
        CancellationToken cancellationToken = default);
}
