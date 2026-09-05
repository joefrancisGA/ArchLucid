namespace ArchLucid.ArtifactSynthesis.Branding;

/// <summary>
///     Pure branding wrapper for diagram exports. Does not mutate Mermaid graph semantics or severity coloring.
/// </summary>
public interface IBrandedDiagramExportComposer
{
    /// <summary>
    ///     Prepends an optional Mermaid title comment when <paramref name="companyDisplayName" /> is set.
    ///     Graph lines remain unchanged.
    /// </summary>
    string DecorateMermaidSource(string mermaidSource, string? companyDisplayName);

    /// <summary>
    ///     Wraps a rendered PNG with tenant branding metadata when <paramref name="logoChecksumSha256" /> is provided.
    /// </summary>
    byte[] WrapRenderedPng(byte[] renderedPng, string companyDisplayName, byte[] logoChecksumSha256);

    /// <summary>Returns <see langword="true" /> when <paramref name="payload" /> uses the branded export container format.</summary>
    bool IsBrandedExportContainer(ReadOnlySpan<byte> payload);

    /// <summary>Reads the embedded logo checksum from a branded container, or <see langword="null" /> when not branded.</summary>
    byte[]? TryReadLogoChecksumSha256(ReadOnlySpan<byte> payload);
}
