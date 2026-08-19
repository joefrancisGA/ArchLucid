namespace ArchLucid.ArtifactSynthesis.Packaging;

/// <summary>One file entry inside <c>export-manifest.json</c> with a content SHA-256 anchor.</summary>
public sealed class ExportManifestFileEntry
{
    public string Path
    {
        get;
        init;
    } = null!;

    public string Sha256
    {
        get;
        init;
    } = null!;

    public int Bytes
    {
        get;
        init;
    }
}
