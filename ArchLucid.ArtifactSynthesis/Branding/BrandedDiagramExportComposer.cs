namespace ArchLucid.ArtifactSynthesis.Branding;

/// <inheritdoc cref="IBrandedDiagramExportComposer" />
public sealed class BrandedDiagramExportComposer : IBrandedDiagramExportComposer
{
    public string DecorateMermaidSource(string mermaidSource, string? companyDisplayName) =>
        BrandedMermaidSourceDecorator.Decorate(mermaidSource, companyDisplayName);

    public byte[] WrapRenderedPng(byte[] renderedPng, string companyDisplayName, byte[] logoChecksumSha256) =>
        BrandedDiagramExportContainer.Wrap(renderedPng, companyDisplayName, logoChecksumSha256);

    public bool IsBrandedExportContainer(ReadOnlySpan<byte> payload) =>
        BrandedDiagramExportContainer.IsBrandedExportContainer(payload);

    public byte[]? TryReadLogoChecksumSha256(ReadOnlySpan<byte> payload) =>
        BrandedDiagramExportContainer.TryReadLogoChecksumSha256(payload);
}
