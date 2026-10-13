namespace ArchLucid.Application.SecureNow;

public sealed class CollectionRunArtifact
{
    public CollectionRunManifest Manifest { get; init; } = new();
    public byte[] ZipBytes { get; init; } = [];
}
